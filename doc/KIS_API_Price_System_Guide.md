# KIS API 주식 현재가 조회 시스템 — 개발 가이드

> **목적**: 이 문서는 한국투자증권(KIS) Open API를 사용하여 다수의 종목의 현재가를 안정적으로 조회하는 시스템의 전체 아키텍처와 코드 패턴을 정리한 것입니다. 다른 프로젝트에서 이 문서를 그대로 전달하여 동일한 시스템을 구축할 수 있도록 설계되었습니다.

---

## 1. 시스템 아키텍처

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                              │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  useBatchStockPrice (Hook)                                   │     │
│  │  ├─ 10개씩 chunk → 순차 fetch (1초 간격)                      │     │
│  │  ├─ 실패 chunk → exponential backoff (1s, 2s, 4s)            │     │
│  │  ├─ 전체 실패 종목 → 5초 후 자동 개별 재시도                    │     │
│  │  ├─ WebSocket 실시간 > Batch REST 데이터 우선순위              │     │
│  │  └─ refetch(), refetchSymbol() 수동 재조회                    │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              │ fetch                                  │
└──────────────────────────────┼────────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Backend API Route (Serverless)                      │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  /api/kis/price/batch                                        │     │
│  │  ├─ KR: 2건 병렬 + 700ms 그룹 간 딜레이                       │     │
│  │  ├─ US: 1건 순차 + 400ms 딜레이                               │     │
│  │  └─ 실패 종목 → 1초 후 개별 재시도 (500ms 간격)                 │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              │                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  KIS Client (getDomesticPrice / getOverseasPrice)             │     │
│  │  ├─ getOptimalMarketCode() → NXT 우선 + KRX 폴백              │     │
│  │  ├─ NXT 가격 0이면 → KRX(J) 자동 폴백                         │     │
│  │  └─ 토큰 만료 감지 → invalidateToken → 자동 재시도 (1회)        │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              │                                        │
│  ┌────────────────────┐  ┌────────────────────────────────────┐      │
│  │  RateLimiter        │  │  Token Manager                    │      │
│  │  max 5건, 200ms간격  │  │  In-Memory → Supabase → 신규발급   │      │
│  │  Promise-based Queue│  │  Mutex로 동시 발급 방지 (EGW00103)  │      │
│  └────────────────────┘  └────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. 토큰 관리 (Access Token)

### 2.1 3단계 토큰 캐시

KIS API 토큰은 24시간 유효하지만, **일일 발급 횟수가 제한**(약 100회)되어 있으므로 절약이 핵심입니다.

```
조회 순서:
1. In-Memory Cache (fastest) → 유효 시 즉시 반환
2. Supabase DB Cache (persistent) → serverless 인스턴스 간 공유
3. KIS API 신규 발급 (최후 수단) → Mutex로 동시 발급 1건 보장
```

### 2.2 Mutex 패턴 (동시 발급 방지)

Vercel 같은 serverless 환경에서는 동일 인스턴스 내 여러 요청이 동시에 토큰을 발급받으려 시도할 수 있습니다.

```typescript
let pendingTokenRequest: Promise<string> | null = null;

async function getAccessToken(): Promise<string> {
    // 1. In-Memory Cache
    if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
        return cachedToken;
    }

    // 2. Supabase Cache
    const stored = await getStoredToken();
    if (stored) {
        cachedToken = stored;
        tokenExpiresAt = Date.now() + (30 * 60 * 1000); // 30분 인메모리 캐시
        return cachedToken;
    }

    // 3. Mutex: 이미 발급 진행 중이면 동일 Promise 공유
    if (pendingTokenRequest) {
        return pendingTokenRequest;
    }

    // 4. 신규 발급 (단 1건만 실행)
    pendingTokenRequest = fetchNewToken();
    try {
        return await pendingTokenRequest;
    } finally {
        pendingTokenRequest = null;
    }
}
```

### 2.3 EGW00103 에러 처리 (일일 발급 한도 초과)

