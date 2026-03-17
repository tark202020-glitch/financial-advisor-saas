// 시장 브리핑 파이프라인 단계별 진단 스크립트

const GOOGLE_AI_API_KEY = 'AIzaSyAnmU56jeUCmgWcP4h2sR2Z7tGbY02KJLk';
const NAVER_CLIENT_ID = 'Nukiim_19IvMZtwKfb6m';
const NAVER_CLIENT_SECRET = 'mWKBIwAO5c';

async function main() {
    console.log('=== 시장 브리핑 파이프라인 단계별 진단 ===');
    console.log(`시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`);

    let totalArticles = 0;

    // ===== 1단계: RSS 뉴스 수집 =====
    console.log('--- 1단계: RSS 뉴스 수집 ---');
    const rssSources = [
        { name: '매일경제 증권', url: 'https://www.mk.co.kr/rss/40300001/' },
        { name: '연합뉴스 경제', url: 'https://www.yna.co.kr/rss/economy.xml' },
        { name: '인베스팅닷컴', url: 'https://kr.investing.com/rss/news.rss' },
    ];

    for (const source of rssSources) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(source.url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JubotNewsCollector/1.0)' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const text = await res.text();
                const itemCount = (text.match(/<item>/gi) || []).length;
                totalArticles += itemCount;
                console.log(`  ✅ ${source.name}: HTTP ${res.status}, ${itemCount}개 아이템`);
            } else {
                console.log(`  ❌ ${source.name}: HTTP ${res.status}`);
            }
        } catch (e) {
            const reason = e.name === 'AbortError' ? '타임아웃(6초)' : e.message;
            console.log(`  ❌ ${source.name}: ${reason}`);
        }
    }

    // ===== 2단계: 네이버 검색 API =====
    console.log('\n--- 2단계: 네이버 검색 API ---');
    if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        try {
            const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent('주식 증권 시장')}&display=10&sort=date`;
            const res = await fetch(url, {
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                }
            });
            if (res.ok) {
                const data = await res.json();
                const count = data.items?.length || 0;
                totalArticles += count;
                console.log(`  ✅ 네이버 검색 API: ${count}개 뉴스 수집`);
            } else {
                console.log(`  ❌ 네이버 검색 API: HTTP ${res.status}`);
                const text = await res.text();
                console.log(`     응답: ${text.slice(0, 200)}`);
            }
        } catch (e) {
            console.log(`  ❌ 네이버 검색 API: ${e.message}`);
        }
    } else {
        console.log('  ⚠️  네이버 API 키 없음');
    }

    console.log(`\n  📊 총 수집 뉴스: ${totalArticles}개`);

    // ===== 3단계: Gemini AI 테스트 =====
    console.log('\n--- 3단계: Gemini AI API 테스트 ---');
    if (GOOGLE_AI_API_KEY) {
        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent('간단히 "API 테스트 성공"이라고 응답하세요.');
            const text = result.response.text();
            console.log(`  ✅ Gemini API 정상: "${text.trim().slice(0, 50)}"`);
        } catch (e) {
            console.log(`  ❌ Gemini API 실패: ${e.message}`);
            if (e.message.includes('API_KEY_INVALID') || e.message.includes('403')) {
                console.log('  → GOOGLE_AI_API_KEY가 무효하거나 만료되었습니다!');
            }
            if (e.message.includes('quota') || e.message.includes('429')) {
                console.log('  → API 할당량(quota) 초과!');
            }
        }
    } else {
        console.log('  ❌ GOOGLE_AI_API_KEY 없음');
    }

    // ===== 4단계: 배포 환경 시뮬레이션 =====
    console.log('\n--- 4단계: 실제 배포 URL 테스트 ---');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초

        const res = await fetch('https://jubot.goraebang.com/api/jubot/analyze/daily?force=true', {
            signal: controller.signal,
            headers: { 'Cookie': '' } // 인증 없이 테스트
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        console.log(`  Status: ${res.status}`);
        console.log(`  Success: ${data.success}`);
        if (data.success) {
            console.log(`  ✅ 브리핑 생성 성공!`);
            console.log(`  뉴스 수: ${data.raw_news_count}`);
        } else {
            console.log(`  ❌ 브리핑 생성 실패`);
            console.log(`  에러: ${data.error}`);
        }
    } catch (e) {
        const reason = e.name === 'AbortError' ? '타임아웃(30초)' : e.message;
        console.log(`  ❌ 배포 URL 접근 실패: ${reason}`);
    }

    // ===== 요약 =====
    console.log('\n=== 진단 완료 ===');
}

main().catch(console.error);
