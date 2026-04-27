import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatch } from '@/lib/push/dispatcher';
import { getMarketType } from '@/utils/market';

/**
 * /api/push/generate-weekly-report
 * 
 * 월간 투자리포트를 생성하고 Push 알림을 발송합니다.
 * 
 * Hobby 플랜 제약으로 Vercel Cron 대신 수동/외부 트리거 방식으로 호출됩니다.
 * - 수동 테스트: 계정 설정에서 "테스트 발송" 버튼
 * - 운영: GitHub Actions cron 또는 외부 스케줄러
 * 
 * GET: 현재 로그인 사용자 1명의 리포트 생성 (테스트용)
 * POST: 전체 사용자 또는 지정 사용자 리포트 생성 (운영용, CRON_SECRET 필요)
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
 * GET — 현재 로그인한 사용자의 월간 리포트 생성 (테스트용)
 */
export async function GET(request: NextRequest) {
  try {
    // 로그인 사용자 확인 (쿠키 기반)
    const { createClient: createAuthClient } = await import('@/utils/supabase/server');
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = request.nextUrl.origin;
    const result = await generateMonthlyReport(user.id, baseUrl);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Monthly Report] GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST — 전체/지정 사용자 리포트 생성 (운영용, 인증 필요)
 * Body: { targetUsers?: string[] }  // 생략 시 전체 활성 사용자
 */
export async function POST(request: NextRequest) {
  try {
    // CRON_SECRET 인증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUsers: string[] | undefined = body.targetUsers;
    const baseUrl = request.nextUrl.origin;

    const supabase = getServiceClient();

    // 대상 사용자 결정
    let userIds: string[] = [];

    if (targetUsers && targetUsers.length > 0) {
      userIds = targetUsers;
    } else {
      // 주간 리포트 수신 활성 사용자 조회
      const { data: settings } = await supabase
        .from('user_notification_settings')
        .select('user_id')
        .eq('monthly_report_enabled', true)
        .eq('email_enabled', true)
        .not('notification_email', 'is', null);

      userIds = (settings || []).map((s: any) => s.user_id);
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: '알림 설정된 사용자가 없습니다.',
        generated: 0,
      });
    }

    // 각 사용자별 리포트 생성
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
      success: true,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('[Monthly Report] POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 개별 사용자의 월간 리포트 생성
 */
async function generateMonthlyReport(userId: string, baseUrl: string) {
  const supabase = getServiceClient();

  // 1. 기간 계산 (오늘 기준 30일 전 ~ 어제)
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const endDate = new Date(kstNow);
  endDate.setDate(endDate.getDate() - 1); // 어제
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29); // 30일 전

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`[Monthly Report] Generating for user ${userId}: ${startDateStr} ~ ${endDateStr}`);

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

  // 3. 매매 내역 조회
  const { data: trades } = await supabase
    .from('trade_logs')
    .select(`
      id, trade_date, type, price, quantity, 
      portfolios(symbol, name, category)
    `)
    .eq('user_id', userId)
    .gte('trade_date', startDateStr)
    .lte('trade_date', endDateStr)
    .order('trade_date', { ascending: true });

  const tradeLogs = (trades || []).map((t: any) => {
    const port = Array.isArray(t.portfolios) ? t.portfolios[0] : t.portfolios;
    return {
      id: t.id,
      trade_date: t.trade_date,
      type: t.type,
      price: t.price,
      quantity: t.quantity,
      symbol: port?.symbol || '',
      name: port?.name || '',
      category: port?.category || getMarketType(port?.symbol || ''),
    };
  });

  // 4. KPI 계산
  let summary: any = null;
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
      startInvestment: first.investment,
      startValuation: first.valuation,
      endInvestment: last.investment,
      endValuation: last.valuation,
    };
  }

  // 5. 매매 요약
  let totalBuy = 0, totalSell = 0, totalDividend = 0;
  tradeLogs.forEach((t: any) => {
    const amt = t.price * t.quantity;
    if (t.type === 'BUY') totalBuy += amt;
    else if (t.type === 'SELL') totalSell += amt;
    else if (t.type === 'DIVIDEND') totalDividend += amt;
  });

  const tradeSummary = { totalBuy, totalSell, totalDividend, tradeCount: tradeLogs.length };

  // ──── 6. 현재 보유 종목 현황 조회 ────
  const { data: portfolioRows } = await supabase
    .from('portfolios')
    .select('symbol, name, quantity, buy_price')
    .eq('user_id', userId)
    .gt('quantity', 0);

  // 가장 최근 스냅샷에서 현재가 추출
  const latestSnapshot = historyData && historyData.length > 0
    ? historyData[historyData.length - 1].assets_snapshot
    : null;

  const snapshotPriceMap: Record<string, number> = {};
  if (latestSnapshot && Array.isArray(latestSnapshot)) {
    latestSnapshot.forEach((asset: any) => {
      snapshotPriceMap[asset.symbol] = asset.current_price || 0;
    });
  }

  const holdings = (portfolioRows || []).map((p: any) => {
    const category = getMarketType(p.symbol);
    const currentPrice = snapshotPriceMap[p.symbol] || p.buy_price;
    const qty = Number(p.quantity);
    const buyPrice = Number(p.buy_price);
    const totalInvested = buyPrice * qty;
    const totalValuation = currentPrice * qty;
    const profitRate = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

    return {
      symbol: p.symbol,
      name: p.name,
      category,
      quantity: qty,
      buyPrice,
      currentPrice,
      totalInvested,
      totalValuation,
      profitRate,
    };
  }).sort((a: any, b: any) => b.totalValuation - a.totalValuation);

  // ──── 7. 주간 하이라이트: 보유 종목 중 가장 많이 오른/내린 종목 ────
  let weeklyHighlights: any = null;
  if (historyData && historyData.length >= 2) {
    const firstSnap = historyData[0].assets_snapshot;
    const lastSnap = historyData[historyData.length - 1].assets_snapshot;

    if (firstSnap && lastSnap && Array.isArray(firstSnap) && Array.isArray(lastSnap)) {
      const firstMap = new Map(firstSnap.map((a: any) => [a.symbol, a]));
      const changes: any[] = [];

      lastSnap.forEach((last: any) => {
        const first: any = firstMap.get(last.symbol);
        if (first && first.current_price > 0 && last.current_price > 0) {
          const changeRate = ((last.current_price - first.current_price) / first.current_price) * 100;
          changes.push({
            symbol: last.symbol,
            name: last.name,
            startPrice: first.current_price,
            endPrice: last.current_price,
            changeRate,
          });
        }
      });

      changes.sort((a, b) => b.changeRate - a.changeRate);

      weeklyHighlights = {
        topGainer: changes.length > 0 ? changes[0] : null,
        topLoser: changes.length > 0 ? changes[changes.length - 1] : null,
        totalHoldings: holdings.length,
        gainers: changes.filter(c => c.changeRate > 0).length,
        losers: changes.filter(c => c.changeRate < 0).length,
        unchanged: changes.filter(c => c.changeRate === 0).length,
      };
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
        weeklyHighlights,
      },
      status: chartData.length > 0 ? 'ready' : 'failed',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 보관
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
    expiresInDays: 30,
  }, baseUrl);

  console.log(`[Monthly Report] User ${userId}: sent=${dispatchResult.sent}, failed=${dispatchResult.failed}`);

  return {
    success: true,
    contentId: content.id,
    period: `${startDateStr} ~ ${endDateStr}`,
    dataPoints: chartData.length,
    tradeCount: tradeLogs.length,
    holdingsCount: holdings.length,
    summary: summary ? {
      pureProfit: summary.pureProfit,
      returnRate: summary.returnRate,
    } : null,
    dispatch: dispatchResult,
  };
}
