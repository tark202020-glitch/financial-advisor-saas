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
        const [stats, income, ratio, growth, opinion] = await Promise.all([
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

        // Mapping Logic
        // Currently assuming 'output' keys or defaulting to '-'
        const financials = {
            // Income Statement (FHKST66430200)
            revenue: income?.sale_account || income?.sales || '-',
            operating_profit: income?.bsop_prti || income?.operating_profit || '-',
            net_income: income?.thtr_ntin || income?.net_income || '-',

            // Financial Ratio (FHKST66430300) - Previously Balance Sheet
            // We map relevant stability/profitability ratios here if available, 
            // OR if the user intends this to be "Balance Sheet" data (Assets/Debt), we check keys.
            // "Financial Ratio" usually has ROE, ROA, Debt Ratio (lblt_rate).
            // Let's assume standard keys for now.
            assets: ratio?.total_assets || '-', // Might not exist in Ratio API
            debt: ratio?.total_liabilities || '-', // Might not exist
            debt_ratio: ratio?.lblt_rate || '-', // Debt Ratio
            reserve_ratio: ratio?.rsrv_rate || '-', // Reserve Ratio

            // Growth (FHKST66430800)
            growth_revenue: growth?.sales_growth || growth?.grs || '-',
            growth_profit: growth?.profit_growth || growth?.opr_pft_grs || '-',

            // Consensus (FHKST663300C0)
            // Likely keys: 'invt_opnn' (Opinion), 'mbcr_prc' (Target Price)
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
