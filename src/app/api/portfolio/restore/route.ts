import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const backupData = await request.json();

        // Validate
        if (!backupData.portfolios || !Array.isArray(backupData.portfolios)) {
            return NextResponse.json({ error: '올바른 백업 파일이 아닙니다.' }, { status: 400 });
        }

        // Step 1: Delete all existing trade_logs for this user
        const { error: deleteTradesError } = await supabase
            .from('trade_logs')
            .delete()
            .eq('user_id', user.id);

        if (deleteTradesError) {
            console.error('[Restore] Delete trades error:', deleteTradesError);
            throw new Error('기존 거래내역 삭제 실패');
        }

        // Step 2: Delete all existing portfolios for this user
        const { error: deletePortfoliosError } = await supabase
            .from('portfolios')
            .delete()
            .eq('user_id', user.id);

        if (deletePortfoliosError) {
            console.error('[Restore] Delete portfolios error:', deletePortfoliosError);
            throw new Error('기존 포트폴리오 삭제 실패');
        }

        // Step 3: Insert new portfolios from backup
        let restoredCount = 0;

        for (const portfolio of backupData.portfolios) {
            const { data: newPortfolio, error: insertError } = await supabase
                .from('portfolios')
                .insert({
                    user_id: user.id,
                    symbol: portfolio.symbol,
                    name: portfolio.name,
                    sector: portfolio.sector || null,
                    secondary_category: portfolio.secondary_category || null,
                    quantity: portfolio.quantity,
                    buy_price: portfolio.buy_price,
                    memo: portfolio.memo || null,
                    buy_target: portfolio.buy_target || null,
                    sell_target: portfolio.sell_target || null,
                })
                .select()
                .single();

            if (insertError) {
                console.error('[Restore] Insert portfolio error:', insertError, portfolio.symbol);
                continue; // Skip this portfolio but continue with others
            }

            restoredCount++;

            // Step 4: Insert trade logs for this portfolio
            if (portfolio.trade_logs && portfolio.trade_logs.length > 0) {
                const tradesToInsert = portfolio.trade_logs.map((t: any) => ({
                    portfolio_id: newPortfolio.id,
                    user_id: user.id,
                    type: t.type,
                    price: t.price,
                    quantity: t.quantity,
                    trade_date: t.trade_date,
                    kospi_index: t.kospi_index || null,
                    memo: t.memo || null,
                }));

                const { error: tradeInsertError } = await supabase
                    .from('trade_logs')
                    .insert(tradesToInsert);

                if (tradeInsertError) {
                    console.error('[Restore] Insert trades error:', tradeInsertError, portfolio.symbol);
                }
            }
        }

        return NextResponse.json({
            success: true,
            restoredCount,
            message: `${restoredCount}개 종목이 복원되었습니다.`,
        });
    } catch (error: any) {
        console.error('[Restore] Error:', error);
        return NextResponse.json({ error: error.message || '복원 실패' }, { status: 500 });
    }
}
