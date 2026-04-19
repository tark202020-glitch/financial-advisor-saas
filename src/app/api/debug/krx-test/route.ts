import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * KRX 데이터 소스 연결 진단 API
 * Vercel 서버리스 환경에서 KRX JSON API / OTP/CSV 방식의 동작 여부를 확인합니다.
 */
export async function GET() {
    // 관리자만 접근 가능
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmails = ['tark202020@gmail.com', 'tark2020@naver.com'];
    if (!user?.email || !adminEmails.includes(user.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'Vercel' : 'Local',
        tests: {},
    };

    const KRX_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
    };

    // Test 1: KRX JSON API - ETF 시세
    try {
        const start = Date.now();
        const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
            method: 'POST',
            headers: {
                ...KRX_HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: new URLSearchParams({
                locale: 'ko_KR',
                mktId: 'ETF',
                trdDd: '20260418',  // 금요일
                share: '1',
                money: '1',
                bld: 'dbms/MDC/STAT/standard/MDCSTAT04301',
            }).toString(),
            signal: AbortSignal.timeout(15000),
        });

        const elapsed = Date.now() - start;
        const data = await res.json();
        const items = data.OutBlock_1 || data.output || data.block1 || [];
        const keys = Array.isArray(items) && items.length > 0 ? Object.keys(items[0]) : [];

        results.tests['json_etf_price'] = {
            status: res.status,
            ok: res.ok,
            elapsed_ms: elapsed,
            item_count: Array.isArray(items) ? items.length : 'N/A',
            field_names: keys.slice(0, 15),
            sample: Array.isArray(items) && items.length > 0 ? items[0] : null,
            raw_keys: Object.keys(data),
        };
    } catch (e: any) {
        results.tests['json_etf_price'] = { error: e.message };
    }

    // Test 2: KRX JSON API - ETF 분배금
    try {
        const start = Date.now();
        const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
            method: 'POST',
            headers: {
                ...KRX_HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: new URLSearchParams({
                locale: 'ko_KR',
                searchType: '1',
                mktId: 'ETF',
                isuCd: 'ALL',
                strtDd: '20250419',
                endDd: '20260418',
                bld: 'dbms/MDC/STAT/standard/MDCSTAT04802',
            }).toString(),
            signal: AbortSignal.timeout(15000),
        });

        const elapsed = Date.now() - start;
        const data = await res.json();
        const items = data.OutBlock_1 || data.output || data.block1 || [];
        const keys = Array.isArray(items) && items.length > 0 ? Object.keys(items[0]) : [];

        results.tests['json_etf_distribution'] = {
            status: res.status,
            ok: res.ok,
            elapsed_ms: elapsed,
            item_count: Array.isArray(items) ? items.length : 'N/A',
            field_names: keys.slice(0, 15),
            sample: Array.isArray(items) && items.length > 0 ? items[0] : null,
            raw_keys: Object.keys(data),
        };
    } catch (e: any) {
        results.tests['json_etf_distribution'] = { error: e.message };
    }

    // Test 3: KRX OTP 방식 - 시세
    try {
        const start = Date.now();
        const otpRes = await fetch('https://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd', {
            method: 'POST',
            headers: {
                ...KRX_HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                locale: 'ko_KR',
                mktId: 'ETF',
                trdDd: '20260418',
                share: '1',
                money: '1',
                url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
                csvxls_isNo: 'false',
                name: 'fileDown',
            }).toString(),
            signal: AbortSignal.timeout(10000),
        });

        const otp = await otpRes.text();
        const otpElapsed = Date.now() - start;

        results.tests['otp_price'] = {
            otp_status: otpRes.status,
            otp_ok: otpRes.ok,
            otp_length: otp.length,
            otp_preview: otp.slice(0, 50),
            otp_elapsed_ms: otpElapsed,
        };

        if (otpRes.ok && otp.length >= 10) {
            const dlStart = Date.now();
            const dlRes = await fetch('https://data.krx.co.kr/comm/fileDn/download_csv/download.cmd', {
                method: 'POST',
                headers: {
                    ...KRX_HEADERS,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `code=${otp}`,
                signal: AbortSignal.timeout(10000),
            });

            const buf = await dlRes.arrayBuffer();
            const csvText = new TextDecoder('euc-kr').decode(buf);
            const lines = csvText.trim().split('\n');
            const dlElapsed = Date.now() - dlStart;

            results.tests['otp_price'].csv_status = dlRes.status;
            results.tests['otp_price'].csv_ok = dlRes.ok;
            results.tests['otp_price'].csv_bytes = buf.byteLength;
            results.tests['otp_price'].csv_lines = lines.length;
            results.tests['otp_price'].csv_elapsed_ms = dlElapsed;
            results.tests['otp_price'].csv_header = lines[0]?.slice(0, 200);
            results.tests['otp_price'].csv_first_row = lines[1]?.slice(0, 200);
        }
    } catch (e: any) {
        results.tests['otp_price'] = { ...(results.tests['otp_price'] || {}), error: e.message };
    }

    // Test 4: 네이버 금융 ETF API
    try {
        const start = Date.now();
        const res = await fetch('https://finance.naver.com/api/sise/etfItemList.nhn', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(10000),
        });

        const data = await res.json();
        const items = data?.result?.etfItemList || [];
        const elapsed = Date.now() - start;

        results.tests['naver_etf'] = {
            status: res.status,
            ok: res.ok,
            elapsed_ms: elapsed,
            item_count: items.length,
            sample: items.length > 0 ? items[0] : null,
        };
    } catch (e: any) {
        results.tests['naver_etf'] = { error: e.message };
    }

    return NextResponse.json(results, { status: 200 });
}
