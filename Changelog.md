## [Alpha V1.089] - 2026-02-10 09:30:00

### ⚡ Performance: 로그인 직후 데이터 동기화 최적화
- **Summary**: 로그인 후 포트폴리오 페이지 진입 시 데이터가 로드되지 않는 문제 해결
- **Detail**:
  - **Fix**: `PortfolioContext`가 Server Component(`layout.tsx`)로부터 전달받은 최신 `initialUser` 정보를 즉시 감지하도록 수정 (React State 동기화 문제 해결).
  - **UX**: 데이터 로딩 중 "회원 정보를 불러오는 중...", "내 주식일지를 불러오고 있습니다..." 등 상세 메시지를 표시하여 안정감 제공.
  - **Result**: 새로고침 없이도 로그인 직후 내 주식일지 데이터가 즉시 로드됨.
- **Build Time**: 2026-02-10 09:30:00

## [Alpha V1.088] - 2026-02-10 00:30:00

### ⏳ UX Improvement: 로딩 화면 메시지 개선
- **Summary**: 초기 로딩 시 진행 상황을 알 수 있도록 단계별 메시지 표시
- **Detail**:
  - **Feature**: `FullPageLoader`를 전역(`PortfolioContext`)으로 적용하고, 데이터 로딩 상태에 따라 메시지 업데이트.
  - **Messages**:
    - "사용자 정보를 확인하고 있습니다..."
    - "로그인 정보를 동기화하고 있습니다..."
    - "나의 주식 목록을 불러오고 있습니다..."
  - **Benefit**: 로그인 직후 또는 새로고침 시 빈 화면 대신 명확한 진행 상태를 보여주어 사용자 경험 개선.
- **Build Time**: 2026-02-10 00:30:00

## [Alpha V1.087] - 2026-02-10 00:00:00

### 🔄 Auth Upgrade: 로그아웃 Server Action 전환
- **Summary**: 로그아웃 로직을 로그인과 동일한 Server Action 방식으로 변경
- **Detail**:
  - **New Feature**: `signout` Server Action 도입 (`src/app/login/actions.ts`)
  - **UX**: 로그아웃 시 클라이언트 상태 즉시 초기화(Optimistic UI) 후 서버 측 쿠키 제거 및 리다이렉트 수행
  - **Security**: 브라우저 쿠키를 확실하게 제거하여 보안성 강화
- **Build Time**: 2026-02-10 00:00:00

## [Alpha V1.086] - 2026-02-09 23:30:00

### 🐛 Critical Bug Fix: 로그인 세션 동기화
- **Summary**: `client.ts` 인증 스토리지 설정을 쿠키 기반으로 변경
- **Detail**:
  - **Issue**: `client.ts`가 `localStorage`를 강제하고 있어, Server Action 로그인(쿠키 설정) 결과를 클라이언트가 인식하지 못함. 이로 인해 로그인 직후 "내 주식일지" 데이터가 보이지 않음.
  - **Fix**: `storage: window.localStorage` 및 `storageKey` 설정을 제거하여 `@supabase/ssr`의 기본값(Cookie)을 사용하도록 수정.
  - **Effect**: 이제 Server Action 로그인 -> 클라이언트 세션 동기화가 즉시 이루어지며, RLS 에러 없이 포트폴리오 데이터가 정상 조회됨.
- **Build Time**: 2026-02-09 23:30:00

## [Alpha V1.085] - 2026-02-08 17:50:00

### 🧹 Code Cleanup: 내 주식일지 페이지 재구축
- **Summary**: Portfolio 페이지 디버그 코드 전면 제거 및 코드 단순화
- **Detail**:
  - **PortfolioContext.tsx**: 완전 재작성 — `debugLog` 상태, `AbortError` 재시도, 3초 최소 로딩, `FullPageLoader` 글로벌 블로커, `isInitialized` 이중 체크 등 V1.051~V1.084 디버깅 과정에서 누적된 코드 전면 제거. 세션 초기화를 `initialUser` 기반으로 단순화.
  - **PortfolioClientPage.tsx**: 서버/클라이언트 동기화 디버그 패널, Client Debug Logs 패널 제거. 깔끔한 AddAssetForm + PortfolioTable 레이아웃만 유지.
  - **portfolio/page.tsx**: `serverDebugInfo` 수집 로직 제거, 단순 렌더링 컴포넌트로 변환.
  - **client.ts**: 불필요한 `console.log` 제거.
  - **기능 보존**: CRUD, 가격 조회, WebSocket, 필터/정렬 등 모든 핵심 기능 100% 유지.
- **Build Time**: 2026-02-08 17:50:00

## [Alpha V1.084] - 2026-02-09 22:00:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Supabase Auth Lock Timeout
- **Detail**:
  - **Issue**: `_acquireLock` timeout으로 인한 AbortError. Supabase Auth가 lock을 얻으려다 실패.
  - **Root Cause**: 기본 auth 설정이 session detection과 lock 메커니즘에서 충돌.
  - **Fix**: 
    - `detectSessionInUrl: false` - URL 기반 자동 세션 감지 비활성화
    - `storageKey` 명시적 지정으로 lock 충돌 방지
    - `flowType: 'pkce'` 명시
  - **Expected**: Auth lock timeout이 해결되고 데이터 로드 성공.
- **Build Time**: 2026-02-09 22:00:00

## [Alpha V1.083] - 2026-02-09 21:45:00

### 🐛 Critical Bug Fix
- **Summary**: Replace useMemo with useRef for True Singleton
- **Detail**:
  - **Issue**: `useMemo`가 React 렌더링 사이클(특히 Strict Mode)에서 클라이언트를 여러 번 생성하여 AbortError 발생.
  - **Fix**: 
    - `useRef`로 변경하여 컴포넌트 생명주기 동안 단 한 번만 생성 보장
    - `supabaseRef.current`로 클라이언트 접근
  - **Expected**: 이제 클라이언트가 단 1번만 생성되고 AbortError가 사라질 것.
- **Build Time**: 2026-02-09 21:45:00

## [Alpha V1.082] - 2026-02-09 21:30:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Supabase Client SSR Initialization Issue
- **Detail**:
  - **Issue**: `client.ts`에서 module-level `export const supabase = createClient()`가 SSR 중에도 실행되어 문제 발생.
  - **Fix**: 
    - Module-level singleton export 제거
    - `createClient()` 함수만 export
    - `PortfolioContext`에서 `useMemo`로 브라우저 컨텍스트에서만 생성
    - 초기화 로그 강화 (`[SUPABASE-INIT]`)
  - **Expected**: 이제 브라우저에서만 클라이언트가 생성되고 정상 작동할 것.