```typescript
// 토큰 발급 실패 시, 기존 캐시 토큰이 남아있으면 10분 연장하여 재사용
if (errorText.includes('EGW00103') && cachedToken) {
    tokenExpiresAt = Date.now() + (10 * 60 * 1000);
    return cachedToken;
}
```

### 2.4 EGW00123 에러 처리 (토큰 만료)

```typescript
function isTokenExpiredError(text: string): boolean {
    return text.includes('EGW00123') || text.includes('만료된 token');
}

// API 호출 실패 시 토큰 만료 감지 → 무효화 → 1회 재시도
if (!_retried && isTokenExpiredError(text)) {
    await invalidateToken();  // Memory + Supabase 모두 초기화
    return getDomesticPrice(symbol, true);
}
```

### 2.5 Supabase 토큰 저장소 — DB 스키마

```sql
CREATE TABLE kis_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: service role에서만 접근 가능하도록 설정 권장
```

---

## 3. 시장 코드 선택 전략 (NXT vs KRX)

### 3.1 배경

| 시장 | 코드 | 운영 시간 | ETF 지원 |
|------|------|----------|---------|
| **NXT** (넥스트레이드) | `NX` | 08:00~20:00 + **마감 후에도 마지막 체결가 반환** | ❌ (가격 0) |
| **KRX** (한국거래소) | `J` | 09:00~15:30 + 시간외 | ✅ 전체 지원 |

### 3.2 핵심 발견

> **NXT는 장외 시간(20:00 이후)에도 마지막 체결가를 반환합니다.**
>
> 실측 (00:33 KST):
> - SK스퀘어: KRX=562,000 vs **NXT=569,000** (+1.25%)
> - 삼성전자: KRX=188,700 vs **NXT=191,000** (+1.22%)

따라서 NXT가 가장 최신 가격을 제공합니다.

### 3.3 최종 전략

```typescript
function getOptimalMarketCode(): { primary: string; fallback: string } {
    // 항상 NXT 우선, ETF는 KRX 폴백
    return { primary: 'NX', fallback: 'J' };
}
```

- **1차**: NXT(NX)로 조회
- **가격 0 (ETF/ETN)**: KRX(J)로 자동 폴백

```typescript
// 조회 흐름
const result = await fetchWithMarketCode('NX');
if (result && parseFloat(result.stck_prpr) > 0) return result;

// NXT 가격 0 → ETF 등 → KRX 폴백
const fallbackResult = await fetchWithMarketCode('J');
if (fallbackResult) return fallbackResult;

return null;
```

---

## 4. Rate Limiter

### 4.1 KIS API 제한

- KIS API 초당 요청 제한: **약 20건/초** (공식), 실제 안정 운용 **5건/초** 권장
- 동시 접속 제한: 별도 명시 없음, 보수적 운용 필요

### 4.2 구현 (Promise-based Queue)

```typescript
export class RateLimiter {
    private queue: QueueItem[] = [];
    private activeCount = 0;
    private lastRequestTime = 0;
    private readonly maxConcurrency: number;  // 최대 동시 실행: 5
    private readonly minInterval: number;     // 최소 간격: 200ms

    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }

    private async processNext() {
        if (this.activeCount >= this.maxConcurrency) return;

        const item = this.queue.shift();
        if (!item) return;

        // 최소 간격 대기
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - elapsed));
        }

        this.activeCount++;
        this.lastRequestTime = Date.now();

        try {
            item.resolve(await item.task());
        } catch (e) {
            item.reject(e);
        } finally {
            this.activeCount--;
            if (this.queue.length > 0) this.processNext();
        }
    }
}

// 글로벌 인스턴스
export const kisRateLimiter = new RateLimiter(5, 200);
```

### 4.3 주의사항

- **`isProcessing` 플래그 패턴은 사용 금지**: 동시에 `processNext()`가 호출되면 큐 작업이 누락될 수 있음
- 반드시 `activeCount` + `finally → processNext()` 패턴으로 구현

---

## 5. Batch API Route (서버)

### 5.1 역할

클라이언트에서 여러 종목을 한 번에 요청하면, 서버에서 Rate Limiter를 거쳐 KIS API를 호출합니다.

### 5.2 처리 흐름

