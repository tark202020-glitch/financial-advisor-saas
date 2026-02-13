import { NextRequest, NextResponse } from 'next/server';
import {
    getFinancialStats,
    getIncomeStatement,
    getFinancialRatio,
    getGrowthRatio,
    getInvestorOpinion
} from '@/lib/kis/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;

    try {
        // Parallel Fetch for efficiency
        const [stats, incomeRaw, ratioRaw, growthRaw, opinion] = await Promise.all([
            getFinancialStats(symbol),
            getIncomeStatement(symbol),
            getFinancialRatio(symbol),
            getGrowthRatio(symbol),
            getInvestorOpinion(symbol,
                new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10).replace(/-/g, ""),
                new Date().toISOString().slice(0, 10).replace(/-/g, "")
            )
        ]);

        if (!stats) {
            return NextResponse.json({ error: 'Failed to fetch financial stats' }, { status: 500 });
        }

        // KIS API returns arrays (quarterly data) - take latest entry [0]
        const income = Array.isArray(incomeRaw) ? incomeRaw[0] : incomeRaw;
        const ratio = Array.isArray(ratioRaw) ? ratioRaw[0] : ratioRaw;
        const growth = Array.isArray(growthRaw) ? growthRaw[0] : growthRaw;

        const financials = {
            // Income Statement (FHKST66430200)
            revenue: income?.sale_account || income?.sales || '-',
            operating_profit: income?.bsop_prti || income?.operating_profit || '-',
            net_income: income?.thtr_ntin || income?.net_income || '-',

            // Financial Ratio (FHKST66430300) - Latest quarter [0]
            // Confirmed fields from debug: roe_val, grs, bsop_prfi_inrt, ntin_inrt, lblt_rate, rsrv_rate
            roe: ratio?.roe_val || '-',
            debt_ratio: ratio?.lblt_rate || '-',
            reserve_ratio: ratio?.rsrv_rate || '-',

            // Growth rates from ratio API (grs = 매출성장률, bsop_prfi_inrt = 영업이익증가율)
            growth_revenue: ratio?.grs || '-',
            growth_operating: ratio?.bsop_prfi_inrt || '-',
            growth_net_income: ratio?.ntin_inrt || '-',

            // Growth (FHKST66430800) - backup
            growth_revenue_alt: growth?.grs || growth?.sale_account_inrt || '-',
            growth_profit_alt: growth?.bsop_prfi_inrt || growth?.opr_pft_grs || '-',

            // Consensus (FHKST663300C0)
            consensus_score: opinion?.invt_opnn || opinion?.score || '-',
            consensus_price: opinion?.mbcr_prc || opinion?.target_price || '-'
        };

        return NextResponse.json({
            stats,
            financials
        });

    } catch (error: any) {
        console.error("API Company Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
