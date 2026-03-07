import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        // Fetch all portfolios with trade logs
        const { data: portfolios, error: queryError } = await supabase
            .from('portfolios')
            .select('*, trade_logs(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (queryError) throw queryError;

        // Build backup data
        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            userId: user.id,
            userEmail: user.email,
            portfolios: (portfolios || []).map((p: any) => ({
                symbol: p.symbol,
                name: p.name,
                sector: p.sector,
                secondary_category: p.secondary_category,
                quantity: p.quantity,
                buy_price: p.buy_price,
                memo: p.memo,
                buy_target: p.buy_target,
                sell_target: p.sell_target,
                created_at: p.created_at,
                trade_logs: (p.trade_logs || []).map((t: any) => ({
                    type: t.type,
                    price: t.price,
                    quantity: t.quantity,
                    trade_date: t.trade_date,
                    kospi_index: t.kospi_index,
                    memo: t.memo,
                })),
            })),
        };

        return NextResponse.json(backupData);
    } catch (error: any) {
        console.error('[Backup] Error:', error);
        return NextResponse.json({ error: error.message || '백업 실패' }, { status: 500 });
    }
}
