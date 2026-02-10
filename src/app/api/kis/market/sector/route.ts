
import { NextResponse } from 'next/server';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET, kisRateLimiter } from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

// KOSPI sector codes matching HTS 0218
const KOSPI_SECTORS = [
    { code: '0001', name: '종합' },
    { code: '0002', name: '대형주' },
    { code: '0003', name: '중형주' },
    { code: '0004', name: '소형주' },
    { code: '0005', name: '음식료·담배' },
    { code: '0006', name: '섬유·의류' },
    { code: '0007', name: '종이·목재' },
    { code: '0008', name: '화학' },
    { code: '0009', name: '제약' },
    { code: '0010', name: '비금속' },
    { code: '0011', name: '금속' },
    { code: '0012', name: '기계·장비' },
    { code: '0013', name: '전기·전자' },
    { code: '0014', name: '의료정밀기기' },
    { code: '0015', name: '운송장비·부품' },
    { code: '0016', name: '유통' },
    { code: '0017', name: '전기·가스' },
    { code: '0018', name: '건설' },
    { code: '0019', name: '운송·창고' },
    { code: '0020', name: '통신' },
    { code: '0021', name: '금융' },
    { code: '0024', name: '증권' },
    { code: '0025', name: '보험' },
    { code: '0026', name: '일반서비스' },
    { code: '0028', name: '제조' },
];

export async function GET() {
    try {
        const token = await getAccessToken();
        const headers = {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHPUP02100000",
            "custtype": "P"
        };

        const results: any[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < KOSPI_SECTORS.length; i += BATCH_SIZE) {
            const batch = KOSPI_SECTORS.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(async (sector) => {
                    try {
                        const data = await kisRateLimiter.add(async () => {
                            const res = await fetch(
                                `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-index-price?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${sector.code}`,
                                { headers }
                            );
                            if (!res.ok) return null;
                            return res.json();
                        });

                        if (data?.output) {
                            return {
                                code: sector.code,
                                name: sector.name,
                                index: parseFloat(data.output.bstp_nmix_prpr || '0'),
                                change: parseFloat(data.output.bstp_nmix_prdy_vrss || '0'),
                                changeRate: parseFloat(data.output.bstp_nmix_prdy_ctrt || '0'),
                                sign: data.output.prdy_vrss_sign, // 2=up, 5=down
                            };
                        }
                        return null;
                    } catch {
                        return null;
                    }
                })
            );
            batchResults.forEach(r => { if (r) results.push(r); });
        }

        return NextResponse.json({ sectors: results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