```
GET /api/kis/price/batch?market=KR&symbols=005930,402340,069500,...
```

```
1차 처리:
  KR: 2건씩 병렬 + 700ms 그룹 간 딜레이
  US: 1건씩 순차 + 400ms 딜레이

2차 재시도 (실패 종목):
  1초 대기 → 1건씩 순차 + 500ms 간격
```

### 5.3 코드 핵심

```typescript
const parallelSize = market === 'KR' ? 2 : 1;
const delayMs = market === 'KR' ? 700 : 400;

for (let i = 0; i < symbols.length; i += parallelSize) {
    const group = symbols.slice(i, i + parallelSize);
    const groupResults = await Promise.all(
        group.map(symbol => fetcher(symbol).catch(() => null))
    );
    // 결과 저장...
    if (i + parallelSize < symbols.length) {
        await new Promise(r => setTimeout(r, delayMs));
    }
}

// 2차 재시도
const failedSymbols = symbols.filter(s => results[s] === null);
if (failedSymbols.length > 0) {
    await new Promise(r => setTimeout(r, 1000));
    for (const symbol of failedSymbols) {
        results[symbol] = await fetcher(symbol).catch(() => null);
        await new Promise(r => setTimeout(r, 500));
    }
}
```

---

## 6. Frontend Batch Hook

### 6.1 역할

React 컴포넌트에서 여러 종목의 가격을 효율적으로 로딩하고, WebSocket 실시간 데이터와 병합합니다.

### 6.2 데이터 우선순위

```
1순위: WebSocket 실시간 데이터 (정규장 중 가장 정확)
2순위: REST Batch API 데이터 (초기 로딩, 장외 시간)
```

### 6.3 재시도 전략

```
┌─────────────────────────────────────────────────────┐
│ 1단계: 10개씩 chunk → 서버에 순차 요청 (1초 간격)      │
│                                                      │
│ 2단계: chunk 실패 시 → exponential backoff 재시도      │
│        (1초 → 2초 → 4초, 최대 3회)                    │
│                                                      │
│ 3단계: 전체 완료 후 실패 종목 존재 시                    │
│        → 5초 대기 후 개별 재시도 (500ms 간격)           │
│                                                      │
│ 4단계: UI에서 수동 재시도 버튼 → refetchSymbol()        │
└─────────────────────────────────────────────────────┘
```

### 6.4 코드 핵심

```typescript
export function useBatchStockPrice(symbols: string[], market: 'KR' | 'US') {
    const { subscribe, lastData } = useWebSocketContext();
    const [batchData, setBatchData] = useState<Record<string, StockData>>({});

    // 1. Batch Fetch (chunk + retry)
    useEffect(() => {
        const chunkSize = 10;
        for (const chunk of chunks) {
            await processChunk(chunk);      // fetch → parse → retry on fail
            await delay(1000);              // 다음 chunk 전 1초 대기
        }
        // 실패 종목 → 5초 후 자동 개별 재시도
    }, [symbols, market]);

    // 2. WebSocket 구독
    useEffect(() => {
        symbols.forEach(s => subscribe(s, market));
    }, [symbols, market]);

    // 3. 데이터 병합 (WS > Batch)
    const getStockData = (symbol: string) => {
        const ws = lastData.get(symbol);
        if (ws) return { ...ws, sector: batchData[symbol]?.sector };
        return batchData[symbol] || null;
    };

    return { getStockData, isLoading, refetch, refetchSymbol };
}
```

---

## 7. 환경 변수

```env
# KIS API
KIS_APP_KEY=your_app_key          # KIS 개발자센터에서 발급
KIS_APP_SECRET=your_app_secret    # KIS 개발자센터에서 발급
KIS_CANO=your_account_number      # 계좌번호 (8자리)
KIS_ACNT_PRDT_CD=01               # 계좌 상품코드 (보통 01)
KIS_BASE_URL=https://openapi.koreainvestment.com:9443

# Supabase (토큰 저장소)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 8. KIS API 주요 엔드포인트

### 8.1 토큰 발급

```
POST /oauth2/tokenP
Body: { grant_type: "client_credentials", appkey, appsecret }
→ { access_token, expires_in: 86400 }
```

### 8.2 국내 현재가 조회

```
GET /uapi/domestic-stock/v1/quotations/inquire-price
  ?FID_COND_MRKT_DIV_CODE=NX    // NX(넥스트레이드) 또는 J(KRX)
  &FID_INPUT_ISCD=005930         // 종목코드