- **Build Time**: 2026-02-09 21:30:00

## [Alpha V1.081] - 2026-02-09 21:15:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Duplicate fetchPortfolio Calls Causing AbortError
- **Detail**:
  - **Issue**: `fetchPortfolio`가 3곳에서 동시 호출되어 서로 중단시키면서 AbortError 발생.
    - `initialUser` 체크 시
    - `initSession()` 에서
    - `onAuthStateChange` 에서
  - **Fix**: 
    - `initialUser` 체크에서 fetchPortfolio 호출 제거
    - `onAuthStateChange`에서 복잡한 조건문 제거, 모든 세션 변경 시 일관되게 fetch
    - AUTH 이벤트 로깅 추가
- **Build Time**: 2026-02-09 21:15:00

## [Alpha V1.080] - 2026-02-09 21:00:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error in PortfolioContext
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` line 172의 `onAuthStateChange` 콜백에서 `event`, `session` 파라미터 타입 미지정으로 빌드 실패.
  - **Fix**: `event: any`, `session: any` 타입 추가.
- **Build Time**: 2026-02-09 21:00:00

## [Alpha V1.079] - 2026-02-09 20:50:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error
- **Detail**:
  - **Issue**: `update-password/page.tsx`에서 `session` 파라미터 타입 미지정으로 빌드 실패.
  - **Fix**: `session` 파라미터에 `any` 타입 추가.
- **Build Time**: 2026-02-09 20:50:00

## [Alpha V1.078] - 2026-02-09 20:45:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Supabase Client Singleton Pattern
- **Detail**:
  - **Issue**: Supabase 쿼리 Promise가 영원히 resolve되지 않음. `useMemo`로 생성된 클라이언트가 매번 재생성될 가능성.
  - **Fix**: 
    - `client.ts`에 진정한 싱글톤 패턴 구현
    - `PortfolioContext`에서 singleton을 직접 import하여 사용
    - `useMemo` 제거
  - **Note**: 콘솔 로그에서 `[DEBUG] Query returned...`가 나타나지 않아 쿼리 hang 확인됨.
- **Build Time**: 2026-02-09 20:45:00

## [Alpha V1.077] - 2026-02-09 20:30:00

### 🔍 Debug Enhancement
- **Summary**: Add Console Logs for Browser Debugging
- **Detail**:
  - **Issue**: trade_logs 제거 후에도 쿼리가 완료되지 않음. 조인이 문제가 아님.
  - **Fix**: console.log 추가하여 브라우저 콘솔에서 Supabase 클라이언트 상태와 쿼리 실행 여부 확인.
  - **Note**: F12 Console 탭에서 [DEBUG] 로그 확인 필요.
- **Build Time**: 2026-02-09 20:30:00

## [Alpha V1.076] - 2026-02-09 20:15:00

### 🔍 Debug Test
- **Summary**: Remove trade_logs Join to Isolate Hang Issue
- **Detail**:
  - **Issue**: Supabase 쿼리가 `trade_logs` 조인 후 완료되지 않고 hang됨.
  - **Test**: `trade_logs` 조인을 임시 제거하고 `portfolios`만 조회하여 문제 원인 파악.
  - **Note**: 이는 임시 디버깅 버전. 성공 시 trade_logs를 별도 쿼리로 가져오도록 수정 예정.
- **Build Time**: 2026-02-09 20:15:00

## [Alpha V1.075] - 2026-02-09 20:00:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Infinite useEffect Loop and Hanging Query
- **Detail**:
  - **Issue**: `fetchPortfolio`의 useCallback 의존성에 `supabase`가 포함되어 있어 fetchPortfolio가 변경될 때마다 useEffect가 재실행. 또한 Supabase 쿼리가 완료되지 않고 hang됨.
  - **Fix**: 
    - `useCallback`과 `useEffect` 의존성 배열을 `[]`로 변경하여 최초 1회만 실행
    - `finally` 블록에 `setIsInitialized(true)` 추가하여 초기화 보장
- **Build Time**: 2026-02-09 20:00:00

## [Alpha V1.074] - 2026-02-09 19:45:00

### 🔍 Debug Enhancement
- **Summary**: Add Detailed Debug Logs
- **Detail**:
  - **Issue**: `[Fetch] Starting` 이후 로그가 전혀 없어 문제 파악 불가.
  - **Fix**: Supabase 쿼리 실행 전후, 데이터 처리 과정에 상세 로그 추가.
- **Build Time**: 2026-02-09 19:45:00

## [Alpha V1.073] - 2026-02-09 19:30:00

### 🐛 Critical Bug Fix
- **Summary**: Fix useEffect Dependency Causing Abort Loop
- **Detail**:
  - **Issue**: `useEffect` 의존성 배열에 `isInitialized`가 포함되어 있어, 이 값이 변경될 때마다 useEffect가 재실행되면서 이미 진행 중인 fetch를 중단(abort)하고 새로운 fetch를 시작. 무한 abort 루프 발생.
  - **Fix**: `isInitialized`를 useEffect 의존성 배열에서 제거.
- **Build Time**: 2026-02-09 19:30:00

## [Alpha V1.072] - 2026-02-09 19:15:00

### 🐛 Critical Bug Fix
- **Summary**: Remove Timeout Causing AbortError
- **Detail**:
  - **Issue**: 10초 timeout이 너무 짧아서 68개 주식 + 거래기록 조인 쿼리가 완료되기 전에 abort됨. 모든 요청이 "AbortError: signal is aborted without reason"로 실패.
  - **Fix**: `abortSignal(AbortSignal.timeout(10000))` 제거. Supabase 자체 timeout에 의존.
- **Build Time**: 2026-02-09 19:15:00

## [Alpha V1.071] - 2026-02-09 19:00:00

### 🐛 Critical Bug Fix
- **Summary**: Fix fetchPort folio Hoisting Issue
- **Detail**:
  - **Issue**: `fetchPortfolio` 함수가 `useEffect` 이후에 정의되어 호이스팅 문제로 실행되지 않음. Force Refresh 시 로그만 표시되고 실제 데이터가 로딩되지 않는 문제.
  - **Fix**: `fetchPortfolio`를 `useCallback`으로 감싸고 `useEffect` 전에 정의. `useEffect` 의존성 배열에 `fetchPortfolio` 추가.
- **Build Time**: 2026-02-09 19:00:00

## [Alpha V1.070] - 2026-02-09 18:35:00

### 🚑 Build Fix
- **Summary**: Fix Duplicate Declarations & Missing Property
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 내 `fetchPortfolio`, `refreshPortfolio` 함수가 중복 선언되어 빌드 실패. 이후 Provider에서 `refreshPortfolio` 누락.
  - **Fix**: 중복된 함수 정의 제거 및 Provider value에 `refreshPortfolio` 추가.
- **Build Time**: 2026-02-09 18:35:00

## [Alpha V1.069] - 2026-02-09 18:25:00

### 🚑 Build Fix
- **Summary**: Fix Syntax Error in PortfolioContext
- **Detail**:
  - **Issue**: `refreshPortfolio` 추가 과정에서 닫는 괄호(`}`) 위치가 잘못되어 `return` 문이 함수 밖으로 밀려나는 문법 오류 발생.
  - **Fix**: 괄호 위치 수정 및 코드 구조 정상화.
- **Build Time**: 2026-02-09 18:25:00

## [Alpha V1.068] - 2026-02-09 18:05:00

### 🔍 Deep Debugging UI
- **Summary**: Expose Client-Side Logs
- **Detail**:
  - **Feature**: '내 주식일지' 페이지에 **실시간 디버그 로그(Client Debug Logs)** 창 추가.
  - **Purpose**: 데이터 로딩이 멈추거나 실패하는 정확한 단계(Fetch 시작, Supabase 응답, 에러 발생 등)를 시각적으로 확인.
  - **Action**: **[Force Refresh]** 버튼을 추가하여, 로딩이 멈췄을 때 수동으로 데이터 재요청 가능.
- **Build Time**: 2026-02-09 18:05:00

## [Alpha V1.067] - 2026-02-09 17:50:00

### 🛡️ Data Sync Safety Net
- **Summary**: Add Auto-Diagnostic UI for Data Sync
- **Detail**:
  - **Feature**: 클라이언트(`PortfolioClientPage`)에서 서버 데이터 개수(`serverCount`)와 실제 로드된 개수(`clientCount`)를 비교.
  - **UX**: 불일치 발생 시(서버엔 있는데 클라이언트에 없을 때) 붉은색 **'데이터 동기화 오류'** 경고 카드 표시.
  - **Action**: 사용자가 즉시 대응할 수 있도록 '페이지 새로고침' 및 '재로그인' 버튼 제공.
- **Build Time**: 2026-02-09 17:50:00

## [Alpha V1.066] - 2026-02-09 17:40:00

### 🚑 Build Fix
- **Summary**: Restore Missing Variable
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 수정 중 `totalInvested` 변수 선언이 누락되어 빌드 실패.
  - **Fix**: `totalInvested` 계산 로직 복구.
- **Build Time**: 2026-02-09 17:40:00

## [Alpha V1.065] - 2026-02-09 17:20:00

### 🎨 UX Upgrade: Global Loading
- **Summary**: Implement minimum 3s Loading Screen
- **Detail**:
  - **Feature**: '일일 체크' 및 '내 주식일지' 진입 시 최소 3초간 유지되는 **전체 화면 로딩(Full Page Loader)** 적용.
  - **Design**: "데이터를 불러오는 중입니다..." 문구와 애니메이션 아이콘이 포함된 중앙 정렬 로딩 화면.
  - **Purpose**: 데이터가 부분적으로 로드되거나 빈 화면이 깜빡이는 현상을 방지하고, 안정적인 로딩 경험 제공.
- **Build Time**: 2026-02-09 17:20:00

## [Alpha V1.064] - 2026-02-09 17:00:00

### 🐛 UI Loading Logic Fix
- **Summary**: Fix Premature Empty State
- **Detail**:
  - **Issue**: 사용자 세션이 서버에서 주입(`initialUser`)될 경우, 데이터 로딩이 시작되기도 전에 `isLoading`이 `false`로 설정되어 빈 화면("자산 없음")이 깜빡이거나 고정되는 문제.
  - **Fix**: 초기 `isLoading` 값을 무조건 `true`로 설정하여, 첫 데이터 패칭이 완료될 때까지 스켈레톤 UI가 유지되도록 수정.
- **Build Time**: 2026-02-09 17:00:00

## [Alpha V1.063] - 2026-02-09 16:45:00

### 🛡️ Client Stability Upgrade
- **Summary**: Fix `AbortError` in Portfolio Fetch
- **Detail**:
  - **Issue**: `PortfolioContext` 리렌더링 시 Supabase Client가 재생성되거나, 네트워크 상태에 따라 `fetch` 요청이 중단(`AbortError`)되는 현상.
  - **Fix**:
    1.  `useMemo`를 사용하여 Supabase Client 인스턴스를 메모이제이션 (싱글톤 유지).
    2.  `fetchPortfolio` 함수에 `retry` 로직을 추가하여 `AbortError` 또는 일시적 네트워크 오류 발생 시 최대 2회 자동 재시도.
- **Build Time**: 2026-02-09 16:45:00

## [Alpha V1.062] - 2026-02-09 16:25:00

### 🚑 Build Fix
- **Summary**: Fix Syntax Error in PortfolioContext
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 파일 내 `PortfolioContextType` 인터페이스 정의 중 중복된 닫는 중괄호(`}`)로 인한 빌드 파싱 에러 수정.
- **Build Time**: 2026-02-09 16:25:00

## [Alpha V1.061] - 2026-02-09 16:00:00

### 🔄 Auth Architecture Upgrade
- **Summary**: Implement Server-Side Session Hydration
- **Detail**:
  - **Issue**: 클라이언트 사이드 인증 로직(`supabase-js`)이 간헐적으로 세션을 감지하지 못해 "Guest" 상태로 머무는 현상.
  - **Fix**: `RootLayout`(Server Component)에서 안전하게 사용자 세션을 조회한 뒤, `PortfolioProvider` 초기값(`initialUser`)으로 주입(Hydration).
  - **Effect**: 앱 실행 즉시 로그인 상태가 보장되며, 불필요한 클라이언트 사이드 세션 체크 로직을 단축하여 초기 로딩 속도 향상.
- **Build Time**: 2026-02-09 16:00:00

## [Alpha V1.060] - 2026-02-09 15:45:00

### 🚑 Build Fix
- **Summary**: Fix PortfolioContext Type Error
- **Detail**:
  - **Issue**: V1.059 빌드 시 `PortfolioContextType`에 정의된 `debugLog` 속성이 Provider value에서 누락되었다는 타입 에러 발생.
  - **Fix**: `PortfolioContext.Provider`의 `value` 객체에 `debugLog`를 명시적으로 전달하도록 코드 수정 및 재적용.
- **Build Time**: 2026-02-09 15:45:00

## [Alpha V1.059] - 2026-02-09 15:30:00

### 🔬 Client-Side Deep Debugging
- **Summary**: Expose Client Fetch Logs
- **Detail**:
  - **Feature**: `PortfolioContext` 내부에서 발생하는 데이터 패칭 과정(Fetch Start, Success, Error, Loaded Count)을 실시간으로 기록(`debugLog`).
  - **UI**: "내 주식일지" 페이지 상단 디버그 콘솔에 Server Data와 Client Logs를 동시에 표시하여 비교 가능하게 함.
- **Build Time**: 2026-02-09 15:30:00

## [Alpha V1.058] - 2026-02-09 15:15:00

### 🔍 Server-Side Verification
- **Summary**: Add Debug Info for Portfolio Sync
- **Detail**:
  - **Feature**: `PortfolioPage`를 서버 컴포넌트로 전환하고, 서버 사이드에서 직접 DB의 포트폴리오 개수(`count`)를 조회하여 화면에 표시.
  - **Purpose**: 클라이언트(`Context`)와 서버(`DB/RLS`) 간의 데이터 불일치 원인을 파악하기 위함.
  - **UI**: 페이지 상단에 노란색 디버그 박스로 서버 측 조회 결과(User Email, DB Count) 표시.
- **Build Time**: 2026-02-09 15:15:00

## [Alpha V1.057] - 2026-02-09 15:00:00

### 🐛 Data Sync Debugging
- **Summary**: Improve Error Visibility for Portfolio Sync
- **Detail**:
  - **Issue**: "내 주식일지" 데이터가 로그인 후에도 보이지 않는 현상.
  - **Fix**: `PortfolioContext`에 에러 상태(`error`)를 추가하고, 데이터 로딩 실패 시 UI에 에러 메시지를 표시하도록 `PortfolioTable` 수정.
  - **Purpose**: 데이터가 없는 것인지, 로딩에 실패한 것인지 명확히 구분하여 디버깅 용이성 확보.
- **Build Time**: 2026-02-09 15:00:00

## [Alpha V1.056] - 2026-02-09 14:45:00

### 🔄 User Flow Optimization
- **Summary**: Fix User Info Missing / Login Loading Issue
- **Detail**:
  - **Issue**: 사이드바 사용자 정보가 'Guest'로 뜨거나 로그인 프로세스 중 로딩 화면이 생략되는 문제
  - **Fix**: `Sidebar` 컴포넌트가 `PortfolioContext`의 전역 사용자 상태(`user`, `logout`)를 직접 사용하도록 리팩토링. (Single Source of Truth 적용)
  - **Effect**: 전역 로딩(`Initializing...`)이 완료되면 사이드바에도 정확한 사용자 정보가 즉시 표시됨.
- **Build Time**: 2026-02-09 14:45:00

## [Alpha V1.055] - 2026-02-09 14:30:00

### 🛡️ Initialization Stability
- **Summary**: Fix Infinite Loading Issue
- **Detail**:
  - **Issue**: 초기화 과정(`initSession` 등)에서 응답이 지연되거나 실패할 경우, 로딩 화면(Initializing...)이 계속 유지되는 현상
  - **Fix**: `PortfolioContext`에 3초 안전 타임아웃(Safety Timeout) 추가. 초기화가 일정 시간 내에 완료되지 않으면 강제로 로딩을 해제하여 사용자가 앱을 사용할 수 있도록 조치.
  - **Misc**: 디버깅 로그 추가 및 `try-catch` 블록으로 예외 처리 강화.
- **Build Time**: 2026-02-09 14:30:00

## [Alpha V1.054] - 2026-02-09 14:15:00

### 🚑 Build Fix (Refined)
- **Summary**: Resolve Persistent TypeScript Build Error
- **Detail**:
  - **Issue**: 이전 `filter` 타입 가드 적용에도 불구하고 여전히 타입 불일치 에러 발생
  - **Fix**: `.map()` 후 `null`을 제거하는 방식 대신, 데이터 가공 전 `.filter()`로 유효한 데이터만 먼저 걸러내는 방식(`filter` -> `map`)으로 변경하여 타입 안정성 보장
- **Build Time**: 2026-02-09 14:15:00

## [Alpha V1.053] - 2026-02-09 14:00:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error
- **Detail**:
  - **Issue**: `PortfolioContext`에서 `null` 체크 로직의 타입 추론 실패로 인한 빌드 에러 (`Type 'null' is not assignable to type 'Asset'`)
  - **Fix**: `.filter()`에 Type Predicate(`asset is Asset`)를 적용하여 타입 안정성 확보
- **Build Time**: 2026-02-09 14:00:00

## [Alpha V1.052] - 2026-02-09 13:45:00

### 🛡️ Data Fetching Stability
- **Summary**: Prevent Dashboard Crash/Empty State
- **Detail**:
  - **Issue**: 일부 데이터 오류(Symbol 누락 등) 시 전체 포트폴리오 로드가 실패하여 빈 화면이 나올 수 있는 문제 방지
  - **Fix**: `getMarketType` 안전성 강화 및 포트폴리오 매핑 시 예외 처리 추가
- **Build Time**: 2026-02-09 13:45:00

## [Alpha V1.051] - 2026-02-09 13:30:00

### 🔄 Login Process Refactor
- **Summary**: Implement Global Initialization Loader (Splash Screen)
- **Detail**:
  - **Issue**: 로그인 후 데이터가 로드되기 전 대시보드가 먼저 노출되는 현상 수정
  - **Fix**: `PortfolioProvider`에 `isInitialized` 상태 추가. 세션 및 포트폴리오 데이터가 모두 준비될 때까지 전역 로딩 화면 표시.
  - **Flow**: 로그인 -> Initializing... (데이터 로드) -> 대시보드 진입
- **Build Time**: 2026-02-09 13:30:00

## [Alpha V1.050] - 2026-02-09 13:00:00

### ⏳ Sidebar Loading Fix
- **Summary**: Fix infinite loading state in Sidebar
- **Detail**:
  - **Issue**: 로그인 직후 사이드바의 사용자 정보가 'Loading...' 상태로 멈추는 현상 수정
  - **Fix**: Auth 이벤트 발생 시 강제로 로딩 상태를 해제(`setLoading(false)`)하고, 안전장치(Timeout 2s)를 추가하여 무한 로딩 방지
- **Build Time**: 2026-02-09 13:00:00

## [Alpha V1.049] - 2026-02-09 12:45:00

### 🔄 Market Logic Updates (Refined)
- **Summary**: Refined Domestic Stock Distinction Rule
- **Detail**:
  - **Rule Update**: 국내 주식(KR) 구분 조건 확대
  - **New Rule**: 숫자 6자리 또는 "숫자 5개 + 알파벳 1개" (총 6자리) 패턴을 포함 (예: `0080G0`)
  - **Coverage**: 상장지수증권(ETN) 및 신형 우선주 등 혼합형 코드 지원
- **Build Time**: 2026-02-09 12:45:00

## [Alpha V1.048] - 2026-02-09 12:35:00

### 🔄 Market Logic Updates
- **Summary**: Fix Domestic/Overseas Stock Distinction
- **Detail**:
  - **Rule Changed**: 주식 심볼 패턴에 따라 자동으로 국가를 구분하도록 로직 변경
    - **국내(KR)**: 숫자 6자리 (예: `005930`, `005930.KS`)
    - **해외(US)**: 알파벳 등 그 외 (예: `AAPL`, `LIT`)
  - **Context**: 포트폴리오 로딩 시 위 규칙을 적용하여 `category` 재설정
- **Build Time**: 2026-02-09 12:35:00

## [Alpha V1.047] - 2026-02-09 12:20:00

### 👤 User Info Sync Fix
- **Summary**: Fix user info not displaying immediately after login
- **Detail**:
  - **Auth State**: `Sidebar` 컴포넌트의 인증 상태 동기화 로직 개선
  - **Event Handling**: 로그인(`SIGNED_IN`) 및 초기 세션(`INITIAL_SESSION`) 이벤트 발생 시 즉시 UI 갱신(`router.refresh`)하도록 수정
- **Build Time**: 2026-02-09 12:20:00

## [Alpha V1.046] - 2026-02-09 12:10:00

### 🌍 Overseas Stock Data Fix
- **Summary**: Fix missing data for Overseas Stocks (e.g., NYSE ETFs like LIT)
- **Detail**:
  - **Retry Logic**: 해외 주식 조회 시 거래소(NAS/NYS) 불일치로 인한 에러 발생 시, 자동으로 대체 거래소로 재조회하도록 로직 강화
  - **Coverage**: ETF 및 NYSE 종목 조회 성공률 대폭 향상
- **Build Time**: 2026-02-09 12:10:00

## [Alpha V1.045] - 2026-02-09 11:55:00

### 🚑 Hotfix (Build Error)
- **Summary**: Fix Portfolio Table Build Error
- **Detail**:
  - **Fix**: `PortfolioTable`에서 `PortfolioCard`로 `stockData` prop을 전달하지 않아 발생한 빌드 에러 수정
  - **Cleanup**: 누락된 `useBatchStockPrice` 훅 적용 완료
- **Build Time**: 2026-02-09 11:55:00

## [Alpha V1.044] - 2026-02-09 11:45:00

### 🚑 Deep Fix (Portfolio Data)
- **Summary**: Resolve Missing Profit/Loss & Return Rate (0%)
- **Detail**:
  - **Refactor**: 포트폴리오 데이터 조회 방식을 개별 호출(`useStockPrice`)에서 **일괄 조회(`useBatchStockPrice`)**로 변경하여 API 과부하 및 500 에러 원천 차단
  - **Symbol Fix**: 국내 주식 심볼(`.KS`) 처리 로직 개선으로 실시간 데이터 매칭 정확도 향상
  - **Performance**: 불필요한 리렌더링 감소 및 데이터 로딩 속도 개선
- **Build Time**: 2026-02-09 11:45:00

## [Alpha V1.043] - 2026-02-09 11:30:00

### 🔍 Portfolio UX Upgrade
- **Summary**: Implement Filtering & Sorting with Real-time Valuation
- **Detail**:
  - **Filtering**: 국내/해외/거래완료(수량0) 필터 추가 및 각 항목별 자산 개수(Count) 표시 기능 구현
  - **Sorting**: 최신순, 가나다순, **평가금액순** 정렬 기능 추가 (평가금액은 실시간 시세 반영하여 정렬)
  - **UI**: 필터 및 정렬 컨트롤 바 추가로 포트폴리오 관리 편의성 증대
- **Build Time**: 2026-02-09 11:30:00

## [Alpha V1.042] - 2026-02-09 11:00:00

### 💰 Portfolio Refactor & Fixes
- **Summary**: Portfolio Page Cleanup & Calculation Safe-guard
- **Detail**:
  - **UI Refactor**: 포트폴리오 페이지 상단 '내 자산관리' 중복 섹션 제거 및 '내 주식에 메모하기'로 타이틀 변경
  - **Calculation**: 평가손익 및 수익률 계산 로직 개선 (매입가 0원 또는 데이터 로딩 지연 시 0%로 안전하게 표시)
  - **Loading State**: 포트폴리오 목록 로딩 시 스켈레톤 UI를 적용하여 빈 화면(No assets)이 깜빡이는 현상 해결
- **Build Time**: 2026-02-09 11:00:00

## [Alpha V1.041] - 2026-02-09 10:45:00

### 🛡️ Auth Logic Hardening
- **Summary**: Improve Session Fetching & Logout
- **Detail**:
  - **Session**: `getSession`(로컬)과 `getUser`(서버) 이중 체크로 로그인 정보 로딩 속도 및 안정성 강화
  - **State**: 데이터 로딩 중 'Loading...' 표시 추가 (Guest 깜빡임 방지)
  - **Logout**: `onAuthStateChange` 이벤트를 통한 확실한 리다이렉트 처리
- **Build Time**: 2026-02-09 10:45:00

## [Alpha V1.040] - 2026-02-09 09:30:00

### 🎨 Sidebar Profile Update
- **Summary**: Refactor User Info Display
- **Detail**:
  - **Cleanup**: 상단 중복 프로필 영역 제거
  - **Profile**: 하단 '내정보' 메뉴를 실제 사용자 정보(닉네임/이메일) 표시 영역으로 변경 (요청사항 반영)
- **Build Time**: 2026-02-09 09:30:00

## [Alpha V1.039] - 2026-02-09 08:30:00

### 🔧 Critical Fix: Middleware & Session
- **Summary**: Restore Missing Middleware
- **Detail**:
  - **Middleware**: `src/middleware.ts` 파일이 누락되어 세션 관리가 작동하지 않던 치명적 오류 수정. 이제 페이지 이동 시 세션 갱신 및 보호 로직이 정상 작동합니다.
  - **Cleanup**: 디버깅 로그 제거 및 코드 정리.
- **Build Time**: 2026-02-09 08:30:00

## [Alpha V1.038] - 2026-02-09 07:45:00

### 🚑 Authentication Fix
- **Summary**: Fix Sidebar User State
- **Detail**:
  - **Sidebar**: `onAuthStateChange` 리스너 추가로 로그인 직후 사용자 정보 미표시 현상 수정
  - **Redirect**: 로그아웃 시 로그인 페이지로 즉시 이동하도록 로직 강화
- **Build Time**: 2026-02-09 07:45:00

## [Alpha V1.037] - 2026-02-09 07:00:00

### 🧭 Sidebar Navigation
- **Summary**: Implement Collapsible Sidebar & Layout
- **Detail**:
  - **Sidebar**: 좌측에 접고 펼 수 있는 사이드바(일일체크, 내주식일지, 설정, 내정보, 로그아웃) 추가
  - **Layout**: Dashboard 및 Portfolio 페이지에 사이드바 레이아웃 적용
  - **Cleanup**: 상단 헤더의 중복된 버튼 제거 및 UI 정리
- **Build Time**: 2026-02-09 07:00:00

## [Alpha V1.036] - 2026-02-09 06:15:00

### 🎨 UI Refinement & Formatting
- **Summary**: Improve Number Visibility & Layout
- **Detail**:
  - **Decimal Removal**: KOSPI/KOSDAQ 지수를 제외한 모든 숫자(등락폭, 수급주체별 금액, 해외지수 등)의 소수점 제거하여 가독성 향상
  - **Overseas Layout**: 해외지수(DOW/NASDAQ/S&P500) 표시 방식을 3단 그리드(종목명 | 등락률 | 현재가)로 변경하여 데이터 구분 명확화
- **Build Time**: 2026-02-09 06:15:00

## [Alpha V1.035] - 2026-02-09 06:00:00

### 🌏 Overseas Index Symbol Fix
- **Summary**: Correct Symbols for NASDAQ & S&P500
- **Detail**:
  - **Symbol Correction**: KIS API에서 요구하는 올바른 심볼로 교체 (NASDAQ: `.IXIC` -> `COMP`, S&P500: `.SPX` -> `SPX`)
  - **Exchange Code**: 각 지수에 맞는 거래소 코드 매핑 적용 (`COMP` -> `NAS`, `SPX` -> `NYS`)
  - **Verification**: DOW(.DJI), NASDAQ(COMP), S&P500(SPX) 데이터 수신 확인 완료
- **Build Time**: 2026-02-09 06:00:00

## [Alpha V1.034] - 2026-02-09 05:00:00

### 🌏 Overseas Index Fallback & Fix
- **Summary**: Implement Date/Time Fallback & Rate Parsing Fix
- **Detail**:
  - **Fallback Logic**: KIS API가 시계열 데이터(`output2`)를 반환하지 않을 경우(장중/휴장 등), 서버 시간(KST)을 기준으로 날짜/시간을 생성하여 "표시 없음" 현상 방지
  - **Rate Parsing**: 등락률(`rate`)이 `NaN%`로 표시되던 문제 해결 (API 필드 파싱 안전장치 추가)
  - **Cleanup**: 로깅 로직 제거
- **Build Time**: 2026-02-09 05:00:00

## [Alpha V1.033] - 2026-02-09 04:00:00

### 🌏 Overseas Index & Env Fix
- **Summary**: Fix Overseas Index Display (Date/Time) & Restore KIS API Keys
- **Detail**:
  - **Env Fix**: `.env.local`에 누락된 KIS API Key 복구 (Token 발급 에러 해결)
  - **Overseas Index**: 해외지수(다우, 나스닥 등) 표출 시 날짜/시간 및 지연/종가 상태 표시 기능 추가 (`output2` Time Series 활용)
  - **Cleanup**: 디버깅용 API 및 로그 파일 제거
- **Build Time**: 2026-02-09 04:00:00

## [Alpha V1.032] - 2026-02-09 03:30:00

### 🖥️ Dashboard UX Redesign
- **Summary**: Modern Dashboard Header & Layout Update
- **Detail**:
  - **지수종합 카드**: KOSPI, KOSDAQ의 지수와 당일 투자자 순매수 현황을 한눈에 볼 수 있는 대형 카드 레이아웃 적용
  - **해외지수 리스트**: 주요 해외 지수(DOW, NASDAQ, S&P 500)를 컴팩트한 리스트 형태로 제공
  - **마켓트렌드 테이블**: 시장별(코스피, 코스닥) 외국인/개인/기관 순매수 현황을 직관적인 테이블로 구성
- **Build Time**: 2026-02-09 03:30:00

## [Alpha V1.031] - 2026-02-09 03:00:00

### 🟢 Real-Time Investor Data (Intraday)
- **Summary**: Switched Investor Trends to Real-Time Intraday API
- **Detail**:
  - **투자자별 순매수**: 기존 '일별(Daily)' 데이터 대신 '장중 실시간(Time-By-Market, FHPTJ04030000)' 데이터를 사용하여, 현재 시점의 누적 순매수 현황을 정확하게 표시
  - **차트**: 차트는 여전히 최근 1개월 일별 추이를 표시 (Daily API 병행 호출)
- **Build Time**: 2026-02-09 03:00:00

## [Alpha V1.030] - 2026-02-09 02:30:00

### 📊 Data Unit Correction
- **Summary**: Investor Net Buying unit fix (Million -> Eok)
- **Detail**:
  - **투자자별 순매수**: API 원본 단위(백만원)를 통상적으로 사용하는 **억 원** 단위로 변환하여 표시 (값 / 100)
  - **S&P 500**: 데이터 로딩 디버깅 로그 추가
- **Build Time**: 2026-02-09 02:30:00

## [Alpha V1.029] - 2026-02-09 02:00:00

### 📈 S&P 500 & Investor Data Fix
- **Summary**: Correct API usage for S&P 500 Index and Investor Trends
- **Detail**:
  - **S&P 500**: ETF(SPY)가 아닌 실제 지수(SPX) 데이터를 가져오도록 해외지수 전용 API(`FHKST03030200`) 연결
  - **Investor Trends**: KOSPI 투자자별 매매동향 API를 `FHPTJ04040000`(시장별 투자자매매동향)로 교체하여 정확한 순매수 데이터 제공 (개인/외국인/기관)
- **Build Time**: 2026-02-09 02:00:00

## [Alpha V1.028] - 2026-02-09 01:30:00

### 🛡️ System Stabilization
- **Summary**: Rate Limit Tightening & Investor API Fix
- **Detail**:
  - **Rate Limit**: 서버 요청 제한을 강화 (Concurrency 5->3, Interval 100ms->300ms)하여 500 에러 원천 차단
  - **Investor API**: 투자자별 순매수 데이터 요청 시 날짜 파라미터(최근 1개월)를 명시하여 호출 오류 수정
  - **S&P 500**: (TODO) 인덱스 심볼 점검 예정
- **Build Time**: 2026-02-09 01:30:00

## [Alpha V1.027] - 2026-02-09 01:00:00

### 🚑 Deep Fix (Data Blocking & WS Stability)
- **Summary**: Client-side Sequential Chunking & WS Backoff
- **Detail**:
  - **Data Blocking**: Batch 데이터를 4개씩 끊어서 순차적으로 요청(Sequential Chunking)하고, 실패 시 자동 재시도하는 로직 적용. (서버 500 에러 및 타임아웃 원천 차단)
  - **WS Stability**: WebSocket 연결 실패 시 무한 재접속으로 인한 깜빡임을 막기 위해 지수적 백오프(Exponential Backoff, 실패할수록 대기시간 증가) 알고리즘 적용
- **Build Time**: 2026-02-09 01:00:00

## [Alpha V1.026] - 2026-02-09 00:30:00

### 🚑 Deep Fix (Data Flood Prevention)
- **Summary**: Fix Massive 500 Errors & Data Loss
- **Detail**:
  - **Flooding Fix**: `SectorWatchList` 내의 모든 종목이 동시에 개별 API를 호출하여 서버 Rate Limit을 초과하던 문제 해결 (개별 Fetch 비활성화 및 Batch 전용 모드 적용)
  - **Stability**: 이제 리스트 로딩 시 Batch API 하나만 호출되므로 서버 부하가 95% 이상 감소하고 데이터 로딩 성공률 향상 예상
- **Build Time**: 2026-02-09 00:30:00

## [Alpha V1.025] - 2026-02-09 00:00:00

### 🎨 UI & Data Stability
- **Summary**: Grid Layout for Watchlists & Data Debugging
- **Detail**:
  - **UI**: 종목 리스트의 정렬 불량을 해결하기 위해 CSS Grid(12 cols) 시스템 도입 (종목명 6: 현재가 3: 등락률 3 비율)
  - **Debugging**: 데이터 유실 원인 파악을 위한 Batch API 응답 로그 추가
- **Build Time**: 2026-02-09 00:00:00

## [Alpha V1.024] - 2026-02-08 23:00:00

### 🚑 Login Fix (Signature Mismatch)
- **Summary**: Fix Server Action Signature for `useActionState`
- **Detail**: `useActionState` Hook이 요구하는 `prevState` 인자를 Server Action 함수에 추가하여 타입 에러 해결
- **Build Time**: 2026-02-08 23:00:00

## [Alpha V1.023] - 2026-02-08 22:30:00

### 🚀 Login Refactor (Server Actions)
- **Summary**: Login System migrated to Server Actions
- **Detail**:
  - **Stability**: 클라이언트 측 로그인 로직(`signInWithPassword`)을 제거하고 Next.js **Server Action**으로 이관
  - **Redirect**: 서버 측에서 쿠키 설정 및 리다이렉트(`redirect('/dashboard')`)를 처리하여 브라우저 환경 변수(AdBlocker 등)로 인한 무한 로딩 해결
- **Build Time**: 2026-02-08 22:30:00

## [Alpha V1.022] - 2026-02-08 22:00:00

### 🎨 Dashboard & Data Refactor
- **Summary**: Dashboard Content & Layout Update
- **Detail**:
  - **Layout**: 우측 "AI Analyst Insight" 패널 제거 및 전체 너비 확장
  - **Header**: "Market Insight Advisor" -> "일일 체크"로 변경, 설명 문구 수정
  - **Market Info**: KOSPI, KOSDAQ 등 주요 지수 정보를 "투자자별 순매수" 블록 상단으로 통합 ("시장정보" 섹션)
  - **Data Source**: 투자자별 순매수 데이터 대상을 "대형주"에서 "KOSPI 시장 전체"로 변경 (`0001` Market Trend 적용)
- **Build Time**: 2026-02-08 22:00:00

## [Alpha V1.021] - 2026-02-08 21:30:00

### 🔍 Debugging Mode
- **Summary**: Diagnose Infinite Loading
- **Detail**:
  - **Login Navigation**: `router.refresh()` 제거하고 `window.location.href`만 사용하여 라우터 충돌 가능성 배제
  - **Middleware Logs**: 서버 측 미들웨어 진입 및 경로 처리 로그 추가 (`[MW] Request: ...`)
- **Build Time**: 2026-02-08 21:30:00

## [Alpha V1.020] - 2026-02-08 21:20:00

### 🚑 Deep Fix (Middleware & Navigation)
- **Summary**: Fix Login Hang & WebSocket Error
- **Detail**:
  - **Middleware**: `/api/*` 경로에 대한 인증 검사를 제외하여, 비로그인 상태에서도 WebSocket Approval Key 발급 요청(405 오류 원인)이 가능하도록 수정
  - **Login Page**: `router.push`가 반응하지 않는 현상(Hanging)을 방지하기 위해 `window.location.href`를 통한 강제 네비게이션 폴백 추가
- **Build Time**: 2026-02-08 21:20:00

## [Alpha V1.019] - 2026-02-08 21:10:00

### 🚑 Build Fix
- **Summary**: Fix Build Errors (V1.018 Hotfix)
- **Detail**:
  - **Client Components**: 인증 관련 페이지(`register`, `forgot-password`, `update-password`)에 `"use client"` 지시어 누락 수정
  - **Dependency**: `tokenManager.ts`에서 삭제된 `lib/supabase`를 참조하던 문제를 수정 (독립 인스턴스 사용)
- **Build Time**: 2026-02-08 21:10:00

## [Alpha V1.018] - 2026-02-08 21:00:00

### 🏗️ Ground Zero Rebuild
- **Summary**: Login System Complete Overhaul
- **Detail**:
  - **New Architecture**: 도입 (`@supabase/ssr`) 및 미들웨어 기반 세션 관리 구현
  - **Middleware**: `middleware.ts` 추가로 페이지 이동 시 세션 동기화 및 갱신 보장
  - **Refactor**: 로그인/회원가입/비밀번호찾기 등 모든 인증 페이지를 새로운 클라이언트 유틸리티(`createClient`)로 전면 재작성
  - **Cleanup**: 기존의 불안정한 `supabase-js` 클라이언트 및 관련 "Hanging" 우회 코드 삭제
- **Build Time**: 2026-02-08 21:00:00

## [Alpha V1.017] - 2026-02-08 20:50:00

### 🚑 Deep Fix
- **Summary**: Resolve Login Hang (Direct API Implementation)
- **Detail**:
  - `supabase-js` 클라이언트의 내부 락다운(Hanging) 현상을 우회하기 위해 로그인 로직을 **Direct Fetch API** 방식으로 전면 교체함.
  - 더 이상 30초 타임아웃을 기다리지 않고 즉시 인증 서버와 통신합니다.
- **Build Time**: 2026-02-08 20:50:00

## [Alpha V1.016] - 2026-02-08 20:45:00

### 🔐 System Upgrade (Auth)
- **Summary**: Comprehensive Auth System Update
- **Detail**:
  - **Landing Page**: 로그인 / 회원가입 버튼 분리
  - **Registration**: 닉네임 설정이 포함된 회원가입 페이지 구현 (`/register`)
  - **Password Reset**: 비밀번호 찾기 및 재설정 기능 구현 (`/forgot-password`, `/update-password`)
  - **User Menu**: 대시보드 내 닉네임 표시 및 로그아웃 기능 추가
- **Build Time**: 2026-02-08 20:45:00

## [Alpha V1.015] - 2026-02-08 20:40:00

### ⚡ Optimization
- **Summary**: Login Flow Optimization
- **Detail**:
  - 버튼 텍스트 변경: "Sign In" -> "Login"
  - 로그인 페이지 진입 시 자동으로 오래된 세션 데이터 정리 (무한 로딩 방지)
  - 로그인 시도 직전 로컬 스토리지 초기화 로직 추가
- **Build Time**: 2026-02-08 20:40:00

## [Alpha V1.014] - 2026-02-08 20:35:00

### 🚑 Hotfix
- **Summary**: Landing Page 404 Fix
- **Detail**: '더 알아보기' 버튼의 잘못된 링크(/about) 수정 (스크롤 이동으로 변경)
- **Build Time**: 2026-02-08 20:35:00

## [Alpha V1.013] - 2026-02-08 20:30:00

### 🛠 UX Improvement
- **Summary**: Login UI Logic Refinement
- **Detail**:
  - 'Force Session Reset' 버튼이 대기 상태에서 자동 노출되는 현상 수정
  - 실제 로그인 시도 중 타임아웃 발생 시에만 버튼이 나타나도록 로직 변경
- **Build Time**: 2026-02-08 20:30:00

## [Alpha V1.012] - 2026-02-08 20:25:00

### 🧹 UI Cleanup
- **Summary**: Remove Debug UI
- **Detail**:
  - 로그인 페이지 진단 로그(검은 박스) 제거
  - 'Force Session Reset' 버튼은 유지 (문제 발생 시에만 노출)
- **Build Time**: 2026-02-08 20:25:00

## [Alpha V1.011] - 2026-02-08 20:20:00

### 🚑 Hotfix
- **Summary**: Session Reset Tool
- **Detail**:
  - Supabase Client 초기화 옵션 명시적 설정
  - 로그인 페이지에 'Force Session Reset' 버튼 추가 (로컬 스토리지 초기화 기능)
  - 'Supabase Client HANGING' 상태 감지 시 리셋 버튼 자동 노출
- **Build Time**: 2026-02-08 20:20:00

## [Alpha V1.010] - 2026-02-08 20:15:00

### 🚑 Hotfix
- **Summary**: Network Diagnostics Tool
- **Detail**: 로그인 페이지에 상세 네트워크 진단 도구 탑재 (Raw Fetch vs Client 테스트)
- **Build Time**: 2026-02-08 20:15:00

## [Alpha V1.009] - 2026-02-08 20:10:00

### 🛠 Build Fix
- **Summary**: Fix Build Error & Update Rules
- **Detail**:
  - `WebSocketContext.tsx` 빌드 에러 수정 (`usePathname` import 누락 해결)
  - 개발 규칙 문서(`doc/gemini.md`) 생성 및 에러 방지 가이드 추가
- **Build Time**: 2026-02-08 20:10:00

## [Alpha V1.008] - 2026-02-08 20:05:00

### 🔄 Bug Fix
- **Summary**: Login Page Optimization
- **Detail**:
  - 로그인 페이지에서 불필요한 WebSocket 연결 차단 (리소스 확보)
  - 네트워크 진단 로직 강화 (Supabase 연결 상태 상세 확인)
- **Build Time**: 2026-02-08 20:05:00

## [Alpha V1.007] - 2026-02-08 20:02:00

### 🔄 Bug Fix
- **Summary**: Login Timeout Extended
- **Detail**: 로그인 요청 타임아웃 시간을 10초에서 30초로 연장 (네트워크 지연 대응)
- **Build Time**: 2026-02-08 20:02:00

## [Alpha V1.006] - 2026-02-08 20:01:00

### 🚀 Performance Update
- **Summary**: Global API Rate Limiter Implementation
- **Detail**:
  - API 순간 과부하 방지를 위한 전역 속도 제어기(Rate Limiter) 도입
  - 대시보드 로딩 시 데이터 누락 현상 수정 (Concurrency Limit: 5)
  - Watchlist 상단에 최종 업데이트 시간 표시 UI 추가
- **Build Time**: 2026-02-08 20:01:00

## [Alpha V1.005] - 2026-02-07 20:49:00

### 🚀 Performance Update
- **Summary**: Batch Data Fetching Implementation
- **Detail**: 
  - 대시보드 데이터 로딩 안정성 확보를 위해 **일괄 요청(Batch Fetching)** 시스템 도입
  - 기존 30+개 개별 요청 -> 6개 그룹 요청으로 최적화 (API 차단 방지)
  - 서버 사이드 병렬 처리(Concurrency Control) 적용
- **Build Time**: 2026-02-07 20:49:00

## [Alpha V1.004] - 2026-02-07 20:10:00

### 🔄 Bug Fix
- **Summary**: Fix Login Redirect
- **Detail**: 로그인 성공 시 랜딩페이지(`/`)가 아닌 대시보드(`/dashboard`)로 이동하도록 수정
- **Build Time**: 2026-02-07 20:10:00

## [Alpha V1.003] - 2026-02-07 19:55:00

### 🔄 Build Update
- **Summary**: Fix Build Error & Restore Hybrid Data Mode
- **Detail**: 
  - `tokenManager.ts` 누락 파일 추가 (빌드 에러 수정)
  - Vercel 환경에서 WebSocket(WSS) 차단 가능성에 대비하여 REST API Fallback 복구
  - Supabase 토큰 캐싱(속도 최적화) 적용 완료
- **Build Time**: 2026-02-07 19:55:00

## [Alpha V1.002] - 2026-02-07 19:05:00

### 🔄 Build Update
- **Summary**: TS Config Optimization
- **Detail** : tsconfig.json 최적화를 통해 references 폴더 제외 (메모리 누수 방지)
- **Build Time**: 2026-02-07 19:05:00

## [Alpha V1.001] - 2026-02-06 23:59:00

### 🚀 Build Update
- **Summary**: Supabase Integration & Login System Load
- **Detail** : 로컬 스토리지 제거 및 Supabase DB 마이그레이션 완료. 로그인 인증 시스템 도입.
- **Build Time**: 2026-02-06 23:59:00
