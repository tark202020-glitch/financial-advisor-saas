import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * KRX 데이터 소스 연결 진단 API
 * 세션 쿠키 획득 → JSON API → OTP/CSV 전 과정을 테스트합니다.
 */
export async function GET() {
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

    const KRX_HEADERS: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
        'Origin': 'https://data.krx.co.kr',
        'X-Requested-With': 'XMLHttpRequest',
    };

    // === Test 0: KRX 세션 쿠키 획득 ===
    let sessionCookie = '';
    try {
        const start = Date.now();
        const res = await fetch('https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101', {
            method: 'GET',
            headers: KRX_HEADERS,
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
        });

        const cookies: string[] = [];
        if (typeof (res.headers as any).getSetCookie === 'function') {
            const setCookies = (res.headers as any).getSetCookie() as string[];
            for (const sc of setCookies) {
                const cookiePart = sc.split(';')[0].trim();
                if (cookiePart) cookies.push(cookiePart);
            }
        } else {
            const raw = res.headers.get('set-cookie') || '';
            if (raw) {
                for (const part of raw.split(/,(?=[^;]*=)/)) {
                    const cookiePart = part.split(';')[0].trim();
                    if (cookiePart) cookies.push(cookiePart);
                }
            }
        }

        sessionCookie = cookies.join('; ');
        const elapsed = Date.now() - start;

        // 응답 헤더 전체 로깅
        const headerMap: Record<string, string> = {};
        res.headers.forEach((value, key) => {
            headerMap[key] = value.slice(0, 200);
        });

        results.tests['session'] = {
            status: res.status,
            elapsed_ms: elapsed,
            cookie: sessionCookie || '(empty)',
            cookie_count: cookies.length,
            all_headers: headerMap,
        };
    } catch (e: any) {
        results.tests['session'] = { error: e.message };
    }

    // === Test 1: KRX JSON API + 세션 쿠키 → ETF 시세 ===
    try {
        const start = Date.now();
        const headers: Record<string, string> = {
            ...KRX_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        };
        if (sessionCookie) headers['Cookie'] = sessionCookie;

        const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
            method: 'POST',
            headers,
            body: new URLSearchParams({
                locale: 'ko_KR',
                mktId: 'ETF',
                trdDd: '20260418',
                share: '1',
                money: '1',
                bld: 'dbms/MDC/STAT/standard/MDCSTAT04301',
            }).toString(),
            signal: AbortSignal.timeout(15000),
        });

        const elapsed = Date.now() - start;
        const text = await res.text();

        if (text.trim() === 'LOGOUT') {
            results.tests['json_price_with_session'] = {
                status: res.status,
                elapsed_ms: elapsed,
                result: 'LOGOUT (세션 쿠키 무효)',
            };
        } else {
            try {
                const data = JSON.parse(text);
                const items = data.OutBlock_1 || data.output || data.block1 || [];
                const keys = Array.isArray(items) && items.length > 0 ? Object.keys(items[0]) : [];
                results.tests['json_price_with_session'] = {
                    status: res.status,
                    elapsed_ms: elapsed,
                    item_count: Array.isArray(items) ? items.length : 'N/A',
                    field_names: keys.slice(0, 20),
                    sample: Array.isArray(items) && items.length > 0 ? items[0] : null,
                    raw_keys: Object.keys(data),
                };
            } catch {
                results.tests['json_price_with_session'] = {
                    status: res.status,
                    elapsed_ms: elapsed,
                    raw_preview: text.slice(0, 300),
                };
            }
        }
    } catch (e: any) {
        results.tests['json_price_with_session'] = { error: e.message };
    }

    // === Test 2: KRX JSON API + 세션 쿠키 → ETF 분배금 ===
    try {
        const start = Date.now();
        const headers: Record<string, string> = {
            ...KRX_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        };
        if (sessionCookie) headers['Cookie'] = sessionCookie;

        const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
            method: 'POST',
            headers,
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
        const text = await res.text();

        if (text.trim() === 'LOGOUT') {
            results.tests['json_distribution_with_session'] = {
                status: res.status,
                elapsed_ms: elapsed,
                result: 'LOGOUT (세션 쿠키 무효)',
            };
        } else {
            try {
                const data = JSON.parse(text);
                const items = data.OutBlock_1 || data.output || data.block1 || [];
                const keys = Array.isArray(items) && items.length > 0 ? Object.keys(items[0]) : [];
                results.tests['json_distribution_with_session'] = {
                    status: res.status,
                    elapsed_ms: elapsed,
                    item_count: Array.isArray(items) ? items.length : 'N/A',
                    field_names: keys.slice(0, 20),
                    sample: Array.isArray(items) && items.length > 0 ? items[0] : null,
                    raw_keys: Object.keys(data),
                };
            } catch {
                results.tests['json_distribution_with_session'] = {
                    status: res.status,
                    elapsed_ms: elapsed,
                    raw_preview: text.slice(0, 300),
                };
            }
        }
    } catch (e: any) {
        results.tests['json_distribution_with_session'] = { error: e.message };
    }

    // === Test 3: 네이버 금융 ETF API ===
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
            elapsed_ms: elapsed,
            item_count: items.length,
        };
    } catch (e: any) {
        results.tests['naver_etf'] = { error: e.message };
    }

    return NextResponse.json(results, { status: 200 });
}