Headers:
  tr_id: FHKST01010100
  authorization: Bearer {token}
  appkey: {app_key}
  appsecret: {app_secret}

Response:
  output.stck_prpr = 현재가
  output.prdy_vrss = 전일 대비 변동
  output.prdy_ctrt = 전일 대비 등락률
  output.rprs_mrkt_kor_name = 대표시장명
  output.bstp_kor_isnm = 업종명
```

### 8.3 해외 현재가 조회

```
GET /uapi/overseas-price/v1/quotations/price-detail
  ?AUTH=&EXCD=NAS&SYMB=AAPL

Headers:
  tr_id: HHDFS76200200
```

---

## 9. 알려진 에러와 대응

| 에러 코드 | 의미 | 대응 |
|----------|------|------|
| **EGW00103** | 일일 토큰 발급 한도 초과 | 기존 캐시 토큰 10분 연장 재사용 |
| **EGW00123** | 토큰 만료 | invalidateToken() → 재발급 → 재시도 (1회) |
| NXT 가격 0 | ETF/ETN NXT 미지원 | KRX(J) 자동 폴백 |
| HTTP 429/500 | Rate Limit / 서버 에러 | RateLimiter + exponential backoff |

---

## 10. Vercel Serverless 배포 시 주의사항

1. **인메모리 캐시는 인스턴스 단위**: 서로 다른 serverless 인스턴스는 `cachedToken`을 공유하지 않음 → Supabase DB 캐시 필수
2. **동시 요청 시 중복 토큰 발급**: Mutex(`pendingTokenRequest`)로 같은 인스턴스 내 1건 보장
3. **Cold Start**: 첫 호출 시 토큰이 없으므로 Supabase 조회 → 없으면 새 발급
4. **함수 실행 시간 제한**: Vercel 무료: 10초, Pro: 60초 → 배치 사이즈와 딜레이 조절 필요

---

## 11. 파일 구조

```
src/
├── lib/kis/
│   ├── client.ts           # 핵심: getAccessToken, getDomesticPrice, getOverseasPrice
│   ├── rateLimiter.ts      # RateLimiter 클래스 (Promise-based queue)
│   ├── tokenManager.ts     # Supabase 토큰 CRUD (getStoredToken, saveToken, clearStoredTokens)
│   ├── types.ts            # KIS API 응답 타입 정의
│   └── exchange.ts         # 종목 → 거래소 코드 매핑 (해외)
├── app/api/kis/price/
│   ├── batch/route.ts      # Batch API: 여러 종목 한번에 조회
│   └── domestic/[symbol]/
│       └── route.ts        # 개별 종목 조회 API
└── hooks/
    └── useBatchStockPrice.tsx  # React Hook: 배치 로딩 + WS 병합 + 재시도
```

---

## 12. 체크리스트 (새 프로젝트 구축 시)

- [ ] Supabase `kis_tokens` 테이블 생성
- [ ] 환경 변수 설정 (KIS API 키, Supabase URL/Key)
- [ ] `rateLimiter.ts` 복사 (maxConcurrency=5, minInterval=200)
- [ ] `tokenManager.ts` 복사 (Supabase CRUD)
- [ ] `client.ts` 복사 (getAccessToken + Mutex + getDomesticPrice + getOptimalMarketCode)
- [ ] `batch/route.ts` 복사 (2건 병렬 + 700ms 딜레이 + 재시도)
- [ ] `useBatchStockPrice.tsx` 복사 (10건 chunk + backoff + WS 병합)
- [ ] KIS 개발자센터에서 API 키 발급 (모의/실전)
- [ ] Vercel 환경 변수에 KIS 키 등록
- [ ] 테스트: 삼성전자(005930) + KODEX200(069500, ETF) + 해외 종목
