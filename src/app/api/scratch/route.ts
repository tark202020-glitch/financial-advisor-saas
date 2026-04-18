import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getKsdinfoDividend } from "@/lib/kis/client";

export async function GET() {
    try {
        const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
        const rawData = fs.readFileSync(unifiedPath, 'utf-8');
        const allStocks = JSON.parse(rawData);

        const coveredCalls = allStocks.filter((s:any) => s.name && (s.name.includes('커버드') || s.name.includes('배당프리미엄') || s.name.includes('TIGER 배당')));
        
        // tiger 배당프리미엄액티브 (232080?), TIGER 배당커버드콜?
        
        let testCode = coveredCalls.find((s:any) => s.name.includes('프리미엄') || s.name.includes('커버드콜'))?.symbol || '289040';
        
        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const todayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
        
        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const fromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        const actualDividends = await getKsdinfoDividend({
            gb1: '0',
            f_dt: fromDate,
            t_dt: todayStr,
            sht_cd: testCode,
        });

        return NextResponse.json({
            coveredCalls: coveredCalls.slice(0, 20),
            testCode,
            actualDividends
        });
    } catch(e:any) {
        return NextResponse.json({ error: e.message });
    }
}
