import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatch } from '@/lib/push/dispatcher';
import { getMarketType } from '@/utils/market';
import { fetchBatchPrices } from '@/lib/kis/batchPrice';

/**
 * /api/cron/monthly-report
 * 
 * Vercel Cron으로 매월 1일에 자동 실행됩니다.
 * 전월 1일 ~ 전월 말일 기간의 투자 리포트를 생성하고 이메일로 발송합니다.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatAsKisDate(dateStr: string) {
  return dateStr.replace(/-/g, '');
}

/**
 * GET — Vercel Cron 또는 수동 호출
 * Vercel Cron은 CRON_SECRET 헤더를 자동으로 전송합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // CRON_SECRET 인증 (Vercel Cron이 자동으로 전송)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Vercel Cron이 아닌 경우, 로그인 사용자 확인
      const { createClient: createAuthClient } = await import('@/utils/supabase/server');
      const supabase = await createAuthClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 로그인 사용자 → 개인 리포트만 생성
      const baseUrl = request.nextUrl.origin;
      const isTest = request.nextUrl.searchParams.get('test') === 'true';
      const result = await generateMonthlyReport(user.id, baseUrl, isTest);
      return NextResponse.json(result);
    }

    // Vercel Cron → 전체 활성 사용자 리포트 생성
    const supabase = getServiceClient();
    const baseUrl = request.nextUrl.origin;

    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('user_id')
      .eq('monthly_report_enabled', true)
      .eq('email_enabled', true)
      .not('notification_email', 'is', null);

    const userIds: string[] = (settings || []).map((s: any) => s.user_id);

    if (userIds.length === 0) {
      return NextResponse.json({ message: 'No active users', total: 0 });
    }

    console.log(`[Monthly Report Cron] Processing ${userIds.length} users`);

    const results = [];
    for (const userId of userIds) {
      try {
        const result = await generateMonthlyReport(userId, baseUrl);
        results.push({ userId, ...result });
      } catch (e: any) {
        results.push({ userId, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      total: userIds.length,
      results,
    });
  } catch (error: any) {
    console.error('[Monthly Report Cron] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 개별 사용자의 월간 리포트 생성
 */
