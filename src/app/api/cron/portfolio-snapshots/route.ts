import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDomesticPrice, getOverseasPrice, getGoldSpotPrice } from '@/lib/kis/client';
import { getMarketType } from '@/utils/market';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Vercel Cron 등 시스템 백그라운드 환경에서는 모든 유저 조회를 위해 Service Role Key나 Anon(RLS 우회 설정) 필요
// 여기서는 Anon 사용 시 RLS 통과를 위해 서버키 혼용 또는 service key fallback 을 고려 (보안 환경에 따라 조정)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    // Vercel Cron 인증 확인 (선택적)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Portfolio Snapshot] No CRON_SECRET auth — allowing for development');
    }

    try {
        console.log('[Portfolio Snapshot] Starting daily snapshot logging...');
        const startTime = Date.now();

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        });

        // 1. 모든 사용자의 포트폴리오(portfolios) 로드
        // (주의: RLS가 걸려있다면 SERVICE_ROLE_KEY가 없으면 빈 배열이 리턴될 수 있습니다.)
        const { data: portfolios, error } = await supabase.from('portfolios').select('*');
        if (error) throw error;
        
        const isAdminKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) : 'none';

        if (!portfolios || portfolios.length === 0) {
            return NextResponse.json({ 
                success: true, 
                message: "No portfolios found to snapshot. Check RLS or Service Role Key.", 
                debug: { isAdminKeySet, keyPrefix },
                elapsed_ms: Date.now() - startTime 
            });
        }

        // 2. 현재 보유중인 (quantity > 0) 포트폴리오만 식별 및 고유 Symbol 목록 추출
        const activePortfolios = portfolios.filter(p => Number(p.quantity) > 0);
        const uniqueSymbols = Array.from(new Set(activePortfolios.map(p => p.symbol)));
        
        console.log(`[Portfolio Snapshot] Found ${activePortfolios.length} active assets across users. Unique symbols: ${uniqueSymbols.length}`);

        // 2.5. 어제자 가격 조회를 위한 fallback 가격맵 구축
        const { data: recentHistory } = await supabase
            .from('portfolio_daily_history')
            .select('assets_snapshot')
            .order('record_date', { ascending: false });

        const fallbackPriceMap: Record<string, number> = {};
        if (recentHistory) {
            for (const row of recentHistory) {
                if (row.assets_snapshot) {
                    for (const asset of row.assets_snapshot) {
                        if (asset.current_price && !fallbackPriceMap[asset.symbol]) {
                            fallbackPriceMap[asset.symbol] = asset.current_price;
                        }
                    }
                }
            }
        }

        // 3. KIS API 호출하여 전 종목 현재가(또는 주간장 마감가) 가져오기
        const priceMap: Record<string, number> = {};
        const failedSymbols: string[] = [];
        
        // 병렬 요청으로 인한 Rate Limit 회피를 위해 KIS Client 내부의 kisRateLimiter 가 동작함
        const fetchPromises = uniqueSymbols.map(async (symbol) => {
            const category = getMarketType(symbol);
            let price = 0;
            let success = false;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    if (category === 'KR') {
                        const cleanSymbol = symbol.replace('.KS', '');
                        const res = await getDomesticPrice(cleanSymbol);
                        price = parseFloat(res?.stck_prpr || '0');
                    } else if (category === 'US') {
                        const res = await getOverseasPrice(symbol);
                        price = parseFloat(res?.last || '0');
                    } else if (category === 'GOLD') {
                        const res = await getGoldSpotPrice();
                        price = parseFloat(res?.stck_prpr || '0');
                    }
                    
                    if (price > 0 && !isNaN(price)) {
                        success = true;
                        break;
                    }
                } catch (e: any) {
                    console.warn(`[Portfolio Snapshot] fetch attempt ${attempt} failed for ${symbol}: ${e.message}`);
                }
                
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            if (success) {
                priceMap[symbol] = price;
            } else {
                console.error(`[Portfolio Snapshot] 실시간 가격 조회 최종 실패: ${symbol}. 전일 가격으로 Fallback을 시도합니다.`);
                failedSymbols.push(symbol);
                priceMap[symbol] = fallbackPriceMap[symbol] || 0;
            }
        });

        await Promise.all(fetchPromises);

        // 4. 환율 동기화 (US 종목 자산가치 원화 환산용)
        let exchangeRate = 1350; // default fallback
        try {
             // API Route 재귀 호출 (자기 주소 참조) 또는 market-extra
             const origin = request.nextUrl.origin;
             const exRes = await fetch(`${origin}/api/market-extra`, { cache: 'no-store' });
             if (exRes.ok) {
                 const exData = await exRes.json();
                 exchangeRate = exData.exchangeRates?.usd_krw?.price || 1350;
             }
        } catch (err) {
            console.warn('[Portfolio Snapshot] Exchange rate fetch failed, using fallback.');
        }

        // 5. 유저별 포트폴리오 그룹화
        const userPortfolios: Record<string, any[]> = {};
        for (const p of activePortfolios) {
            if (!userPortfolios[p.user_id]) userPortfolios[p.user_id] = [];
            userPortfolios[p.user_id].push(p);
        }

        // 6. KST 시간대 기준 포트폴리오 기준 날짜 구하기
        // Vercel 서버는 주기적인 UTC 동작하며 KST 보정을 위해 +9 시간 적용
        // 단, 자정 이후(0시 ~ 6시)에 API가 늦게 실행되는 경우 전날의 스냅샷으로 기록합니다. (4월 10일 누락 방지)
        const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
        if (kstDate.getUTCHours() < 6) {
            kstDate.setUTCDate(kstDate.getUTCDate() - 1);
        }
        const kstDateString = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // 7. 유저별 투자금/평가금/스냅샷 계산
        const snapshotsToInsert = [];
        
        for (const [userId, ports] of Object.entries(userPortfolios)) {
            let totalInvested = 0;
            let totalValuation = 0;
            const assetsSnapshot = [];

            for (const p of ports) {
                const category = getMarketType(p.symbol);
                const isFailed = failedSymbols.includes(p.symbol);
                
                let currentPrice = priceMap[p.symbol];
                if (currentPrice === 0) {
                     currentPrice = Number(p.buy_price); // final extreme fallback (if past history is missing too)
                }
                
                const exRateMultiplier = (category === 'US') ? exchangeRate : 1;
                
                const qty = Number(p.quantity);
                const investedKrw = Number(p.buy_price) * qty * exRateMultiplier;
                const valuationKrw = currentPrice * qty * exRateMultiplier;

                totalInvested += investedKrw;
                totalValuation += valuationKrw;

                assetsSnapshot.push({
                    symbol: p.symbol,
                    name: p.name,
                    category: category,
                    quantity: qty,
                    buy_price: Number(p.buy_price),
                    current_price: currentPrice,
                    invested_krw: investedKrw,
                    valuation_krw: valuationKrw,
                    is_failed: isFailed
                });
            }

            snapshotsToInsert.push({
                user_id: userId,
                record_date: kstDateString,
                total_investment: totalInvested,
                total_valuation: totalValuation,
                assets_snapshot: assetsSnapshot
            });
        }

        // 8. DB Upsert
        // 동일 유저, 동일 날짜에 대해서는 최신 스냅샷으로 Update (ON CONFLICT)
        const { error: insertError } = await supabase
            .from('portfolio_daily_history')
            .upsert(snapshotsToInsert, { onConflict: 'user_id, record_date' });

        if (insertError) {
            console.error('[Portfolio Snapshot] DB Insert Error:', insertError);
            throw insertError;
        }

        const elapsedMs = Date.now() - startTime;
        console.log(`[Portfolio Snapshot] Success! Snapshots saved for ${snapshotsToInsert.length} users. Elapsed: ${elapsedMs}ms`);

        return NextResponse.json({ 
            success: true, 
            count: snapshotsToInsert.length,
            record_date: kstDateString,
            elapsed_ms: elapsedMs 
        });

    } catch (error: any) {
        console.error('[Portfolio Snapshot] Critical Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