async function generateMonthlyReport(userId: string, baseUrl: string, isTest: boolean = false) {
  const supabase = getServiceClient();

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = kstNow.getFullYear();
  const month = kstNow.getMonth(); // 0-indexed (현재월)

  let startDate, endDate;

  if (isTest) {
    // 테스트 모드: 당월 1일 ~ 당일
    startDate = new Date(Date.UTC(year, month, 1));
    endDate = new Date(kstNow); // 오늘
  } else {
    // 실제 발송: 전월 1일 ~ 전월 말일 (예: 5월 1일 실행 → 4월 1일 ~ 4월 30일)
    startDate = new Date(Date.UTC(year, month - 1, 1));
    endDate = new Date(Date.UTC(year, month, 0)); // 전월 말일
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`[Monthly Report] Generating for user ${userId}: ${startDateStr} ~ ${endDateStr} (isTest: ${isTest})`);

  // 2. portfolio_daily_history에서 캐시된 데이터 조회
  const { data: historyData } = await supabase
    .from('portfolio_daily_history')
    .select('record_date, total_investment, total_valuation, assets_snapshot')
    .eq('user_id', userId)
    .gte('record_date', startDateStr)
    .lte('record_date', endDateStr)
    .order('record_date', { ascending: true });

  const chartData = (historyData || []).map((d: any) => ({
    date: d.record_date,
    investment: d.total_investment,
    valuation: d.total_valuation,
  }));

  // 2-1. 전체 기간 데이터 조회 (최초 기록 + 최신 기록)
  let overallSummary: any = null;
  try {
    const { data: firstRecord } = await supabase
      .from('portfolio_daily_history')
      .select('record_date, total_investment, total_valuation')
      .eq('user_id', userId)
      .order('record_date', { ascending: true })
      .limit(1)
      .single();

    const { data: latestRecord } = await supabase
      .from('portfolio_daily_history')
      .select('record_date, total_investment, total_valuation')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .limit(1)
      .single();

    if (firstRecord && latestRecord) {
      const totalInvestment = latestRecord.total_investment;
      const totalValuation = latestRecord.total_valuation;
      const totalProfit = totalValuation - totalInvestment;
      const totalReturnRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

      overallSummary = {
        totalInvestment,
        totalValuation,
        totalProfit,
        totalReturnRate,
        firstDate: firstRecord.record_date,
        latestDate: latestRecord.record_date,
      };
      console.log(`[Monthly Report] 전체 기간: ${firstRecord.record_date} ~ ${latestRecord.record_date}, 수익률: ${totalReturnRate.toFixed(2)}%`);
    }
  } catch (e) {
    console.warn('[Monthly Report] 전체 기간 데이터 조회 실패:', e);
  }

  // 3. 매매 내역 조회
  const { data: trades } = await supabase
    .from('trade_logs')
    .select(`
      id, user_id, asset_id, type, price, quantity,
      trade_date, exchange_rate_used, memo,
      assets!inner(name, ticker, category, market)
    `)
    .eq('user_id', userId)
    .gte('trade_date', startDateStr)
    .lte('trade_date', endDateStr)
    .order('trade_date', { ascending: false });

  const tradeLogs = (trades || []).map((t: any) => ({
    ...t,
    name: t.assets?.name || '',
    ticker: t.assets?.ticker || '',
    category: t.assets?.category || '',
    market: t.assets?.market || '',
    exchangeRateUsed: t.exchange_rate_used || 1,
  }));

  // 4. 요약 데이터 계산
  let summary = null;
  if (chartData.length >= 2) {
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const periodTotalChange = last.valuation - first.valuation;
    const periodInvestmentChange = last.investment - first.investment;
    const pureProfit = periodTotalChange - periodInvestmentChange;
    const returnRate = first.investment > 0 ? (pureProfit / first.investment) * 100 : 0;
    summary = {
      periodTotalChange,
      periodInvestmentChange,
      pureProfit,
      returnRate,
      periodReturnRate: returnRate,
      startInvestment: first.investment,
      startValuation: first.valuation,
      endInvestment: last.investment,
      endValuation: last.valuation,
    };
  }

  // 5. 매매 요약
  let totalBuy = 0, totalSell = 0, totalDividend = 0;
  tradeLogs.forEach((log: any) => {
    const rate = log.exchangeRateUsed || 1;
    const amt = log.price * log.quantity * rate;
    if (log.type === 'BUY') totalBuy += amt;
    else if (log.type === 'SELL') totalSell += amt;
    else if (log.type === 'DIVIDEND') totalDividend += amt;
  });
  const tradeSummary = { totalBuy, totalSell, totalDividend };

  // 6. 보유 종목 현황 (마지막 날의 스냅샷 + KIS API 현재가 조회)
  let holdings: any[] = [];
  const lastHistory = historyData?.[historyData.length - 1];
  if (lastHistory?.assets_snapshot) {
    try {
      const snapshot = typeof lastHistory.assets_snapshot === 'string'
        ? JSON.parse(lastHistory.assets_snapshot)
        : lastHistory.assets_snapshot;
      
      if (Array.isArray(snapshot)) {
        holdings = snapshot.map((asset: any) => ({
          name: asset.name || asset.ticker || asset.symbol || '알 수 없음',
          ticker: asset.ticker || asset.symbol || '',
          quantity: asset.quantity || 0,
          avgPrice: asset.buy_price || asset.avg_price || asset.avgPrice || 0,
          currentPrice: asset.current_price || asset.currentPrice || 0, // 스냅샷 가격 (폴백)
          market: asset.market || asset.category || 'KRX',
          marketType: getMarketType(asset.ticker || asset.symbol || ''),
          exchangeRate: asset.exchange_rate || asset.exchangeRate || 1,
        }));
      }
    } catch (e) {
      console.error('[Monthly Report] Holdings parse error:', e);
    }
  }

  // 6-1. KIS API로 실시간 현재가 배치 조회 (rate limit 회피 로직 내장)
  if (holdings.length > 0) {
    try {
      // KR / US 종목 분류
      const krSymbols = holdings.filter(h => h.marketType === 'KR').map(h => h.ticker).filter(Boolean);
      const usSymbols = holdings.filter(h => h.marketType === 'US').map(h => h.ticker).filter(Boolean);

      console.log(`[Monthly Report] 현재가 조회: KR ${krSymbols.length}개, US ${usSymbols.length}개`);

      // KR 현재가 조회
      const krPrices = krSymbols.length > 0 ? await fetchBatchPrices(krSymbols, 'KR') : {};

      // KR → US 간 2초 간격 (토큰 공유 시 rate limit 보호)
      if (krSymbols.length > 0 && usSymbols.length > 0) {
        await new Promise(r => setTimeout(r, 2000));
      }

      // US 현재가 조회
      const usPrices = usSymbols.length > 0 ? await fetchBatchPrices(usSymbols, 'US') : {};

      // holdings에 현재가 업데이트 (API 성공 시 스냅샷 가격 대체)
      let updatedCount = 0;
      holdings = holdings.map(h => {
        const prices = h.marketType === 'KR' ? krPrices : usPrices;
        const livePrice = prices[h.ticker];
        if (livePrice && livePrice.price > 0) {
          updatedCount++;
          return { ...h, currentPrice: livePrice.price };
        }
        return h; // API 실패 시 스냅샷 가격 유지
      });

      console.log(`[Monthly Report] 현재가 업데이트: ${updatedCount}/${holdings.length}개 종목`);
    } catch (e: any) {
      console.error('[Monthly Report] 현재가 조회 실패 (스냅샷 가격 유지):', e.message);
      // 실패 시에도 스냅샷 가격으로 계속 진행
    }
  }

  // 7. 월간 하이라이트 계산
  let monthlyHighlights: any = null;
  if (holdings.length > 0 && chartData.length >= 2) {
    try {
      const holdingsWithChange = holdings.map(h => {
        const changeRate = h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
        return { ...h, changeRate };
      });

      const gainers = holdingsWithChange.filter(h => h.changeRate > 0).length;
      const losers = holdingsWithChange.filter(h => h.changeRate < 0).length;
      const unchanged = holdingsWithChange.filter(h => h.changeRate === 0).length;

      const sorted = [...holdingsWithChange].sort((a, b) => b.changeRate - a.changeRate);
      const topGainer = sorted[0]?.changeRate > 0 ? sorted[0] : null;
      const topLoser = sorted[sorted.length - 1]?.changeRate < 0 ? sorted[sorted.length - 1] : null;

      monthlyHighlights = {
        gainers,
        losers,
        unchanged,
        topGainer: topGainer ? { name: topGainer.name, changeRate: topGainer.changeRate } : null,
        topLoser: topLoser ? { name: topLoser.name, changeRate: topLoser.changeRate } : null,
      };
    } catch (e) {
      console.error('[Monthly Report] Highlights error:', e);
    }
  }

  // 8. push_content에 저장
  const { data: content, error: contentError } = await supabase
    .from('push_content')
    .insert({
      user_id: userId,
      content_type: 'monthly_report',
      title: `월간 투자리포트 (${startDateStr} ~ ${endDateStr})`,
      payload: {
        startDate: startDateStr,
        endDate: endDateStr,
        chartData,
        tradeLogs,
        summary,
        tradeSummary,
        holdings,
        weeklyHighlights: monthlyHighlights,
        overallSummary,
      },
      status: chartData.length > 0 ? 'ready' : 'failed',
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90일 보관
    })
    .select()
    .single();

  if (contentError) {
    console.error('[Monthly Report] Content save error:', contentError);
    throw new Error(`리포트 저장 실패: ${contentError.message}`);
  }

  // 9. Push Dispatcher로 알림 발송
  const formatKrw = (val: number) => {
    if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(2)}억원`;
    if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)}만원`;
    return `${val.toLocaleString()}원`;
  };

  const profitText = summary
    ? `${summary.returnRate >= 0 ? '+' : ''}${summary.returnRate.toFixed(1)}% (${summary.pureProfit >= 0 ? '+' : ''}${formatKrw(summary.pureProfit)})`
    : '데이터 부족';

  const dispatchResult = await dispatch({
    eventType: 'monthly_report',
    userId,
    title: '월간리포트가 발행되었습니다',
    body: `${startDateStr} ~ ${endDateStr} 투자 성과: ${profitText}`,
    contentId: content.id,
    contentUrl: '/report',
    data: { startDate: startDateStr, endDate: endDateStr },
    expiresInDays: 90,
  }, baseUrl);

  console.log(`[Monthly Report] User ${userId}: sent=${dispatchResult.sent}, failed=${dispatchResult.failed}`);

  return {
    success: true,
    contentId: content.id,
    period: `${startDateStr} ~ ${endDateStr}`,
    dataPoints: chartData.length,
    tradeCount: tradeLogs.length,
    dispatch: dispatchResult,
  };
}
