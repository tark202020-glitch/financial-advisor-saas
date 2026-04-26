## [Alpha V1.373] - 2026-04-26 22:48:21

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : 
  - 해외 주식 금액 표기 원화(KRW) 일원화 (US 뱃지는 유지하되 단가/총금액 표시를 환율 적용된 "원" 단위로 소수점 없이 일괄 적용)
- **Build Time**: 2026-04-26 22:48:21

## [Alpha V1.372] - 2026-04-26 22:30:10

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : 
  - 매도 수익금 계산 오류 수정 (전체 기간 평균 매입단가 기준 적용)
  - 해외 주식 환율 적용 로직 개선 (단가/총금액 $ 표시 및 원화 환산 매도 수익금 계산)
  - 전체 시스템 Fallback 환율 1,350원 → 1,450원으로 일괄 업데이트
- **Build Time**: 2026-04-26 22:30:10

## [Alpha V1.371] - 2026-04-26 20:04:09

### 🚀 Feature: 누적 수익금 동적 재구성 파이프라인 전면 개편
- **Summary**: 과거 매매 기록을 기반으로 누적 수익금 및 평가금 추이를 완벽하게 추적할 수 있도록 API 및 연산 구조를 전면 재구축
- **Detail** : 
  - `portfolio_daily_history` DB 스냅샷 의존성 제거 및 매매 기록 역산 로직 도입 (4월 9일 이전 데이터 복구)
  - 조회 기간 한정 방어 로직 추가 (최대 100일) 및 UI 자동 보정 처리
  - 주가 조회 3회 재시도(Retry) 및 조회 실패 종목(`failedSymbols`) 명시화 알림 모달 UI 구현
  - 휴장일 초기 기준가 누락 방지를 위한 검색일자 15일 버퍼 스캔 기능 적용
  - API 부하 및 로딩 시간 단축을 위해 `portfolio_daily_history` 테이블에 동적 연산 결과 자동 캐싱(Upsert) 도입
- **Build Time**: 2026-04-26 20:04:09

## [Alpha V1.370] - 2026-04-26 19:43:00
### 🔧 Fix: 리포트 대시보드 차트 Tooltip 라벨 표시 오류 수정
- **Summary**: 차트에서 마우스 오버 시 표시되는 Tooltip 모달 내 항목명과 색상이 일치하지 않고 하드코딩된 값으로 강제 표시되던 버그 수정
- **Detail** : 
  - `ReportDashboard.tsx` 내의 모든 `Tooltip` formatter 로직에서 잘못된 삼항 연산자(예: `name === 'cumulativeProfit'`)를 제거
  - `ComposedChart`에서 전달하는 고유 `name` 속성("누적 수익금", "일별 손익" 등)을 Tooltip에서 그대로 반환하도록 수정하여 범례 색상과 텍스트가 정상적으로 매칭되도록 복구
- **Build Time**: 2026-04-26 19:43:00

## [Alpha V1.369] - 2026-04-26 19:14:00
### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : 투자 리포트 대시보드 차트 시각화(비율 및 레이아웃) 구조 개선
  - X축 간격(Time Scale) 정상화: 데이터가 없는 빈 날짜(휴일 등)를 이전 데이터로 보정하여 채워넣어 차트의 가로 간격이 실제 시간의 흐름과 완벽히 비례하게 표시되도록 `useReportData` 훅 수정
  - X축 라벨 겹침 방지를 위해 `minTickGap={30}` 적용
  - 레이아웃 최적화: 가독성 향상을 위해 2열(grid-cols-2) 레이아웃을 1열(grid-cols-1)로 통합 적용
- **Build Time**: 2026-04-26 19:14:00

## [Alpha V1.368] - 2026-04-26 14:45:00
### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : KIS API 과거 주가 활용 스냅샷 동적 재구성(Dynamic Reconstruction) 파이프라인 탑재
  - `src/lib/kis/client.ts`: 과거 기간의 일봉 차트 요청 API 함수 구축
  - `src/app/report/actions.ts`: `trade_logs` 역 추적을 통한 일자별 종목/수량 연산 및 당시 종가 매핑 
  - `src/hooks/useReportData.ts`: DB 스냅샷 의존성 제거 및 서버액션 역산 파이프라인 연동
  - (이제 DB 스냅샷 없이도 지정 기간의 자산 평가 상태 다이내믹 렌더링 지원)
- **Build Time**: 2026-04-26 14:45:00

## [Alpha V1.367] - 2026-04-26 14:26:00

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : 자동 로그인(로그인 유지) 기능 추가 적용
  - 로그인 화면에 자동로그인 체크박스 UI 추가
  - Supabase 쿠키 미들웨어 및 서버 토큰의 Session/Persistent 속성 제어
  - 해제 시 브라우저 종료와 함께 로그아웃 되도록 생명주기 관리
- **Build Time**: 2026-04-26 14:26:00

## [Alpha V1.366] - 2026-04-26 14:15:00

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : 내 투자리포트(월간) 대시보드 신규 추가 
  - 사이드바 메뉴 연동 (/report) 
  - 시작/종료일 지정 기능 추가
  - 누적 투자수익, 투자금/평가금 차트, 기간별 매매 상세내역 테이블 구현
- **Build Time**: 2026-04-26 14:15:00

## [Alpha V1.365] - 2026-04-21 21:15:20

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : ETF 배당 정보 수집 및 대시보드 UI 연동, DB 스키마 업데이트 스크립트 작성
- **Build Time**: 2026-04-21 21:15:20

## [Alpha V1.364] - 2026-04-21 20:51:00

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail** : ETF 분석기 변경 이력 누적 오류(임계치, 중복데이터) 수정
- **Build Time**: 2026-04-21 20:51:00

## [Alpha V1.363] - 2026-04-19 15:55:00

### 🔄 Build Update
- **Summary**: Auto-generated build update.
- **Detail**: 배당주 분석 기능 및 UI 완전 삭제 (KRX 서버리스 크롤링 불가로 인한 처리)
- **Build Time**: 2026-04-19 15:55:00

### 🚀 Major Refactor: ETF 배당 데이터 소스 전면 교체 (KIS API → KRX + 네이버 금융)
- **Summary**: KIS API Rate Limit / 타임아웃 / 데이터 누락 문제를 근본적으로 해결하기 위해 데이터 소스를 KRX 정보데이터시스템(data.krx.co.kr) OTP 방식으로 전면 교체
- **Detail**:
  - **[NEW] `src/lib/krxData.ts`**: KRX OTP 2단계(OTP 발급 → CSV 다운로드) 벌크 데이터 수집 모듈 신규 생성
    - `fetchKrxEtfPrices()`: ETF 전종목 시세 (종가, 시가총액, NAV 등) 조회
    - `fetchKrxEtfDistributions()`: ETF 분배금 현황 (기준일, 지급일, 현금분배금) 조회
    - `fetchNaverEtfPrices()`: 네이버 금융 API 폴백 (KRX 장애 시 가격 대체)
    - `getKrxEtfDividendYield()`: 가격 + 분배금 인메모리 조인 → TTM 수익률 산출
    - EUC-KR 인코딩 CSV 파서 내장, 비영업일 자동 재시도 (최대 3일 전까지)
  - **[MODIFY] `generate-dividend-etf/route.ts`**: KIS API 의존 완전 제거
    - `getKsdinfoDividend`, `getEtfPrice` import 제거 → `getKrxEtfDividendYield` 단일 호출로 교체
    - `all_stocks_master.json` 기반 ETF 후보 파싱 로직 제거 (KRX가 ETF 전종목 제공)
    - **API 호출: 312+회 → 2회 (OTP 2 + Download 2)**
    - **소요시간: 30~60초 → 3~5초** (maxDuration 60 → 30)
    - **API 키 불필요, Rate Limit 없음, 커버드콜 ETF 전수 포함**
  - LLM 필터 추출 및 마크다운 리포트 생성 로직은 그대로 유지
  - 연환산(Annualized) 보정 로직 유지 (월배당 ETF × 12, 분기배당 × 4)
- **Build Time**: 2026-04-19 22:35:00

## [Alpha V1.361] - 2026-04-19 00:45:00

### 🚀 Update: ETF 배당수익률 연간(TTM) 기준 산출로 로직 전면 수정
- **Summary**: 매월 배당(월배당)을 지급하는 커버드콜 종목 등의 시가배당률이 지나치게 낮게 표시되던 심각한 수학적 오류 해결
- **Detail**:
  - `generate-dividend-etf/route.ts`: 종목별 배당 이력 조회 기간을 최근 6개월에서 최근 1년(Trailing Twelve Months, 12개월)으로 2배 확대
  - 기존에는 단순히 '최근 마지막으로 지급했던 단 1회분 배당금'만을 추출해 수익률을 계산했기 때문에, 월배당(커버드콜 등) 종목들이 연배당 종목 대비 엄청난 역차별을 받고 있었음
  - 최근 1년 동안 해당 ETF가 실제로 지급한 **모든 배당금의 총합(연 배당금)** 을 분자로 하여 주가를 나누도록 시가배당률 통계 공식을 정상치로 상향 수정
  - AI 마크다운 및 기본 렌더링 테이블 표에 '연 배당금'과 '(최근 1회 지급액)'이 동시에 직관적으로 병기되도록 시각적 데이터 폼 개선
- **Build Time**: 2026-04-19 00:45:00

## [Alpha V1.360] - 2026-04-19 00:34:00

### 🚀 Update: ETF 배당 전수 조회 제한 해제 및 수집 속도 최적화
- **Summary**: 고배당 저가 ETF가 가격 조회 단계에서 누락되는 현상 전면 수정
- **Detail**:
  - `generate-dividend-etf/route.ts`: 전체 배당 이력이 확인된 ETF에 대해 배당금 절대치 기준으로 30개만 잘라 가격을 조회하던 임의 제한 기준 폐기
  - 모든 유효 ETF들의 실제 시가를 100% 연동하여, 주가는 낮으나 %단위 기대 수익률이 매우 높은 소외 ETF들도 모두 추천되도록 수정
  - 늘어난 시가 조회 대기열의 속도 저하를 막기 위해 가격 병렬 연산 크기(`priceChunkSize`) 10 → 20 상향
- **Build Time**: 2026-04-19 00:34:00

## [Alpha V1.359] - 2026-04-19 00:20:00

### 🚀 Optimization: ETF 배당 전수 스캔 알고리즘 변경 및 고속화
- **Summary**: ETF 후보 전수 스캔 및 병렬 통신 제한 해제
- **Detail**:
  - `generate-dividend-etf/route.ts`: 종목 필터링 로직 개선
    - LLM 프롬프트에서 강제 추출되던 `["배당"]` 제한 키워드를 해제하여 이름에 '배당'이 들어가지 않은 미국ETF(TIGER 미국S&P500 등)도 후보에 포함
    - 레버리지/인버스/선물/원자재 등 배당 무관 종목 사전 필터링(JUNK 가지치기)
  - `kisRateLimiter` 통신 풀 상한치 상향: 동시성 10, 대기 60ms (~16 req/sec) 적용
  - 벌크 스캔(일부 페이지 누락됨)을 제거하고, 400여 개인 모든 순수 ETF에 대해 **병렬 개별 배당 조회(Concurrent Scan)** 를 진행하여 30초 내로 정확한 배당 이력을 100% 탐색하도록 변경
- **Build Time**: 2026-04-19 00:20:00

## [Alpha V1.358] - 2026-04-18 00:39:00
- **Summary**: 배당 ETF/주식 분석 시 KIS API 호출을 200+회 → ~20회로 획기적 절감
- **Detail**:
  - `generate-dividend-etf/route.ts`: **벌크 배당 조회** 도입
    - 기존: ETF 후보 × 2회 API(가격+배당) → 60개 제한 필요 → 종목 누락 발생
    - 변경: `getKsdinfoDividend(sht_cd='')` 1회 호출로 전체 배당 데이터 수집
    - 로컬에서 ETF 후보 전수(100+개)와 교차 매칭 후 상위 20개만 가격 조회
    - 총 API: ~21회 (배당 1 + 가격 20), 60초 타임아웃 안전
  - `generate-dividend/route.ts`: 동일 전략 적용
    - 랭킹 1회 + 벌크 배당 1회 + 가격/종목명 ~15회 = ~17회
  - 표시 상한: 최대 10개로 통일
  - Gemini 모델: `gemini-1.5-flash` → `gemini-2.0-flash` 업그레이드
- **Build Time**: 2026-04-18 00:39:00

## [Alpha V1.357] - 2026-04-18 00:25:30

### 🚀 Feature: 배당 / 배당ETF 데이터 추출 및 렌더링 AI 고도화 (Gemini 2-Step 파이프라인)
- **Summary**: 하드코딩된 필터 조건을 지우고 입력된 프롬프트에 맞춰 1.조건 추출, 2.마크다운 생성 등을 Gemini AI가 수행하도록 고도화
- **Detail**:
  - `src/app/api/study/generate-dividend-etf/route.ts`:
    - 기존 밴밴(커버드콜 등) 하드코딩 키워드 일괄 삭제
    - Gemini 를 활용한 순수 JSON 조건/개수 필터 파서 적용
    - 데이터 추출 후, 데이터를 다시 Gemini 프롬프트와 병합하여 사용자 맞춤형 마크다운 포맷 생성
  - `src/app/api/study/generate-dividend/route.ts`:
    - 기존 고정 상위 10건 반환 로직에서 사용자 프롬프트 기반 가변 개수 필터 적용
    - ETF와 동일하게 실제 API 데이터를 바탕으로 Gemini 마크다운 자동 생성
- **Build Time**: 2026-04-18 00:25:30

## [Alpha V1.356] - 2026-04-17 23:58:45

### ✨ Feature: 배당 분석 프롬프트 사용자 커스텀 설정 기능
- **Summary**: 배당주/배당ETF 생성에 사용되는 기본 프롬프트를 관리자가 직접 화면에서 수정 및 저장할 수 있는 기능 추가
- **Detail**:
  - `system_settings` 테이블 생성 미적용 시 대응 및 RLS 정책 갱신 (추가 이메일 권한 등록: `tark2020@naver.com`)
  - `src/app/study/page.tsx`: 프롬프트 (배당주 / 배당ETF) 진입 통합 관리 및 편집 UI 구현
  - `src/app/api/system-settings/route.ts`: 시스템 세팅값 동적 로딩 및 UPSERT 관리 API 신설
- **Build Time**: 2026-04-17 23:58:45

## [Alpha V1.355] - 2026-04-17 22:54:15

### ✨ Refactor: ETF 분석기 카테고리 목록 리뉴얼
- **Summary**: ETF 분석기 내 부여 가능한 카테고리 목록을 사용성 향상을 위해 직관적인 분류 체계로 개편
- **Detail**:
  - `ETFDashboard.tsx`: 기존(AI·테크, 전략, 배당, 직접추가) -> 신규(AI, 배당, 에너지, 지수, 기타) 체계로 변경 및 색상 등 디자인 레이아웃 재적용
- **Build Time**: 2026-04-17 22:54:15

## [Alpha V1.354] - 2026-04-17 22:48:30

### ✨ Feature: ETF 분석기 — 수동 카테고리 변경 기능
- **Summary**: ETF 분석기 상세 패널에서 개별 종목의 카테고리(직접추가, 배당, 전략, AI·테크)를 사용자가 직접 수정할 수 있는 기능 추가
- **Detail**:
  - `ETFDashboard.tsx`: 상세 패널 우측 상단에 카테고리 셀렉트 박스(`select`) 추가 및 수정 API(`PATCH`) 연결
- **Build Time**: 2026-04-17 22:48:30

## [Alpha V1.353] - 2026-04-17 22:15:20

### ✨ Feature: ETF 분석기 — 일봉 차트 및 현재가 패널 연동
- **Summary**: ETF 분석기 대시보드 내 보유종목 구성 테이블 상단에 선택 종목의 실시간 가격 및 시각적 일봉 차트 추가
- **Detail**:
  - `useStockPrice` 훅을 연동하여 웹소켓 기반 실시간 현재가, 등락폭, 등락률 헤더 추가
  - `recharts` 라이브러리를 활용하여 일봉 차트 내 5, 20, 60, 120일 이동평균선 및 종가 곡선(Line chart) 도식화 반영
  - 하단 거래량(Volume) 막대그래프(Bar chart) 연동
- **Build Time**: 2026-04-17 22:15:20

## [Alpha V1.352] - 2026-04-17 21:48:37

### ✨ Feature: ETF 분석기 — 자동선정 → 수동 검색/추가 방식 전환
- **Summary**: ETF 분석기의 추적 목록 구성 방식을 자동 선정에서 사용자가 직접 검색+추가/삭제하는 방식으로 전면 개편
- **Detail**:
  - **API 전환** (`select-active/route.ts`): 기존 자동 선정 POST 로직 제거 → 개별 종목 추가(POST), 삭제(DELETE), 메모 수정(PATCH) CRUD API로 교체
  - **대시보드 재작성** (`ETFDashboard.tsx`): 상단 검색 바 추가 (기존 `/api/search/stock` 활용, 300ms 디바운스), 종목별 삭제 버튼 (hover 표시 → 확인/취소 2단계), 인라인 메모 편집 기능
  - **DB 확장**: `etf_tracked_list` 테이블에 `memo`(TEXT), `market`(TEXT) 컬럼 추가
  - **카테고리 확장**: 기존 ai/strategy/dividend + 신규 `custom`(직접추가) 카테고리 추가
  - **공통 기능**: 계정별 분리 없이 모든 사용자가 동일 목록 공유
  - **보존**: 보유종목 비중 조회, 변경 이력 추적, 크론 잡, Google Sheets 연동 모두 유지
- **Build Time**: 2026-04-17 21:48:37

## [Alpha V1.351] - 2026-04-17 11:23:14

### 🔄 Build Update
- **Summary**: 일일 포트폴리오 스냅샷 예외처리 개편 및 에러 격리 로직 적용
- **Detail**:
  - 단일 종목 시세 조회 실패 시 전체 유저의 스냅샷 생성이 멈추는(Error throw) 기존 무결성 검증 로직 제거
  - 시세 조회 실패 시 최대 2회(0.5초 간격)의 재시도(Retry) 로직 추가
  - 지속 실패한 종목은 차트 붕괴 현상 방지를 위해 가장 최근 스냅샷의 전일 가격을 찾아 Fallback(임시 유지) 적용
  - 실패 종목은 `is_failed: true` 속성을 부여하여, 프론트엔드의 등락 요약 테이블에 "⚠️ OO종목 (조회실패-전일가격유지)" 경고를 표시하도록 연동
- **Build Time**: 2026-04-17 11:23:14

## [Alpha V1.350] - 2026-04-11 12:16:22

### 🔄 Build Update
- **Summary**: 일일 총 평가금액 증감액 및 실시간 평가손익 단일화 로직 적용
- **Detail**:
  - 요약표 테이블의 증감액 계산을 단순 뺄셈이 아니라 투입 원금 증가 효과를 뺀 "순수 평가손익" 기준으로 맞추어 일치시킴
  - 요약표 1행에 '오늘 (실시간)' 데이터 행 표출을 추가하여 종합화면의 실시간 평가손익과 1원 단위까지 동기화
  - 테이블 헤더 명칭을 '전일대비 증감액'에서 '순수 시세손익(전일비)'로 직관적으로 개선
- **Build Time**: 2026-04-11 12:16:22

## [Alpha V1.349] - 2026-04-11 02:22:15

### 🔄 Build Update
- **Summary**: 실시간 시세 API 폴백(Fallback) 방어 로직 제거 및 무결성 강화
- **Detail**:
  - 스냅샷 저장 중 KIS API 시세 연동에 단 1종목이라도 실패할 경우, 원금(buy_price)으로 폴백하여 평가금액 정보가 손상되는 기존 이슈 수정
  - 시세 누락 발생 시 오염된 데이터 저장을 원천 차단하고 전체 스냅샷 처리를 취소(에러 반환)하도록 로직 변경 (데이터 무결성 100% 보장)
- **Build Time**: 2026-04-11 02:22:15

## [Alpha V1.348] - 2026-04-11 01:45:08

### 🔄 Build Update
- **Summary**: 일일 포트폴리오 스냅샷 픽스 및 환율 고정 적용 배포
- **Detail**:
  - 포트폴리오 일일 스냅샷 누락 방지를 위해 자정(0시 ~ 6시) 실행 시 전날 데이터로 기록되도록 날짜 보정 로직 추가
  - '총 투자 금액' 및 '총 평가 금액'을 현재 환율 기준으로 통일하는 파이프라인 신설 (과거 원금 변동 현상 완벽 해결)
- **Build Time**: 2026-04-11 01:45:08

## [Alpha V1.347] - 2026-04-09 22:42:00

### ✨ Feature: 포트폴리오 일일 스냅샷 및 상세 히스토리 뷰 제공
- **Summary**: 매일 지속적인 '총 투자 금액' 및 '총 평가 금액'의 변화를 저장하고 상세 내역을 추적할 수 있는 자동 기록 시스템과 대시보드 확장 UI 적용
- **Detail**:
  - **스냅샷 백엔드(Cron) 신설**: 전체 사용자의 당일 KIS 종가를 병렬 조회해 투자/평가 총액과 개별 종목의 구성(assets_snapshot)을 계산한 뒤 `portfolio_daily_history` 테이블에 적재하는 서버 API 구현 (`/api/cron/portfolio-snapshots`).
  - **프론트엔드 연동 훅**: `usePortfolioHistory` 훅을 작성하여, DB에 저장된 히스토리와 당일 매수(BUY) 기록(`trade_logs`)을 클라이언트 레벨에서 교차 분석해 차액과 차액의 발생 사유(어떤 종목을 샀는지, 어떤 종목이 올랐는지)를 도출.
  - **대시보드 UI 확장성**: '총 투자 금액' 및 '총 평가 금액' 카드를 마우스 클릭 가능한 버튼 뷰로 변경하고, 선택 시 아래로 확장되는 '증감액 추적 테이블' 및 요약 정보 렌더러 구현.
- **Build Time**: 2026-04-09 22:42:00

## [Alpha V1.346] - 2026-04-08 22:12:00

### ✨ Feature: 배당금 입력 UX 및 모달 내역 연동 강화
- **Summary**: 주식 상세 모달 내의 거래내역 입력 폼에서 '배당금' 선택 시 UI가 맞춤형으로 동적 변경되도록 개선하고, 입력된 배당 메모 데이터가 누적 배당금 구성내역 테이블로 직접 연동되도록 기능 고도화
- **Detail**:
  - **입력 폼 동적 라벨링**: 스위칭된 거래 구분이 '배당금'일 경우, '가격' 라벨을 '주당 배당금'으로 변경하고 수량 옆에 동적 계산된 '총합' 내역을 렌더링.
  - **배당 수량 입력 개방**: 배당금 입력 시 수량을 무조건 1로 강제하던 이전 로직을 폐기하여 부분 배당/병합 배당금도 유연하게 기록 가능하게 조치.
  - **모달 거래내역 뷰어 구조 변경**: '배당' 거래 기록 출력 시 데스크톱/모바일 뷰 양쪽 모두 가격 요소 하단에 황색 텍스트로 *총합 금액* 노출 추가.
  - **테이블-메모 연동**: 포트폴리오의 '누적 배당금 구성내역 테이블'에 `메모` 컬럼을 신설했으며, 모달창 폼에서 작성됐던 각 배당 이력들의 메모들을 추출 및 결합하여 전시.
- **Build Time**: 2026-04-08 22:12:00

## [Alpha V1.345] - 2026-04-08 21:54:00

### 🎨 UI Improvement: 배당금 구성 내역 테이블 아키텍처 개편
- **Summary**: 포트폴리오의 '총 누적 배당금액' 아코디언 메뉴 UI를 기존의 카드형 그리드 배치에서 더욱 직관적인 반응형 테이블 구도로 전면 리팩터링
- **Detail**:
  - **테이블 정보 확장**: [종목, 현재 가격, 수량, 주당 배당금, 배당률, 총액] 등 6가지 상세 컬럼을 신설하여 배당 이력에 대한 자산 심층 분석을 제공.
  - **데이터 정확도 고도화**: 배당 관련 데이터 연산식(dividendGains)에 `현재 가격(getPrice)` 조회를 보강하여, 실제 주당 배당수익률(`배당률`)과 외화($) 환산 로직을 정밀하게 보정.
  - **전량 매도(거래 완료) 상태 분기**: 잔고 수량이 0인 거래 완료 자산의 경우, 오류를 방지하기 위해 가격 정보 Fallback과 '거래 완료' 플래그 UI를 함께 추가 구현함.
- **Build Time**: 2026-04-08 21:54:00

## [Alpha V1.344] - 2026-04-08 21:26:00

### ✨ Feature: 포트폴리오 총 상장/누적 배당금액 상세 내역 UI 구현
- **Summary**: 포트폴리오 요약에서 거래가 완료된 종목을 포함한 모든 누적 배당금 총액을 계산하여 표기하고, 클릭 시 배당 구성 상세 내역이 전개되는 아코디언 컴포넌트 신규 적용
- **Detail**:
  - **계산식 분리**: 기존 재고수량(`quantity > 0`) 조건에 묶여있던 배당금 합산 기능을 모듈화하여, 수량이 전부 청산된 거래 완료 종목의 과거 가상 배당 이력까지 100% 누적 합산하도록 `dividendGains` 로직 전면 독립
  - **아코디언 컴포넌트 추가**: 대시보드 상단 '총 평가손익' 박스 내부의 배당금 텍스트를 누를 수 있는 인터랙션 UI로 개선하고, 이를 토글할 때 아래 방향으로 항목(개별 종목별 배당 원화/외화)이 스르르 펼쳐나오도록 구현
  - **UX 및 컬러시스템 통합**: 기존의 "거래 완료 수익" 카드와 유사한 검정·금빛 배색 레이아웃을 도입하여 포트폴리오 전체 심미성 보완
- **Build Time**: 2026-04-08 21:26:00

## [Alpha V1.343] - 2026-03-31 17:49:30

### ♻️ Refactor: ETF Google Sheets 저장 로직 V3 전면 재구축
- **Summary**: ETF 보유종목 Google Sheets 저장 구조를 V2(행=종목, 열=날짜)에서 V3(행=날짜, 열=종목, ETF별 개별 탭)으로 전면 재구축
- **Detail**:
  - **구조 변경**: 행=종목/열=날짜 → **행=날짜/열=종목** 전환 (가독성 대폭 향상)
  - **ETF별 개별 시트 탭**: 기존 단일 `ETF보유종목` 시트 → ETF 1개당 1개 탭 (예: `TIGER AI반도체_365040`)
  - **20개 종목 슬롯**: 종목당 3열(종목명, 코드, 비중%) × 20슬롯 = 61열 고정 (현재 TOP10, 여유 확보)
  - **동일 날짜 덮어쓰기**: 같은 날짜에 재실행 시 중복 없이 기존 행 업데이트
  - **V2 함수 전체 제거**: `findETFBlocksV2`, `updateBlockV2`, `appendNewBlockV2`, `buildFullSheetV2`, `updateExistingSheetV2`
  - **V3 함수 신규**: `getETFSheetName`, `buildHeaderRow`, `buildDateRow`, `ensureETFSheet`, `appendETFHoldingsHorizontal` (리팩터링)
  - **cron 핸들러 호환**: 함수 시그니처 동일, `route.ts` 변경 불필요
- **Build Time**: 2026-03-31 17:49:30



### 🔧 Fix: 배당 ETF 브랜드 목록 대폭 확대
- **Summary**: ETF 브랜드 20개 → 33개로 확대, 누락되던 ETF 후보군 확보율 향상
- **Detail**:
  - **추가 브랜드 13개**: `RISE`(구 KBSTAR), `TIME KOREA`, `KIWOOM`, `DAISHIN`, `TRUSTON`, `FOCUS`, `ITF`, `UNICORN`, `VITA`, `WON`, `신한`, `마이다스`, `에셋플러스`, `더제이`
  - 마스터 데이터(`all_stocks_master.json`)에서 배당/액티브/보험/은행 키워드 종목의 실제 브랜드를 분석하여 누락 항목 식별
- **Build Time**: 2026-03-24 17:46:05

## [Alpha V1.341] - 2026-03-24 17:10:41

### ✨ Feature: 배당 분석 리포트 고도화
- **Summary**: 배당주 TOP10에 우선주 포함, 배당 ETF 제외 키워드 추가, 리포트 하단에 DART 배당 공시 링크 추가
- **Detail**:
  - **`generate-dividend/route.ts` [수정]**: `GB2: '6'`(보통주) → `'0'`(전체, 우선주 포함), 횟수 컬럼 추가 (2년간 배당 건수 + 연간 추정), DART 배당 공시 링크 섹션 추가
  - **`generate-dividend-etf/route.ts` [수정]**: 제외 키워드에 `'채권'`, `'미국'` 추가, DART 배당 공시 링크 섹션 추가
  - **`opendart.ts` [수정]**: `fetchDividendDisclosures()` 함수 신규 — DART `list.json` API로 배당 키워드 공시 필터링 + `rcept_no` 기반 공시 링크 생성 (종목당 최대 3건)
  - **`doc/배당주_분석_로직_문서.md` [신규]**: 배당주/ETF 분석 전체 로직 문서화
- **Build Time**: 2026-03-24 17:10:41

## [Alpha V1.340] - 2026-03-24 14:22:12

### 🔧 Fix: 로그인 페이지에 회원가입 링크 추가
- **Summary**: 로그인 페이지에서 회원가입 페이지로 이동할 수 있는 네비게이션 링크 추가
- **Detail**:
  - **`/login/page.tsx` [수정]**: 하단에 "계정이 없으신가요? 회원가입" 링크 추가 (`/register` 페이지로 이동)
  - **`/login/page.tsx` [수정]**: "Back to Dashboard" → "홈으로 돌아가기" 한글화
- **Build Time**: 2026-03-24 14:22:12

## [Alpha V1.339] - 2026-03-22 16:08:00

### 🔧 Fix: 회원가입 프로세스 전면 재구축
- **Summary**: 회원가입이 동작하지 않던 문제를 해결 — Server Action 방식 전환 + 인증 콜백 라우트 신규 생성
- **Detail**:
  - **`/auth/callback/route.ts` [신규]**: Supabase 이메일 인증 완료 후 code→세션 교환 콜백 라우트 생성
  - **`/register/actions.ts` [신규]**: 회원가입을 Server Action으로 구현 (서버 사이드 signUp + emailRedirectTo 설정 + 중복 이메일 감지)
  - **`/register/page.tsx` [수정]**: 클라이언트 사이드 signUp → useActionState 기반 Server Action 연동으로 전환, 한글 UI 적용
  - **`client.ts` [수정]**: `detectSessionInUrl: false` → `true` 변경 (URL 기반 인증 토큰 감지 활성화)
  - **`forgot-password/page.tsx` [수정]**: 비밀번호 재설정 redirectTo를 `/auth/callback?next=/update-password`로 변경
- **Build Time**: 2026-03-22 16:08:00

## [Alpha V1.338] - 2026-03-21 02:33:00

### 🐛 Fix: ETF 편입/편출 변경 감지 누락 수정
- **Summary**: 전일 데이터 비교를 `어제 날짜 고정`에서 `가장 최근 이전 스냅샷`으로 변경, KST 날짜 기준 사용
- **Detail**:
  - 전일 데이터: `yesterday` 고정 → `snapshot_date < today ORDER BY desc LIMIT 1` (주말/공휴일 대응)
  - today 날짜: UTC → KST(+9) 기준
  - `detectChanges()`: 외부에서 KST dateStr 파라미터 전달
- **Build Time**: 2026-03-21 02:33:00

## [Alpha V1.337] - 2026-03-21 02:11:00

### ♻️ Refactor: Google Sheets ETF 보유종목 저장 V2
- **Summary**: ETF 보유종목 가로 누적 저장 로직 전면 재설계 — 셀 분리, 편입/편출 자동 표현, 블록 파싱 안정화
- **Detail**:
  - **셀 분리**: 기존 `삼성전자 (005930) 19.77%` → A열: `삼성전자`, B열: `005930`, C열: `19.77`
  - **편입 표현**: 이전 날짜 빈칸 → 오늘 값 출현 = 편입
  - **편출 표현**: 이전 날짜 값 → 오늘 빈칸 = 편출
  - **블록 파싱**: B열 `EF xxxxxx` 패턴으로 ETF 식별 안정화 (기존 A열 정규식 파싱 불안정 해결)
  - **신규 ETF**: 기존 시트의 날짜 열과 동기화하여 열 헤더 자동 생성
- **Build Time**: 2026-03-21 02:11:00

## [Alpha V1.336] - 2026-03-20 20:09:00

### 🔒 Critical Fix: KIS 토큰 24시간 만료 후 자동 갱신 데드락 해결
- **Summary**: 토큰 만료 시 Supabase의 오래된 토큰을 자동 삭제하고 새 토큰을 발급하여, 매일 수동으로 DB를 비워야 하던 문제를 근본적으로 해결
- **Detail**:
  - **client.ts `getAccessToken()` 전면 개선**:
    - 만료 토큰 감지 시 `clearStoredTokens()` → `fetchNewToken()` 자동 진행 (이전: 만료 토큰을 폴백으로 5분간 재사용하며 무한 루프)
    - 쿨다운 중 유효 토큰이 없으면 쿨다운 무시 → 데드락 방지 (`forcing refresh` 로직)
    - EGW00103 시 만료 토큰 폴백 제거 (기존: 만료 토큰 10분 연장 → 무의미한 API 호출 반복)
    - 인메모리 캐시 만료시간을 고정 30분 대신 실제 `expiresAt` 기반으로 설정
  - **tokenManager.ts**: 분산 잠금 쿨다운 5분→2분 단축
- **Build Time**: 2026-03-20 20:09:00

## [Alpha V1.335] - 2026-03-20 19:12:00

### 🔒 Critical Fix: KIS WebSocket 무한 재접속 차단 + ETF Cron 안정화
- **Summary**: KIS 공식 경고(무한 접속 반복 시 IP/AppKey 일시 차단)에 대응하여 WebSocket 접속 패턴 전면 개선 및 ETF Cron 에러 핸들링 강화
- **Detail**:
  - **WebSocketContext.tsx (v3→v4_ANTI_BLOCK)**:
    - `pathname` 의존성 제거 → 페이지 이동 시 WebSocket 끊김/재접속 반복 완전 차단
    - MAX_RETRY 5→3으로 축소, 재시도 간격 1초→5초 최소, 30초→60초 최대 (지수 백오프)
    - Visibility API 핸들러 강화: 탭 비활성 시 WebSocket 종료, 활성화 시에만 재접속
    - Approval Key fetch 1회 제한 (approvalKeyFetched ref)
    - onmessage를 useRef 패턴으로 변경하여 stale closure 방지
  - **client.ts**: `getWebSocketApprovalKey()` 30분 TTL 인메모리 캐시 추가 (KIS Approval API 호출 최소화)
  - **update-etf-holdings/route.ts**: 토큰 발급 실패 시 KIS 차단 여부 감지(`EGW00103`/`유효하지 않은`) + 구체적 진단 메시지 및 복구 가이드 반환
- **Build Time**: 2026-03-20 19:12:00

## [Alpha V1.334] - 2026-03-19 19:48:00

### ✨ Feature: ETF 보유종목 Google Sheets 가로 누적 추적
- **Summary**: ETF별 보유종목을 날짜별 비중으로 비교·검색하기 쉽도록 가로 시트(Horizontal) 누적 형식으로 전면 개편
- **Detail**:
  - 기존 세로형 Row 추가 방식에서 **행:구성종목 / 열:날짜별 비중** 구조로 시트 로직(`appendETFHoldingsHorizontal`) 신규 개발
  - API 처리 시 기존 시트 데이터를 파싱하여 ETF별 블록을 찾고, 매일 신규 날짜 열(Column)을 동적으로 추가
  - 새로운 구성종목 편입 시 기존 ETF 블록 행렬 내 적절한 위치에 새 행을 삽입하고, 신규 추적 ETF는 시트 최하단에 블록 생성
  - `/api/cron/update-etf-holdings`에 `?reset=true` 쿼리 파라미터 지원 (기존 시트 삭제 후 가로 구조로 완전 재구축)
  - 개별 ETF마다 Sheets를 업데이트 하던 방식을 폐기하고, 24개 추적 ETF(약 240개 종목)의 데이터를 단일 시트에 일괄(Batch) 렌더링하도록 성능 최적화
- **Build Time**: 2026-03-19 19:48:00

## [Alpha V1.333] - 2026-03-19 10:51:00

### 🔄 Feature: ETF 분석기 선정 기준 전면 변경 및 데이터 리셋
- **Summary**: ETF 선정 기준을 새 키워드 체계로 변경하고, 기존 데이터를 리셋 후 24개 ETF 보유종목 수집 완료
- **Detail**:
  - **제외 키워드 18개**: 메타버스, ESG, China, 부동산, 채권, TDF, ACE, 회사채, 머니마켓, 바이오, 샤오미, 브로드컴, 팔란티어, 커버드콜, 글로벌, 차이나, 인도, 미국
  - **카테고리 키워드**: AI-테크(AI/자율주행/반도체), 배당(배당), 전략(수출/전략/코스닥/포커스/에너지/밸류업)
  - **선정 결과**: AI-테크 9개, 배당 3개, 전략 12개 = 총 24개
  - **DB 리셋**: etf_tracked_list, etf_holdings, etf_changes 전체 삭제 후 재구축
  - **보유종목 수집**: 24개 ETF × 상위 10개 = 240개 보유종목, 에러 0건 (30초)
  - **코드 변경**: `select-active/route.ts` 필터링 로직 전면 교체, `ETFDashboard.tsx` 카테고리 라벨 업데이트
- **Build Time**: 2026-03-19 10:51:00



### ⚡ Performance: ETF 보유종목 상위 10개 제한 + Sheets 최적화
- **Summary**: ETF당 보유종목을 비중 상위 10개로 제한, Sheets 인증 1회화, 처리 간격 500ms
- **Detail**:
  - **상위 10개 제한**: 기존 전체(최대30) → 비중 상위 10개만 저장 (515→231개로 축소)
  - **Sheets 인증 최적화**: 매 ETF마다 인증 → 1회 인증 + 시트 사전 생성
  - **API 간격 최적화**: 1초 → 500ms (Vercel 60초 timeout 내 34개 처리)
  - **프로덕션 테스트**: 34 ETF 처리, 231 보유종목, Sheets 25건 저장 성공 (57초)
- **Build Time**: 2026-03-18 13:49:00

## [Alpha V1.331] - 2026-03-18 12:56:00

### 🐛 Fix + ✨ Feature: ETF 보유종목 수집 수정 및 Google Sheets 연동
- **Summary**: KIS API 필드명 불일치로 보유종목 0건이던 문제 수정 + Google Sheets 누적 저장 기능 추가
- **Detail**:
  - **API 필드 수정**: `stck_weit`→`etf_cnfg_issu_rlim` (비중%), `stck_hkor_iscd`→`hts_kor_isnm` (종목명)
  - **Google Sheets 연동**: MSCI와 같은 시트에 `ETF보유종목` 탭 자동 생성 → 매일 누적 저장
  - **시트 컬럼**: 날짜 | ETF명 | ETF코드 | 카테고리 | 구성종목코드 | 구성종목명 | 비중(%) | 순위
  - **테스트 결과**: 34개 ETF 중 25개 성공, 515개 보유종목 수집, Sheets 25건 저장 (53초)
- **Build Time**: 2026-03-18 12:56:00

## [Alpha V1.330] - 2026-03-18 12:17:00

### 🆕 Feature: ETF 분석기 대시보드 (보유종목 추적 시스템)
- **Summary**: 주식 스터디에 ETF 분석기 탭 추가. 국내 액티브 ETF 자동 선정 + 보유종목 일일 수집 + 변경 감지
- **Detail**:
  - **ETF 자동 선정** (`/api/etf/select-active`): stock_master에서 "액티브" ETF 필터링 → AI/전략/배당 카테고리 분류 → etf_tracked_list 저장
  - **보유종목 수집 Cron** (`/api/cron/update-etf-holdings`): KIS API `FHKST121600C0` → 구성종목/비중 수집 → 전일 대비 변경 감지 (편입/편출/비중변경±1%)
  - **조회 API** (`/api/etf/holdings`): 보유종목 스냅샷 + 변경 이력 조회
  - **ETF 대시보드** (`ETFDashboard.tsx`): 카테고리 필터, 보유종목 테이블(비중% 바 차트), 변경 이력(🟢편입/🔴편출/🔷비중변경)
  - **Supabase 테이블 3개**: `etf_tracked_list`, `etf_holdings`, `etf_changes`
  - **Vercel Cron**: 평일 16:30 KST (UTC 07:30) 자동 수집
- **Build Time**: 2026-03-18 12:17:00

## [Alpha V1.329] - 2026-03-18 02:10:00

### 🆕 Feature: MSCI → Google Sheets 일일 자동 누적 저장
- **Summary**: MSCI Cron이 매일 KST 07:00에 산출 데이터를 Google Sheets에 자동 누적 저장
- **Detail**:
  - **Google Sheets 헬퍼** (`src/lib/googleSheets.ts`): 서비스 계정 JWT 인증 + append 함수
  - **Cron API 개선** (`/api/cron/update-msci`): generate-msci 동일 정밀 산출 로직 + Sheets 누적
  - **시트 구조**: 날짜 | 종목명 | 종목코드 | MSCI비중 | 시총 | KOSPI보정비율 | 차이 (매일 11행 추가)
  - **의존성**: `googleapis` 추가
  - Google Sheets 쓰기 테스트 성공 확인
- **Build Time**: 2026-03-18 02:10:00

## [Alpha V1.328] - 2026-03-18 01:42:00

### 🆕 Feature: 종목 마스터 자동 갱신 시스템 (신규 ETF 지원)
- **Summary**: KIS 공식 마스터 ZIP에서 KOSPI+KOSDAQ 전 종목을 Supabase DB로 매일 자동 갱신
- **Detail**:
  - **Cron API** (`/api/cron/update-stocks`): KIS 마스터 ZIP 다운로드 → EUC-KR 파싱 → Supabase upsert
  - **검색 API** (`/api/search/stock`): 정적 JSON → Supabase `stock_master` 테이블 조회로 전환
  - **Vercel Cron**: 매일 UTC 21:00 (KST 06:00) 자동 실행
  - **종목 수**: KOSPI 2,493 + KOSDAQ 1,821 = 4,314종목 로딩 완료
  - **신규 ETF**: KoAct 코스닥액티브 등 22개 신규 ETF 포함 확인
  - **의존성**: `jszip` 추가 (ZIP 파싱)
- **Build Time**: 2026-03-18 01:42:00

## [Alpha V1.327] - 2026-03-18 01:10:00

### 🔒 Feature: Vercel 다중 인스턴스 간 분산 토큰 잠금 (EGW00103 근본 해결)
- **Summary**: Vercel serverless의 다중 인스턴스가 동시에 토큰을 발급하여 일일 한도를 소진하는 근본 원인 해결
- **Detail**:
  - **tokenManager.ts 전면 개선**:
    - `getStoredToken()`: 만료 토큰도 `{ token, isExpired }` 형태로 반환 → 만료 토큰이라도 폴백 사용 가능
    - `shouldRefreshToken()`: Supabase `created_at` 기반 5분 쿨다운 → 다른 인스턴스 갱신 중이면 차단
    - `markRefreshAttempt()`: 갱신 시도 시각 기록 → 인스턴스 간 잠금 역할
  - **client.ts getAccessToken 개선**:
    - 만료 토큰도 인메모리 저장 → EGW00103 시 폴백 가능
    - 분산 잠금 체크 → 다른 인스턴스 갱신 중이면 캐시 토큰 사용
    - 발급 실패 시에도 기존 캐시 토큰으로 서비스 지속
- **Build Time**: 2026-03-18 01:10:00

## [Alpha V1.326] - 2026-03-17 00:35:00

### 🚑 Critical Fix: NXT 항상 우선 조회로 변경 — 장외 시간 가격 차이 해결
- **Summary**: NXT가 장외 시간(20:00 이후)에도 마지막 체결가를 반환하는 것을 확인하여, 항상 NXT를 우선 조회하도록 전략 변경
- **Detail**:
  - **실측 데이터 (00:33 KST)**: SK스퀘어 KRX=562,000 vs NXT=569,000 (+1.25%), 삼성전자 KRX=188,700 vs NXT=191,000 (+1.22%)
  - `getOptimalMarketCode()`: 시간대별 분기 로직 제거 → **항상 NXT(NX) 우선 + KRX(J) 폴백**으로 단순화
  - ETF/ETN은 NXT에서 가격 0 반환 시 자동 KRX 폴백 유지
  - 이전 시간대 분기 방식(V1.325)은 20:00 이후 KRX만 조회하여 가격 차이 발생 → 해결
- **Build Time**: 2026-03-17 00:35:00

## [Alpha V1.325] - 2026-03-17 00:27:00

### ✨ Feature: 시간대별 최적 시장 코드 자동 선택
- **Summary**: KRX/NXT 시장 시간에 따라 가장 정확한 현재가를 자동 선택하도록 `getDomesticPrice` 개선
- **Detail**:
  - `getOptimalMarketCode()` 함수 신규: KST 기준 시간대별 최적 시장 코드 결정
  - **08:00~09:00 프리마켓**: NXT 우선 (NXT가 먼저 오픈), ETF는 KRX(J) 폴백
  - **09:00~15:20 정규장**: KRX(J) 단일 (안정적, WebSocket이 실시간 보완)
  - **15:30~20:00 애프터마켓**: NXT 우선 (KRX 장마감 후에도 실시간 가격 반영), ETF는 KRX 폴백
  - **그 외**: KRX(J) 종가
  - 정규장 시간에는 API 호출 1건, NXT 시간대에서 ETF만 2건 호출
- **Build Time**: 2026-03-17 00:27:00

## [Alpha V1.324] - 2026-03-17 00:02:00

### 🚑 Critical Fix: KIS 토큰 발급 한도 초과(EGW00103) + API 안정성 대폭 개선
- **Summary**: 서버 로그에서 발생하던 `EGW00103 - 접근토큰 발급 잔여수가 없습니다` 오류를 근본적으로 해결하고, KIS API 호출 안정성을 전면 개선
- **Detail**:
  - **`getAccessToken()` Mutex 패턴**: 동시 요청 시 토큰 발급이 중복으로 실행되던 문제 해결. `pendingTokenRequest` Promise 공유로 같은 프로세스 내 동시 요청이 1건의 토큰 발급을 공유
  - **EGW00103 에러 복구**: 토큰 발급 한도 초과 시 기존 캐시 토큰을 10분간 연장하여 재사용
  - **Supabase 캐시 실패 복구**: DB 조회 실패 시에도 인메모리 토큰 폴백 사용
  - **인메모리 캐시 연장**: Supabase 토큰 캐시 유효 시간을 5분→30분으로 증가하여 DB 조회 빈도 감소
  - **RateLimiter 동시성 버그 수정**: `isProcessing` 플래그 기반에서 Promise 기반 대기로 변경, 큐 누락 방지
  - **Rate Limit 보수적 조정**: maxConcurrency 10→5, minInterval 50ms→200ms (초당 ~5건)
  - **`getDomesticPrice` 최적화**: NXT→KRX 이중 호출 제거, KRX(J) 단일 호출로 통일 (ETF/ETN 호환 + API 호출 50% 감소)
  - **배치 라우트 안정화**: KR 병렬 3건→2건, 그룹 간 딜레이 500ms→700ms
- **Build Time**: 2026-03-17 00:02:00

## [Alpha V1.323] - 2026-03-13 09:41:00

### 🚑 Critical Fix: KIS 토큰 자동 복구 + WebSocket 안정화
- **Summary**: API 키 교체 후 주식 현재가 조회 전체 실패 문제 해결 및 KIS 공식 공지 대응 WebSocket 무한 재접속 방지
- **Detail**:
  - **원인**: Supabase `kis_tokens` 테이블에 이전 API 키의 토큰 43건 누적 → 새 키와 불일치 → `EGW00123` 에러
  - `tokenManager.ts`: `clearStoredTokens()` 추가, `saveToken` 시 기존 토큰 삭제 (누적 방지)
  - `client.ts`: `invalidateToken()` + `isTokenExpiredError()` 추가, `getDomesticPrice`/`getOverseasPrice`에 EGW00123 감지 → 자동 토큰 재발급 + 1회 재시도
  - `WebSocketContext.tsx`: MAX_RETRY=5 제한, 로그인/랜딩/회원가입 페이지 Approval Key 요청 차단, 정상 종료 시 구독 해제 전송(`gracefulClose`), 비활성 탭 재접속 중지, cleanup 타이머 정리
- **Build Time**: 2026-03-13 09:41:00

## [Alpha V1.322] - 2026-03-13 00:56:00

### 🚑 Critical Fix: Google AI API 키 교체
- **Summary**: 유출 감지로 차단된 Google AI API 키를 새 키로 교체하여 JUBOT 시장 브리핑 500 에러 해결
- **Detail**:
  - 기존 Google AI API 키가 GitHub 노출로 인해 Google에 의해 자동 차단 (`403 Forbidden: API key was reported as leaked`)
  - 새 API 키로 `.env.local` 및 Vercel 환경변수 교체 후 프로덕션 재배포
  - 브리핑 API(`/api/jubot/analyze/daily`) 정상 동작 확인 완료
- **Build Time**: 2026-03-13 00:56:00

## [Alpha V1.321] - 2026-03-13 00:43:00

### 🔄 Build Update
- **Summary**: Vercel 환경변수 전체 업데이트 및 프로덕션 재배포
- **Detail**:
  - `.env.local` 파일 업데이트에 따라 Vercel 환경변수 11개(SUPABASE, KIS, DART, GOOGLE AI, NAVER 등)를 최신 값으로 일괄 갱신
  - 프로덕션 빌드 성공 및 배포 완료 (https://jubot.goraebang.com)
- **Build Time**: 2026-03-13 00:43:00

## [Alpha V1.320] - 2026-03-10 17:25:00

### 🚑 Critical Fix: study/recent API 500 Error in Production
- **Summary**: 배포 환경(Vercel)에서 `/api/study/recent`가 빈번히 500 에러를 반환해 NEW 뱃지가 아예 노출되지 않는 코어 버그 철저 원인 파악 및 해결
- **Detail**:
  - 기존에는 `route.ts` 내에서 Supabase 인스턴스를 `@supabase/supabase-js` 패키지로 직접 생성하면서, 배포 환경의 Service Role Key 변수에 접근하려 했으나 제대로 주입되지 않아 Null 오류로 인해 500 Internal Server error가 지속 발생했음. 그래서 API 응답값이 아예 없으므로 UI에서는 뱃지가 계속 보이지 않는 현상이 있었음.
  - `@/utils/supabase/server`의 규격화된 `createClient()`를 호출(`await createClient()`)하는 방식으로 로직을 전면 교체하여, 권한 및 DB 접근 안정성을 타 API(study-boards 등)와 동일하게 동기화.
- **Build Time**: 2026-03-10 17:25:00

## [Alpha V1.319] - 2026-03-10 17:15:00

### 🔄 NEW Badge Sync & Login Check Fix
- **Summary**: 초기 로그인 시 주식 스터디 NEW 뱃지 누락 현상 및 컴포넌트 간 상태 동기화 문제 해결
- **Detail**:
  - `useStudyNotification` 커스텀 훅 내에서 `usePathname`을 의존성으로 추가하여 사용자가 로그인 후 대시보드 등으로 리다이렉트 시 새로운 글감 확인(`checkNewStudies`)을 무조건 재구동하도록 변경
  - API 캐시 무력화를 위해 Fetch 요청 시점에 타임스탬프 쿼리(`?t=Date.now()`) 강제 할당
  - `window.dispatchEvent`를 활용해 주식 스터디 페이지 내부에서 글을 읽었을 때(markAsRead), 별개로 마운트되어 있는 `Sidebar`의 NEW 뱃지 상태도 즉각적으로 전역 동기화(false 처리) 되도록 이중화 수정
- **Build Time**: 2026-03-10 17:15:00

## [Alpha V1.318] - 2026-03-10 17:05:00

### 🐛 NEW Badge Bug Fix & PnL Message Refinement
- **Summary**: 주식 스터디 NEW 뱃지 조건 오류 수정 및 포트폴리오 요약 일일 평가손익 분석줄 텍스트 개선
- **Detail**:
  - `useStudyNotification`에서 Supabase의 숫자 타입 `id`와 LocalStorage의 문자열을 엄격 비교(`!==`)하여 뱃지가 안 사라지거나 사라지는 버그 발생. `String(latest)` 캐스팅으로 정상 조건식 처리
  - `StudyPage.tsx` 진입 시점에 무조건 `markAsRead` 처리되어 뱃지가 목록 화면에서도 즉시 지워지던 버그를 실제 개별 게시글(`handleSelectFile`)을 클릭했을 때만 지워지도록 로직 이관
  - `PortfolioSummaryBlock.tsx` 내 평가손익 분석 문구를 사용자의 요청에 정확히 일치하도록 ("이익은 대부분 [OOOOO]에서 왔네요.") 심미성 개선
- **Build Time**: 2026-03-10 17:05:00

## [Alpha V1.317] - 2026-03-10 16:50:00

### ✨ Daily PnL Analysis & NEW Badge Fix
- **Summary**: 주식스터디 메뉴 NEW 뱃지 표출 버그 픽스 & 내 주식 종합 당일 분석줄 추가
- **Detail**:
  - `/api/study/recent` fetch 요청에 옵션을 주어 서버 응답이 캐시되지 않도록 브라우저 렌더링 무효화 설정 (`cache: 'no-store'`). 이로 인해 사이드바를 열 시 즉시 NEW 뱃지가 생성되도록 수정
  - `PortfolioSummaryBlock.tsx` 내 평가손익 하단에 "당일 손익의 상승/하락 폭 및 원인이 된 최대 기여 종목 명찰"을 실시간으로 분석해 자연스러운 Text 형태로 렌더링하도록 조건부 UI 신설
- **Build Time**: 2026-03-10 16:50:00

## [Alpha V1.316] - 2026-03-10 16:35:00

### ✨ Update Modal & Study Board Notification
- **Summary**: 사이트 진입 시 최근 업데이트/스터디 모달 표출 및 사이드바 알림 시스템 구축
- **Detail**:
  - `UpdateModal.tsx` 컴포넌트를 레이아웃에 추가 (오늘 하루 보지 않기 지원)
  - `/api/changelog` 엔드포인트: `Changelog.md`를 파싱하여 최근 3건의 빌드 업데이트 렌더링
  - `/api/study/recent` 엔드포인트: 최근 등록된 주식 스터디 문서 존재 여부 확인
  - `useStudyNotification` 커스텀 훅: 사이드바 및 보드 진입/읽음 처리 및 NEW 뱃지 UI 표시 연동
- **Build Time**: 2026-03-10 16:35:00

## [Alpha V1.315] - 2026-03-10 16:06:00

### 🐛 Reanalysis Button & Price Display Fix
- **Summary**: 재분석 버튼 클릭 불가 + 현재가 0원 표시 문제 수정
- **Detail**:
  - `fetchAnalysis` useCallback 의존성에 `priceReady` 추가 → 클로저 갱신으로 버튼 정상 동작
  - 종목별 현재가 표시를 `debugPriceMap` → `getContextData()` 실시간 조회로 변경
  - `selectedStock.currentPrice`를 매수가 대신 Context 실시간 가격 사용
- **Build Time**: 2026-03-10 16:06:00

## [Alpha V1.314] - 2026-03-10 16:00:00

### ⚡ Skip Price Fetching for Sold Stocks
- **Summary**: 거래완료(quantity=0) 종목을 시세 조회에서 제외하여 API 호출 최적화
- **Detail**:
  - `PortfolioContext.tsx`: 심볼 추출 시 `quantity <= 0` 종목 `return`으로 스킵
  - 보유 중인 종목만 KIS 배치 가격 API 호출 → 불필요한 API 호출 제거
- **Build Time**: 2026-03-10 16:00:00

## [Alpha V1.313] - 2026-03-10 15:50:00

### 🐛 Reactive Price Data Readiness (Critical Fix)
- **Summary**: 인사이트 분석 시 현재가 0원 문제 근본 수정 — "내 주식일지" 패턴 적용
- **Detail**:
  - `JubotPortfolioInsight.tsx`: 15초 고정 대기 타이머 ❌ 제거 → `useEffect`로 `krLoading/usLoading` 리액티브 감지
  - `priceReady` 상태 도입: KR/US 배치 가격 로딩 완료 시에만 `true`
  - 분석 버튼에 실시간 로딩 진행률 표시: "시세 로딩 중... (KR: 5/10, US: 0/3)"
  - `priceReady === false`이면 버튼 비활성화 + 분석 차단
  - PortfolioContext의 `krLoadedCount/krTotalCount/usLoadedCount/usTotalCount` 활용
- **Build Time**: 2026-03-10 15:50:00

## [Alpha V1.312] - 2026-03-10 14:48:00

### 🐛 Price Data Readiness Fix
- **Summary**: 인사이트 분석 시 현재가 0원 문제 수정 — 가격 로딩 완료 대기 로직 추가
- **Detail**:
  - `JubotPortfolioInsight.tsx`: 가격 데이터 로딩 중(`krLoading || usLoading`)이면 최대 15초 대기 후 분석 진행
  - 근본 원인: 배치 가격 조회 API(14:43:16~37)보다 AI 분석(14:43:12)이 먼저 실행되어 모든 currentPrice가 0으로 전달됨
- **Build Time**: 2026-03-10 14:48:00

## [Alpha V1.311] - 2026-03-10 14:31:00

### ✨ Naver Search API Integration
- **Summary**: 차단되던 네이버 RSS를 공식 네이버 검색 API로 교체
- **Detail**:
  - `.env.local`에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 추가
  - `collect/news/route.ts`: 네이버 RSS 소스 제거 → 네이버 검색 API 2개 쿼리('주식 증권 시장', '주식 투자 전망') 통합
  - `analyze/portfolio/route.ts`: 직접 뉴스 수집에도 네이버 검색 API 추가
  - HTML 태그 제거, 중복 기사 필터링, 전문가 기사 판별 포함
  - 기존 RSS 3소스(매일경제, 연합뉴스, 인베스팅닷컴) + 네이버 API = 총 4소스 체제
- **Build Time**: 2026-03-10 14:31:00

## [Alpha V1.310] - 2026-03-10 14:22:00

### 🔧 Insights Process Optimization
- **Summary**: 인사이트 페이지 내부 프로세스 전면 최적화 — API 호출 ~50% 감소, 공시 범위 확대
- **Detail**:
  - `JubotPortfolioInsight.tsx`: 클라이언트 뉴스 API 2중 호출 제거 (서버에서만 수집), changeRate(전일대비 등락률) 실제 데이터 전달
  - `analyze/portfolio/route.ts`: (1) DART 재무/공시 2건씩 병렬 처리, (2) 배당 API 2중 호출 제거 (fetchCompanySummary 내 dps 활용), (3) 뉴스 수집 자기 API 재호출→직접 import로 변경, (4) 재무+공시+뉴스 3대 수집을 Promise.all로 동시 실행
  - `opendart.ts`: 공시 조회 기간 6개월→12개월, 공시 타입 D(기타)/F(공정) 추가, 키워드 11종 추가, 최대 건수 10→15건
- **Build Time**: 2026-03-10 14:22:00

## [Alpha V1.309] - 2026-03-10 13:27:00

### 🔧 Error Handling Improvement
- **Summary**: Jubot 뉴스 수집 및 DART 재무데이터 에러 핸들링 개선
- **Detail**:
  - `collect/news/route.ts`: 네이버 RSS 차단 시 간결한 로그만 출력 (TypeError 대신 "네트워크 오류 (정상 스킵)"), User-Agent 개선, 수집 건수 로깅 추가
  - `opendart.ts`: DART 데이터 없음(status=013) 로그를 warn→log로 변경 (정상 동작)
- **Build Time**: 2026-03-10 13:27:00

## [Alpha V1.308] - 2026-03-10 13:15:00

### 🔧 Data Reliability Improvement
- **Summary**: 내 주식 인사이트 페이지 데이터 로딩 안정성 대폭 개선
- **Detail**:
  - `batch/route.ts`: KR 시장 가격 조회를 1건씩 순차 → **3건씩 병렬(Promise.all)** 처리로 속도 3배 향상
  - `useBatchStockPrice.tsx`: 실패 종목 **5초 후 자동 재시도 로직** 추가, `isRetrying` 상태 노출
  - `PortfolioContext.tsx`: `krRetrying`, `usRetrying` 상태를 전역 Context로 전파
  - `insights/page.tsx`: **DataStatusBanner** 컴포넌트 추가 — KR/US/Gold 로딩 진행률, 자동 재시도 상태, 수동 재시도 버튼 표시
  - `TargetProximityBlock.tsx`: 시세 미조회로 차트에서 제외된 종목명 목록을 경고 메시지로 표시
  - `PortfolioCompositionBlock.tsx`: 시세 미조회 종목 수를 경고 메시지로 표시
- **Build Time**: 2026-03-10 13:15:00

## [Alpha V1.307] - 2026-03-10 12:35:00

### 🚑 Hotfix
- **Summary**: 배당ETF 분석 API 504 Timeout 초강력 최적화 (응답시간 극대화)
- **Detail**:
  - Vercel 60초 타임아웃 발생 문제 재차 해결을 위한 API Limit 한계까지의 속도 개선 단행
  - `getEtfPrice` (ETF현재가 조회) 병렬 처리: 청크 사이즈 10 -> 15로 상향, 딜레이 500ms -> 200ms로 단축
  - `getKsdinfoDividend` (배당이력 조회) 병렬 처리: 청크 사이즈 5 -> 15로 대폭 상향, 딜레이 600ms -> 200ms로 단축
  - 총 병렬 처리 파이프라인의 속도를 기존 방식 대비 80% 이상 추가 단축하여, 240여 개의 ETF 데이터 수집과 문서 생성이 20초 이내에 모두 완료되도록 안전망 구축
- **Build Time**: 2026-03-10 12:35:00

## [Alpha V1.306] - 2026-03-10 12:05:00

### 🚀 Performance Optimization & Bug Fix
- **Summary**: 배당ETF 분석 API 속도 개선 및 504 Gateway Timeout 에러 해결
- **Detail**:
  - 동적 추출로 인해 ETF 후보군이 37개에서 240개 이상으로 대폭 증가함에 따라 발생하던 Vercel 60초 타임아웃(504 Error) 문제 해결
  - KIS API 호출 방식을 순차적(Sequential) 처리에서 **청크 단위 병렬(Chunked Parallel) 처리** 로 전면 개편
  - 단계 1 (현재가 조회): 240개 종목을 10개씩 묶어 `Promise.all` 로 동시 조회 (청크 간 0.5초 대기)
  - 단계 2 (배당이력 조회): 유효한 ETF 종목들에 대해 5개씩 묶어 동시 배당금 내역 조회 (청크 간 0.6초 대기)
  - 전체 API 응답 시간을 기존 대비 300% 이상 단축하여 안정적인 마크다운 리포트 생성 보장
- **Build Time**: 2026-03-10 12:05:00

## [Alpha V1.305] - 2026-03-10 11:42:00

### 🔄 Build Update
- **Summary**: 배당 ETF 후보군 추출 방식 동적(Dynamic) 전환 기능 개편
- **Detail**:
  - 기존 37개의 하드코딩된 ETF 후보군 제거 및 100% 동적 추출 방식 도입
  - 사용자 맞춤형 키워드 필터 추가: `배당`, `액티브`, `보험`, `은행` 등의 단어가 포함된 ETF를 자동으로 파싱하여 후보군 구성
  - ETF 검증 정밀도 향상: `KoAct`, `TIMEFOLIO(TIME)`, `PLUS`, `KODEX` 등 20개 이상의 공식 ETF 브랜드 식별 기능 도입을 통해 일반 주식의 오인출 필터링 적용
  - `all_stocks_master.json` 마스터 데이터를 로컬 캐시로 활용하여 불필요한 KIS 상품 정보 호출(`getStockInfo`) 딜레이 제거 및 조회 속도 최적화 (API Rate Limit 에러 방지)
  - Vercel Timeout 방지를 위해 해당 라우트에 `maxDuration = 60` 속성 추가
- **Build Time**: 2026-03-10 11:42:00

## [Alpha V1.304] - 2026-03-10 11:21:07

### 🔄 Build Update
- **Summary**: 배당 ETF 수익률 분석 데이터 정확도 버그 수정
- **Detail**:
  - `generate-dividend-etf` API의 데이터 수집 로직 전면 개편
  - 주식 종목이 ETF로 오인되어 업종명(예: 보험, 화학)이 출력되는 치명적 버그 수정
  - 국내 주요 고배당 ETF 리스트(37개) 하드코딩 및 ETF 전용 데이터 필터링 적용
  - ETF 실제 지급 분배금(배당금)을 KSD(한국예탁결제원) API 기반으로 역산하여 순위 배정
- **Build Time**: 2026-03-10 11:21:07

## [Alpha V1.303] - 2026-03-10 02:45:00

### 🔄 Build Update
- **Summary**: 배당ETF 분석 기능 추가 및 모바일/UI/Report 업데이트
- **Detail**:
  - `generate-dividend-etf` API 신설: `getEtfPrice` 활용 1차 ETF 판별 및 커버드콜 제외
  - 주식 스터디 `page.tsx`: 모바일 Drawer 메뉴 동기화(주식 스터디 탭 추가, 휴면 탭 제거)
  - 배당주 & 배당 ETF 조사 버튼 개별 독립
  - `doc/DailyReport.md`: 2026-03-10 일보 업데이트
- **Build Time**: 2026-03-10 02:45:00



### ✨ Feature
- **Summary**: 배당주 분석 기능 KIS API 100% 기반으로 전면 재구축
- **Detail**:
  - KIS client.ts: 배당률 상위(dividend-rate), 예탁원배당일정(ksdinfo/dividend), ETF현재가(inquire-price) API 3개 추가
  - generate-dividend/route.ts: Gemini AI 프롬프트 → KIS API 100% 데이터 기반으로 전면 재작성
  - 주식 TOP10 (코스피, 현금배당), ETF TOP10 (커버드콜 제외, KOSDAQ 포함)
  - 고정 테이블 포맷: 종목|종가|주당배당금|수익률|횟수|최근배당일|가상배당금
  - 버튼 원클릭 자동 생성 + Supabase 자동 저장
  - study/page.tsx: 프롬프트 입력 → 원클릭 자동 생성으로 변경
- **Build Time**: 2026-03-10 01:31:14

## [Alpha V1.299] - 2026-03-10 00:37:31

### 🐛 Critical Fix
- **Summary**: KIS API Rate Limit 근본 원인 3가지 해결
- **Detail**:
  - AiGuruBlock: 독자적 KR+US 동시 배치 API 호출 제거 → Context 데이터 재사용
  - useStockPrice: REST 폴백 완전 제거 (종목별 개별 batch API 호출 원천 차단)
  - batch/route.ts: 서버 딜레이 1초→300ms (Vercel 10초 timeout 내 완료)
  - useBatchStockPrice: 클라이언트 timeout 10초→60초, 청크 20→10
  - PortfolioContext: US 초기 딜레이 25초→8초 (서버 최적화에 맞춤)
  - API 호출 수: 기존 40건+ → 3~4건으로 대폭 감소
- **Build Time**: 2026-03-10 00:37:31

## [Alpha V1.298] - 2026-03-10 00:17:30

### 🐛 Bug Fix
- **Summary**: KIS API 초당 1건 제한 적용 - 완전 순차 처리로 변경
- **Detail**:
  - 서버: 모든 종목 1건씩 순차 처리 + 1초 딜레이 (병렬 처리 완전 제거)
  - 서버: 실패 종목 2초 대기 후 1건씩 1.5초 간격 재시도
  - 클라이언트: US 배치 초기 딜레이 8초 → 25초 (KR 20종목 × 1초 + 여유시간)
  - 예상 로딩: KR ~20초 + US ~14초 = 약 40초 (프로그레스 바로 진행률 표시)
- **Build Time**: 2026-03-10 00:17:30

## [Alpha V1.297] - 2026-03-10 00:09:06

### 🐛 Bug Fix + 🎨 UI Improvement
- **Summary**: 배치 API rate limit 근본 해결 + 로딩 프로그레스 바 UI
- **Detail**:
  - 서버: 국내주식 3개씩 병렬/500ms 딜레이, 해외주식 1개씩 순차/350ms 딜레이
  - 서버: 실패 종목 1.5초 대기 후 자동 재시도
  - 클라이언트: KR 배치 완료 후 US 배치 실행 (8초 딜레이로 공유 rate limit 회피)
  - 클라이언트: 배치 청크 크기 6→20, 청크 간 딜레이 300ms→1000ms
  - UI: 3단계 프로그레스 바(국내주식/금/해외주식) + 퍼센트 스피너 + 단계별 상태 표시
- **Build Time**: 2026-03-10 00:09:06

## [Alpha V1.296] - 2026-03-09 23:46:31

### 🚀 Performance Optimization
- **Summary**: 전체 앱에서 개별 종목 API 호출 근절 → 배치 엔드포인트 통합
- **Detail**:
  - `PortfolioCompositionBlock`: 전 종목 순차 개별 API 호출(~20건) 제거, `PortfolioContext` 배치 데이터 사용
  - `TargetProximityBlock`: 전 종목 순차 개별 API 호출(~20건) 제거, `PortfolioContext` 배치 데이터 사용
  - `JubotPortfolioInsight`: 전 종목 순차 개별 API 호출(~20건) + 재시도 로직 제거, `PortfolioContext` 배치 데이터 사용
  - `useStockPrice` 훅: REST fallback을 `/api/kis/price/domestic/`, `/api/kis/price/overseas/` 개별 호출에서 `/api/kis/price/batch` 배치 호출로 변경
  - `StockDetailChartModal`: market name 조회를 개별 호출에서 배치 API로 변경
  - API 호출 수: **~62건 → 3건** (KR배치 + US배치 + Gold)
  - KIS API "초당 기간건수 초과" rate limit 에러 근본 해결
- **Build Time**: 2026-03-09 23:46:31

## [Alpha V1.295] - 2026-03-09 23:02:15

### 🚀 Performance & Bug Fix
- **Summary**: 포트폴리오 화면 실시간 가격 데이터 연동 통합 및 속도 제한(Rate Limit) 오류 해소
- **Detail**: 
  - `PortfolioSummaryBlock`과 `PortfolioTable`에서 각각 개별적으로 발송하던 실시간 데이터 연동 API 요청(useBatchStockPrice)을 하나의 전역 상태 관리 영역(`PortfolioContext`)으로 격상하여 단일화 처리.
  - 이로 인해 KIS API 및 백엔드 서버로 향하는 트래픽이 절반으로 줄어들어 "Too Many Requests" 에러가 원천적으로 차단됨.
  - '새로고침' 클릭 시 자식 컴포넌트 간 로딩 상태 동기화 누락 이슈도 함께 해결되어 더 빠르고 일관된 뷰 제공.
- **Build Time**: 2026-03-09 23:02:15

## [Alpha V1.294] - 2026-03-09 22:31:23

### 🐛 Bug Fix
- **Summary**: 내 주식 종합 화면 데이터 로딩 상태 처리 개선
- **Detail**:
  - 실시간 주식 가격을 불러오기 전이나 실패했을 때 수익이 0으로 잘못 표기되어 오해를 유발하는 문제 해결
  - 주식 현재가를 모두 불러오기 전에는 종합 자산 정보를 노출하지 않도록 변경
  - 가격 정보 연동 중에는 로딩 스피너 UI 표시, 연동 실패 시 '새로고침 시도' 버튼 제공
- **Build Time**: 2026-03-09 22:31:23

## [Alpha V1.293] - 2026-03-09 14:40:00
- **Summary**: MSCI 스터디 분석 시 동일 종목 명칭 불일치 버그 수정
- **Detail**:
  - 이전 데이터에 기록된 "현대자동차"와 신규 하드코딩 데이터의 "현대차"가 다른 종목으로 인식되어 분석 요약에서 신규 편입/탈락으로 잘못 표기되는 현상 개선
  - 동일 회사명칭 텍스트(`현대자동차` -> `현대차`)를 비교 단계에서 강제 정규화(Normalization)하여 비교 정확도 100% 보장
- **Build Time**: 2026-03-09 14:40:00

## [Alpha V1.292] - 2026-03-09 14:35:00### 🔄 Build Update
- **Summary**: MSCI 스터디 정보생성 로직 정적 체계로 롤백 및 안정화
- **Detail**:
  - MSCI 스터디 정보 생성 시 부정확한 데이터를 가져오는 AI 외부 검색 로직 제거
  - 2026년 3월 공식 발표 기준 MSCI KOREA INDEX 편입 비중(Top 10) 및 종목 하드코딩 적용
- **Build Time**: 2026-03-09 14:35:00

## [Alpha V1.291] - 2026-03-09 11:00:00

### 🔄 Build Update
- **Summary**: MSCI 스터디 데이터 추출 방식 AI 크롤링 연동 개편
- **Detail**:
  - 기존 하드코딩된 과거 데이터(`MSCI_TOP10`)를 폐기하고, 공식 페이지 방어 매커니즘 우회를 위해 `GoogleGenerativeAI(Gemini-2.5-pro)` 기반의 구글 실시간 검색 툴 연동
  - 매 호출 시점마다 2026년 최신 MSCI Korea Index 편입 기준(Top 10 종목 및 비율)을 검색/파싱하여(JSON 변환) KIS 시총 API와 100% 동적 매핑되도록 로직 재구성
  - AI 생성 응답 시간 대기를 위해 `maxDuration = 60` 설정 추가
- **Build Time**: 2026-03-09 11:00:00

## [Alpha V1.290] - 2026-03-09 10:35:00

### 🔄 Build Update
- **Summary**: MSCI 스터디 정보생성 오류 수정 (Supabase 권한)
- **Detail**:
  - MSCI 문서 자동 생성 시 환경변수(`SUPABASE_SERVICE_ROLE_KEY`) 누락으로 인한 서버 500 에러 해결
  - 관리자 인증이 완료된 클라이언트(`supabaseAuth`) 객체를 직접 활용하여 RLS 정책 하에 정상적으로 문서를 저장하도록 로직 수정
  - 사용되지 않는 `supabase-js` 임포트 제거
- **Build Time**: 2026-03-09 10:35:00

## [Alpha V1.289] - 2026-03-08 22:52:00

### 🔄 Build Update
- **Summary**: 주식 스터디 마크다운 표 UI 디자인 전면 개선
- **Detail**:
  - 가로로 길게 늘어지던 표의 CSS 구조를 파기하고 화면 최대 너비(`max-w-5xl`)에 맞게 자연스럽게 안착하도록 복원
  - 테이블 가로 폭을 제한하고, 내용이 길어질 경우 자동 줄바꿈(`break-words`)이 이루어지게 처리하여 가독성을 높임
  - 행 크기에 여백(`leading-relaxed`) 지정, hover 이펙트 및 모던한 배경 색상(`#1A1A1A`) 컨테이너를 입혀 디자인적 감각을 살림
- **Build Time**: 2026-03-08 22:52:00

## [Alpha V1.288] - 2026-03-08 22:45:00

### 🔄 Build Update
- **Summary**: 배당주 AI 분석기 신뢰도 향상 및 문서 관리 UI 고도화
- **Detail**:
  - AI 배당주 분석기 응답에 Google Search API 환경 변수(`googleSearch`) 연동, 프롬프트 실시간 기준일 주입으로 환각(Hallucination) 억제 개선
  - 주식 스터디 마크다운 문서 뷰어 컴포넌트(`StudyPage`) CSS 레이아웃 구조 전면 개선 (테이블 짤림 방지 및 가로 스크롤 적용)
  - 서버 DB(`study_boards`) 권한 연동 및 관리자 전용 '서버 문서 삭제' API(`DELETE /api/study-boards`)와 휴지통(Trash) 아이콘 버튼 컴포넌트 추가
- **Build Time**: 2026-03-08 22:45:00

## [Alpha V1.287] - 2026-03-08 20:53:00

### 🔄 Build Update
- **Summary**: 주식 스터디(Study Board) 서버 통합 기능 개편 및 배당 시뮬레이션 문서 생성
- **Detail**:
  - `study_boards` Supabase 테이블 신설 및 RLS 방화벽 설계
  - 3가지 관리/조회 탭(MSCI 분석, 배당주 분석, ETF 분석기) 분할 적용
  - 통합 스터디 페이지(`StudyPage`) UI 내 관리자 권한 확인 로직 연동
  - MSCI 데이터 산출 문서화 및 백그라운드 크론 자동 생성 스크립트를 서버 DB 저장 방식으로 전환
  - TIMEFOLIO 등 최신 ETF 배당 시뮬레이션 문서 생성 완료
- **Build Time**: 2026-03-08 20:53:00

## [Alpha V1.286] - 2026-03-08 15:25:00

### ✨ Feature: 배당금 추적 기능 추가
- **Summary**: 사용자가 주식별 배당금을 모달에서 별도로 입력하고, 전체 누적 배당금 합계를 확인할 수 있는 기능 추가
- **Detail**:
  - `PortfolioContext`: 거래 기록 유형에 '배당금(DIVIDEND)' 옵션을 명시하고 자산 매입가 산출에서 제외 처리
  - `StockDetailChartModal`: 추가 폼의 구분 값 추가, 기록 목록에 배당금 별도 표시, 개별 모달 평가총액 하단에 배당금 합산 박스 추가
  - `PortfolioCard`: 카드 썸네일 전면에서 해당 종목 배당의 총합 노출 (평가액 아래 추가 정렬)
  - `PortfolioSummaryBlock`: 포트폴리오 대시보드 메인 화면 및 각 분류별 리포트에 총 배당금 요약 및 환전 합산 기능(원화 표기) 추가
- **Build Time**: 2026-03-08 15:25:00

## [Alpha V1.285] - 2026-03-08 14:41:00

### 🐛 Bug Fix: 금현물 누락 및 카테고리 미분류 저장 오류 수정
- **Summary**: 포트폴리오 데이터에서 미분류를 선택하거나 금현물을 조회/정렬/종합 산출할 때 발생하던 값 누락 문제를 해결
- **Detail**:
  - `PortfolioCard`, `StockDetailChartModal`: 카테고리를 '미분류'(`""`)로 설정 후 저장 시 `undefined` 필터로 인해 DB 업데이트가 누락되는 문제 해결 (명시적으로 `null` 전송)
  - `PortfolioSummaryBlock`: 금현물(`GOLD`) 전용 시세 API를 실시간 호출하여 종합 포트폴리오 내 수익률과 총 평가금액에 반영되도록 개선
  - `PortfolioTable`: 표 리스트 평가금액순 정렬 시 금현물도 최신 가격을 비교 대상으로 삼도록 로직 편입
- **Build Time**: 2026-03-08 14:41:00

## [Alpha V1.284] - 2026-03-08 04:41:00

### 🐛 Bug Fix: MSCI 스터디 정보생성 데이터 추출 오류 수정
- **Summary**: "정보 만들기" 실행 시 과거의 "기존 통합 산출 테이블" 데이터 대신 "신규 통합 산출 테이블"(방금 전 데이터)을 불러오도록 로직 보완
- **Detail**:
  - `generate-msci` API의 `getPreviousData` 함수에서 테이블 파싱 로직 변경
  - 파일 내 다수의 테이블이 있을 때 가장 최신 섹션인 "## 📊 신규 통합 산출 테이블" 내부의 표와 날짜를 우선적으로 파싱하여 비교 대상으로 지정
- **Build Time**: 2026-03-08 04:41:00

## [Alpha V1.283] - 2026-03-08 04:38:00

### 🎨 Design: 포트폴리오 헤더 영역 디자인 개선
- **Summary**: "내 주식에 메모하기" 타이틀 영역 및 우측 버튼 디자인 고도화
- **Detail**:
  - 타이틀: 좌측에 `Edit3` 아이콘을 포함한 둥근 사각형 배경 추가로 시각적 포인트(indigo 테마) 부여
  - 버튼(하한목표 자동설정, 전체 재계산): Pill 형태(`rounded-full`)로 변경, padding 증가(`px-3 py-2`), 폰트 굵기 강화(`font-bold`)
  - 버튼 색상: 기능에 맞춰 각각 amber, dark gray 기반의 일관성 있는 디자인 적용
  - 전체적으로 UI 요소 간격을 조정하고 정렬을 깔끔하게(`items-center gap-4 mb-2`) 구성
- **Build Time**: 2026-03-08 04:38:00

## [Alpha V1.282] - 2026-03-08 04:32:00

### 🎨 Design: 포트폴리오 컨트롤 바 디자인 개선
- **Summary**: 컨트롤 바 레이아웃을 2단 구조로 재구성하여 줄바꿈 방지 및 가독성 향상
- **Detail**:
  - Row 1: 필터 칩(국내/해외/거래완료) + 새로고침 아이콘 버튼
  - Row 2: 분류 드롭다운 + 구분선 + 정렬 드롭다운
  - 필터 칩 크기 축소 (px-4→px-3, text-sm→text-xs)
  - 새로고침 버튼 아이콘만 표시 ("전체 재계산" 텍스트 줄바꿈 이슈 해결)
  - 분류 기본 옵션: "최상위 단계 (전체해제)" → "전체" 간소화
- **Build Time**: 2026-03-08 04:32:00

## [Alpha V1.281] - 2026-03-08 04:25:00

### 🔄 Improve: 모달 목표 표시 PortfolioCard와 동일하게 통일
- **Summary**: 모달 내 메모→목표 변경, 하한/상한 표시를 카드와 동일 스타일로 통일
- **Detail**:
  - "메모" → "목표" 레이블 변경 (placeholder도 동일)
  - 하한 목표: 현재가 대비 하락률(%) + 경고 색상(⚠️danger/⚡warning) + ?(최고가 대비 비율)
  - 상한 목표: AVG 대비 비율 유지 + ?(AVG대비 비율) + (RESIST) 라벨
  - 두 영역 모두 bold 폰트 + PortfolioCard와 동일한 색상 체계 적용
- **Build Time**: 2026-03-08 04:25:00

## [Alpha V1.280] - 2026-03-08 04:20:00

### ✨ Feature: 차트 모달에 하한목표 기준선 추가
- **Summary**: 포트폴리오 모달 차트에 하한목표 가격 기준선(파란 점선) 추가
- **Detail**:
  - `StockDetailChartModal.tsx`: Recharts `ReferenceLine`으로 하한목표 기준선 표시
  - 파란색(#60a5fa) 점선으로 매입 기준선(빨간)과 구분
  - 하한목표 가격 표시 라벨 포함 (예: "하한 196,200")
  - out-of-bounds 처리 (차트 범위 초과 시 ▲/▼ 표시)
- **Build Time**: 2026-03-08 04:20:00

## [Alpha V1.279] - 2026-03-08 04:10:00

### 🔄 Improve: 하한목표 비율 표시 방식 변경 및 경고 시스템
- **Summary**: 하한목표 비율을 현재가 대비 하락률로 변경, 3% 이내 접근 시 경고 표시
- **Detail**:
  - `PortfolioCard.tsx`: 하한목표 % → 현재가 대비 하한목표 하락률로 변경
  - 3% 이내 접근 시 ⚡ amber 경고 표시 (배경색 + 텍스트)
  - 하한목표 이하 돌파 시 ⚠️ red 경고 + 펄스 애니메이션
  - 상한목표: AVG 대비 비율 유지 (변경 없음)
  - 하한목표 옆 ? 클릭: "최고가 대비 비율" 툴팁
  - 상한목표 옆 ? 클릭: "AVG대비 비율" 툴팁
- **Build Time**: 2026-03-08 04:10:00

## [Alpha V1.278] - 2026-03-08 04:05:00

### 🔄 Improve: 하한목표 자동설정 UX 개선
- **Summary**: 종가 기준 변경, 카테고리별 비율 설정 모달, 버튼 위치 이동
- **Detail**:
  - 계산 기준: 고가(stck_hgpr) → **종가(stck_clpr)** 변경
  - `AutoTargetModal.tsx` 신규: 카테고리별 비율 슬라이더 (대형주 80%, ETF 85%, 배당주 80%, 기대주 90%)
  - 비율 설정값 localStorage 자동 저장/복원
  - 버튼 위치: PortfolioTable → **PortfolioClientPage** 메모하기 제목 옆으로 이동
  - `PortfolioTable.tsx`에서 이전 자동설정 코드 전체 제거
- **Build Time**: 2026-03-08 04:05:00

## [Alpha V1.277] - 2026-03-08 03:30:00

### ✨ Feature: 하한목표 자동설정 기능
- **Summary**: 모든 종목의 하한목표를 최근 45일 최고가의 -10%로 자동 계산 및 설정
- **Detail**:
  - `PortfolioTable.tsx`: "하한목표 자동설정" 버튼 추가 (Target 아이콘)
  - 순차 처리 (1초 간격, rate limit 방지) + progress bar 실시간 표시
  - 실패 종목 개별 "새로고침" 버튼으로 재시도 가능
  - GOLD/거래완료 종목은 자동 스킵
- **Build Time**: 2026-03-08 03:30:00

## [Alpha V1.276] - 2026-03-08 03:20:00

### ✨ Feature: 데이터 백업/복원 시스템
- **Summary**: 포트폴리오 데이터를 PC에 백업(JSON 다운로드)하고 복원(JSON 업로드)할 수 있는 기능 추가
- **Detail**:
  - `AccountModal.tsx` 신규: 계정정보 + 백업/복원 UI
  - `/api/portfolio/backup` GET: Supabase에서 전체 포트폴리오&거래내역 JSON 반환
  - `/api/portfolio/restore` POST: 기존 데이터 삭제 후 백업 JSON으로 전체 교체
  - `Sidebar.tsx`: '설정' 메뉴 삭제, 계정정보 클릭 시 AccountModal 열기
- **Build Time**: 2026-03-08 03:20:00

## [Alpha V1.275] - 2026-03-08 03:10:00

### 🔧 Fix: 금현물 가격 조회 - 네이버 금시세 스크래핑 적용
- **Summary**: 금현물 현재가가 표시되지 않던 문제 수정
- **Detail**:
  - KIS API에 금현물 전용 엔드포인트 없음 확인 (J, NX, UN만 유효)
  - 네이버 금시세(goldDetail.naver) HTML 구조 분석 → span 개별 숫자 추출 방식 적용
  - 모달 헤더에서 "US" → "KRX 금현물"로 올바르게 표시되도록 수정
  - extractNumberFromSpans 헬퍼 함수 추가
- **Build Time**: 2026-03-08 03:10:00

## [Alpha V1.274] - 2026-03-08 02:55:00

### 🔧 Fix: 금현물 저장 실패 및 가격 정확도 수정
- **Summary**: 금현물 저장이 안 되던 문제와 가격이 ETF 가격(33,830원)으로 표시되던 문제를 수정
- **Detail**:
  - `market.ts`: `getMarketType()`에 `GOLD_` 접두사 인식 추가
  - `client.ts`: KRX data.krx.co.kr에서 금 99.99 1g 종가 직접 스크래핑
  - 빌드 에러 수정: `PortfolioCompositionBlock.tsx`, `TargetProximityBlock.tsx`
- **Build Time**: 2026-03-08 02:55:00

## [Alpha V1.273] - 2026-03-08 02:40:00

### ✨ Feature: KRX 금현물 시장 직접 연동
- **Summary**: KIS API를 통해 KRX 금현물(종목코드 4020000, 금 1g) 시세를 직접 조회하여 포트폴리오에 등록/관리할 수 있게 되었습니다.
- **Detail**:
  - `client.ts`: `getGoldSpotPrice()` 함수 추가 (마켓코드 G, 종목 4020000)
    - 3단계 fallback: 실시간 → 일별 종가(`inquire-daily-itemchartprice`) → 서버 캐시
    - 금현물 시장 휴장 시에도 전일 종가 표시
  - `/api/kis/price/gold/route.ts`: 금현물 전용 API 라우트 신규 생성
  - `/api/search/stock/route.ts`: '금현물', '금', 'gold' 검색 시 🪙 KRX 금현물 최상단 노출
  - `PortfolioContext.tsx`: Asset 타입에 GOLD 카테고리 추가
  - `AddAssetForm.tsx`: 금현물 종목 등록 지원
  - `PortfolioTable.tsx`: GOLD 종목 별도 가격 API 호출 지원
  - `PortfolioCard.tsx`: 금현물 🪙 아이콘 및 'KRX 금현물' 라벨 표시
  - `PortfolioSummaryBlock.tsx`: GOLD를 KR(국내) 자산으로 합산 처리
- **Build Time**: 2026-03-08 02:40:00

## [Alpha V1.272] - 2026-03-08 02:10:00

### 🔧 Fix: 포트폴리오 종목 시장명(KOSPI/KOSDAQ) 정확 표기 및 형식 통일
- **Summary**: WONIK IPS(240810) 등 KOSDAQ 종목이 KOSPI로 잘못 표시되던 오류를 수정하고, 카드/모달의 종목 요약 표기를 `240810 · KOSPI · 기계장비` 형식으로 통일했습니다.
- **Detail**:
  - `useBatchStockPrice.tsx`: KIS API 응답의 `rprs_mrkt_kor_name` 필드를 `StockData.marketName`으로 추출
  - `PortfolioCard.tsx`: `marketLabel`을 `stockData?.marketName` 기반으로 변경 (KR 하드코딩 제거)
  - `StockDetailChartModal.tsx`: 모달 오픈 시 국내 가격 API에서 시장명을 조회하여 KOSPI/KOSDAQ 정확 표시
- **Build Time**: 2026-03-08 02:10:00

## [Alpha V1.271] - 2026-03-08 01:40:00

### 🔧 Fix: 포트폴리오 검색 하이브리드 방식 전환
- **Summary**: 종목 검색이 작동하지 않는 이슈를 해결했습니다. 로컬 마스터(KOSPI) + Yahoo Finance 서버사이드 실시간 검색을 병합하는 하이브리드 방식으로 API를 재구현했습니다.
- **Detail**:
  - `api/search/stock/route.ts`: 기존 파일(kospi_master.json)으로 국내 주식 검색 + Yahoo Finance API(서버사이드 호출)로 해외 주식/ETF 실시간 검색 → 결과 병합 후 반환.
  - `AddAssetForm.tsx`: 검색 결과에 시장 플래그(🇰🇷/🇺🇸), 마켓 태그(KR/US), 로딩 인디케이터 추가.
  - `all_stocks_master.json` 미생성 환경에서도 해외 검색이 정상 작동.
- **Build Time**: 2026-03-08 01:40:00

## [Alpha V1.270] - 2026-03-08 01:35:00

### ✨ Feature: 포트폴리오 KOSDAQ 및 해외 주식 통합 검색 지원
- **Summary**: `내 주식 기록하기` 및 `관심목록 조회` 시 KOSDAQ 종목과 미국/해외주식(NASDAQ, NYSE, AMEX)에 대한 통합 종목 검색이 지원됩니다.
- **Detail**:
  - `백엔드 (API)`: 기존 KOSPI 마스터뿐만 아니라 KIS에서 KOSDAQ 및 미주 마스터 파일 압축본까지 일괄 수집하여 통합 JSON(`all_stocks_master.json`)을 구축하는 파이썬 스크립트(`scripts/generate_master_json.py`)를 개발 및 확장했습니다.
  - `자체 검색 API 신설`: 브라우저가 직접 무거운 원시 마스터 데이터를 관리하지 않도록, 빠르고 가벼운 자체 서버사이드 검색 API(`api/search/stock`)를 구축했습니다.
  - `프론트 모달 연동`: `AddAssetForm` 및 `StockSearchModal`에서 사용자가 텍스트를 입력할 때마다 신규 API로 실시간(Debounced) 검색 요청을 쏘도록 개선했습니다.
  - `마켓 타입 식별 로직 보완`: 사용자가 모달에서 검색한 종목이 KOSPI/KOSDAQ인지 미주(US)인지 판별하여 자산 및 관심목록 DB에 정확한 `market` (KR, US) 값으로 저장되도록 개편했습니다. 
- **Build Time**: 2026-03-08 01:35:00

## [Alpha V1.269] - 2026-03-07 23:25:00

### 🚀 Feature: 대시보드 지수 종합 3분할 전면 개편
- **Summary**: 대시보드 지수 종합 섹션을 해외 지수 종합, 국내 지수 종합, KOSPI 업종별 3파트로 나누고 UI 시인성 및 신규 지표(선물, 국채 1주 그래프)를 추가했습니다.
- **Detail**:
  - `해외 지수 종합`: 나스닥, S&P 500 차트 및 환율, 나스닥/S&P선물, 10년물 국채 금리 데이터(4.1% 기준 상향/하향 바 그래프) 추가.
  - `국내 지수 종합`: KOSPI 측정 시간 및 코스닥(KOSDAQ) 지수 병기, 상승/하락장에 따라 배경색(붉은색/푸른색) 그라데이션이 변하는 멋진 Area 주식 차트 스타일 반영.
  - API 백엔드 확장 (`market-extra`): 미국채 1주일 차트 데이터 및 주요 선물 지수 크롤링 추가.
- **Build Time**: 2026-03-07 23:25:00

## [Alpha V1.268] - 2026-03-07 22:30:00

### 💄 UI Update: JUBOT 오늘 시장 브리핑 폰트 사이즈 및 마크다운 적용
- **Summary**: 대시보드의 JUBOT 시장 브리핑 컴포넌트(`JubotBriefing.tsx`)의 가독성을 높였습니다.
- **Detail**:
  - `**종합 의견 텍스트**` 와 같이 들어오는 백엔드의 마크다운 형태 볼드체 지시를 프론트엔드에서 실제 볼드 텍스트(`font-black` 및 노란 텍스트)로 렌더링하도록 커스텀 처리 로직 추가.
  - 헤더, 종합 의견 본문, 3단 핵심 뉴스 제목 및 요약, 주목 포인트 등 전반적인 텍스트 사이즈를 1단계씩 상향 조정.
- **Build Time**: 2026-03-07 22:30:00

## [Alpha V1.267] - 2026-03-07 22:20:00

### 🚀 Feature: JUBOT 오늘 시장 브리핑 화면 개편
- **Summary**: 대시보드의 JUBOT 시장 브리핑 UI 레이아웃과 데이터 포맷을 전면 개편했습니다.
- **Detail**:
  - `JubotBriefing.tsx`: 새로고침 버튼을 상단 우측 소형 아이콘으로 변경, 불필요한 주요 지수 및 개별 전문가 의견 섹션 삭제.
  - 종합 요약인 🤖 '주봇 종합 의견'을 최상단 배치.
  - 📰 '핵심 뉴스 요약' 영역을 불안 뉴스(좌), 일반 뉴스(중), 좋은 소식(우)의 3단으로 분리 구성.
  - `/api/jubot/analyze/daily`: 백엔드 AI 분석 프롬프트를 뉴스 및 전문가 의견 종합형으로 간소화 및 3가지 성격에 따른 뉴스 구분을 지시.
- **Build Time**: 2026-03-07 22:20:00

## [Alpha V1.266] - 2026-03-06 17:40:00

### 🎨 UI Update: 내 주식 인사이트 페이지 가독성 개선
- **Summary**: `JubotPortfolioInsight.tsx` 컴포넌트의 종목별 주요 이슈 표시 영역 디자인을 개편했습니다.
- **Detail**:
  - 알록달록한 원색 텍스트를 제거하고 차분한 모노톤(gray 계열)으로 통일.
  - 단순 나열되던 정보를 박스(Box) 형태와 그리드(Grid) 레이아웃으로 모듈화.
  - 주요 요약, 상세 수치, 뉴스 정보, 액션 플랜 등 정보의 시각적 계층화 및 가독성 최적화.
- **Build Time**: 2026-03-06 17:40:00

## [Alpha V1.265] - 2026-03-06 16:45:00

### ✨ Feature: US 10-Year Treasury Yield 지표 추가
- **Summary**: 일일체크 화면의 금·금리 섹션에 US 10-Year Treasury Yield 실시간 정보를 추가했습니다.
- **Detail**:
  - `src/app/api/market-extra/route.ts`: Yahoo Finance `^TNX` 심볼로 미국 10년 국채 수익률 데이터를 병렬 페칭 추가
  - `src/components/MarketFlowChart.tsx`: 미국 기준금리 하단에 US 10Y Treasury 행을 추가하여 현재 수익률, 전일 대비 변동폭/변동률 표시
- **Build Time**: 2026-03-06 16:45:00

## [Alpha V1.264] - 2026-03-06 16:38:00

### 🐛 Fix: ETF 종목 현재가 로딩 실패 해결 및 새로고침 버튼 복구
- **Summary**: ETF 종목이 NXT 시장에서 가격 조회 불가한 문제를 KRX 자동 폴백으로 해결하고, 새로고침 버튼 가시성 및 기능을 전면 개선했습니다.
- **Detail**:
  - `src/lib/kis/client.ts` (`getDomesticPrice`): NXT 시장 코드 조회 후 price=0 또는 에러 시 자동으로 KRX(`J`) 시장 코드로 폴백 재시도하는 2단계 조회 로직 구현
  - `src/components/portfolio/PortfolioCard.tsx`: 새로고침 버튼 크기 개선(10px→14px), amber 색상 스타일, "새로고침" 텍스트 라벨 추가
  - `src/components/portfolio/PortfolioTable.tsx`: 필터바에 항상 노출되는 "전체 재계산" 버튼 추가, 에러 시 amber 하이라이트 스타일 적용
- **Build Time**: 2026-03-06 16:38:00

## [Alpha V1.263] - 2026-03-06 01:24:21

### 🔄 Build Update
- **Summary**: 주식 스터디 문서 저장(API) 오류 해결 핫픽스
- **Detail** : 
  - 윈도우 환경 파일 경로 대소문자 미일치로 인한 403 보안 오류 패치 (`path.normalize` 및 `toLowerCase` 적용)
  - 웹 UI 상에서 수정한 내용이 `.md` 파일에 성공적으로 저장되도록 검증 로직 완화
- **Build Time**: 2026-03-06 01:24:21

## [Alpha V1.262] - 2026-03-06 01:15:25

### 🔄 Build Update
- **Summary**: 주식 스터디 마크다운 표 렌더링 및 코스피 비중 계산식 개선
- **Detail** : 
  - 주식 스터디 화면에서 마크다운 테이블 문법(`|표|`)을 감지하여 고품질의 HTML `<table>` UI로 렌더링되도록 커스텀 파서 구현
  - 장외시간대 API 응답 누락 방어를 위한 KOSPI 시총 순위 폴백(Fallback) 개별 종목 조회 로직 이식
  - 코스피 10종목 시가총액 비교 비율을 전체 추정치(약 2,200조원) 기준으로 재계산 및 테이블에 시총(조원), 업종 정보 추가
- **Build Time**: 2026-03-06 01:15:25

## [Alpha V1.261] - 2026-03-05 23:32:14

### 🔄 Build Update
- **Summary**: 주식 스터디 화면 UI 개선 및 MSCI 디렉토리 연동
- **Detail** : 
  - 주식 스터디 목록을 `doc/MSCI` 폴더 내부로 한정하여 연동
  - `SidebarLayout` 컴포넌트를 적용하여 기존 대시보드와 동일한 사이드바 레이아웃 체계로 UI 통일 및 최적화
- **Build Time**: 2026-03-05 23:32:14

## [Alpha V1.260] - 2026-03-05 23:00:00
### 🚀 Feature: 주식 스터디 게시판 추가 및 조건검색 제거
- **Summary**: 사이드바의 "조건검색" 메뉴를 제거하고, 로컬 마크다운 문서(options: `\doc`)를 연동하는 "주식 스터디" 게시판 기능을 신규 추가했습니다.
- **Detail**:
  - `src/components/Sidebar.tsx`: "조건검색" 항목을 제거하고 "주식 스터디"(`/study`) 메뉴를 추가. 아이콘 변경(GraduationCap 적용).
  - `src/app/api/study/route.ts`: `/doc` 폴더 마크다운(`.md`) 파일들을 스캔하고, 문서 내용 조회 및 수정한 텍스트를 파일 시스템에 직접 저장(PUT)하는 API 구축.
  - `src/app/study/page.tsx`: 왼쪽 파일 목록형 사이드바와 오른쪽 원본 글 렌더링/편집 전환 뷰를 포함한 클라이언트 UI 구현.
- **Build Time**: 2026-03-05 23:00:00

## [Alpha V1.259] - 2026-03-05 22:54:00
### ✨ Feature: Unified Portfolio Currency Display (KRW)
- **Summary**: 포트폴리오 '해외' 뷰 및 카테고리별 요약, 거래 완료 수익 등 모든 금액 합산을 일관되게 원화(KRW)로 표시하도록 단일화하고 적용 환율 정보를 추가헀습니다.
- **Detail**:
  - `src/components/portfolio/PortfolioSummaryBlock.tsx`: 여러 통화 혼재를 방지하기 위해 `view` 상태에 상관없이 표시 단위 렌더링을 항상 `formatCurrency(..., 'KRW')`로 강제 적용했습니다.
  - 적용 환율 안내 UI 추가: 전체/국내/해외 토글 메뉴 좌측에 `적용 환율: $1,350원`과 같이 현재 환자된 기준 환율(`exchangeRate`) 정보 블럭 노출 기능을 붙였습니다. 
  - 실현 수익 부분에도 해외 종목의 매수, 매도, 수익 환산값이 모두 동일하게 원화 처리되도록 적용 및 검증 완료.
- **Build Time**: 2026-03-05 22:54:00

## [Alpha V1.258] - 2026-03-05 22:27:00

### ✨ Feature: Portfolio Real-time USD to KRW Currency Exchange Application
- **Summary**: '내 주식일지' 대시보드 내 통합 합계 및 분류별 리포트에서 기준가격을 단순 합산 하던 오류($와 원화가 섞임)를 수정하고 달러 자산에 대해 실시간 환율을 반영하여 총 원화 금액으로 올바르게 제공되도록 개선했습니다.
- **Detail**:
  - `src/context/PortfolioContext.tsx`: `fetch('/api/market-extra')`를 통해 실시간 원/달러 환율(`exchangeRate`)을 전역 컨텍스트 상태로 초기화 시 가져오도록 병렬 데이터 페칭 구현.
  - `src/components/portfolio/PortfolioSummaryBlock.tsx`: 
    - 달러(US) 자산과 원화(KR) 자산을 조회 시 환율 적용 여부를 구별.
    - '전체' 뷰 시점 달러 단위 자산은 가져온 실시간 환율을 적용 및 치환하여 `result.all` (총 매수/평가 합계) 및 카테고리별 통계 등에 정확한 원화 수익 금액으로 누적 연산하도록 변환 추가. 
    - 실현 손익 영역(`realizedGains`)의 합계(totalBuy, totalSell) 계산 시에도 달러 종목의 경우 원화로 체계적으로 변환하여 총합 산출 처리.
- **Build Time**: 2026-03-05 22:27:00

## [Alpha V1.257] - 2026-03-05 22:11:00

### ✨ Feature: Real-time Price Accuracy Upgrade (NXT)
- **Summary**: 국내 주식 현재가 조회 시세를 KRX(한국거래소)에서 NXT(넥스트 트레이드) 기준 시세로 변경하여 실시간 정확도 향상.
- **Detail**:
  - `src/lib/kis/client.ts` 내의 `getDomesticPrice()` 함수에서 KIS API 호출 시 시장 분류 코드를 `J`(KRX)에서 `NX`(NXT)로 변경 (`FID_COND_MRKT_DIV_CODE=NX`).
  - 현재가 조회 조회 이외의 차트, 투자자 동향, 시가총액 순위, 기업 재무 분석 등은 데이터 호환성을 고려하여 기존 KRX(`J`) 코드를 유지.
- **Build Time**: 2026-03-05 22:11:00

## [Alpha V1.256] - 2026-03-05 20:40:00

### 🐛 Bug Fix: Financial Data Stability - Zero-Value Detection & Quality Retry
- **Summary**: 기업재무분석 데이터의 안정성 대폭 강화. 핵심 지표(시가총액, PER, PBR 등)가 0으로 잘못 반환되면 누락으로 자동 판별, 자동 재시도 후에도 일부만 불러왔을 경우 "다시 불러오기" 리프레시 버튼 노출.
- **Detail**:
  - `src/lib/kis/client.ts`: `getFinancialStats()` 에 `nonZero()` 헬퍼 추가. KIS API 응답 중 PER, PBR, 시가총액 등이 `'0'` 또는 `'0.00'`이면 데이터 없음으로 처리.
  - `src/components/FinancialGrid.tsx`: `formatValue()` 내부에서도 0 값을 `-`로 변환하도록 강화. 핵심 6개 지표(시가총액, PER, PBR, ROE, 영업이익률, 부채비율) 중 최소 3개 이상 유효해야 '성공'으로 판정하는 품질 검사(Quality Gate) 도입. 미달 시 최대 4번 자동 재시도. 최종 시도 후 일부만 유효할 경우 데이터를 보여주되 상단에 "일부 누락 · 다시 불러오기" 리프레시 버튼을 노출.
  - OpenDART API 호출에도 `AbortController` 타임아웃(8초)을 적용하여 전체 로딩 시간 단축.
- **Build Time**: 2026-03-05 20:40:00


### 🐛 Bug Fix: OpenDART Fallback Data Polish
- **Summary**: OpenDART 보조 API 호출 시 누락된 데이터 매핑 추가 및 비정상 응답 시 에러 처리(리프레시 유도) 강제.
- **Detail**:
  - `src/lib/opendart.ts` 내부에서 OpenDART 부채총계(`liability`) 계정과목 파싱 로직 추가.
  - `src/app/api/opendart/company/[symbol]/route.ts` API에서 영업이익률(`operating_margin`) 및 추가된 부채총계를 바탕으로 부채비율(`debt_ratio`)을 계산해서 프론트엔드로 반환.
  - KIS API 통신 횟수 초과 혹은 기타 사유로 인해 OpenDART API 보조 호출이 발생했을 때, 핵심 지표(매출, 영업이익)가 `0`으로 조회되어 비정상 렌더링을 막고자 해당 경우 서버 사이드에서 `404` 에러 코드로 강제 반환하여 리프레시 버튼을 유도하도록 정책 변경.
  - `FinancialGrid.tsx` 내에서 새로 반환되는 `operating_margin`, `debt_ratio` 변수 렌더링 연결 (Fallback).
- **Build Time**: 2026-03-05 20:30:11


### ✨ Feature & UI: Portfolio and Modal Polish
- **Summary**: Portfolio 카드 수익금액 노출 영역 확대 및 모달 상단 카테고리 뱃지 고정 표시 추가
- **Detail**:
  - `PortfolioCard.tsx` 내부의 Current Value 와 Total Profit 컴포넌트 간 차지하는 공간 비율을 55:45 에서 40:60 으로 조정하여 천만 단위 이상의 수익 금액이 들어가도 말줄임 처리되지 않도록 레이아웃 개선. 글씨 크기도 약간 축소 반영(`text-3xl` -> `text-2xl`).
  - `StockDetailChartModal.tsx` 내의 모달 헤더(저장 버튼 좌측) 고정 영역에 현재 뱃지의 상태(Level. I ~ IV) 정보 라벨 삽입. 스크롤을 내려도 항상 노출됨.
- **Build Time**: 2026-03-05 20:25:01


### 🐛 Bug Fix: Financial Analysis Data Source Mapping
- **Summary**: 기업재무분석(Financial Grid) 데이터 노출 불규칙 및 누락 버그 해결
- **Detail**:
  - `api/kis/company/[symbol]/route.ts` 에서 매출총이익률(`gross_margin`)과 영업이익률(`operating_margin`)의 매핑이 누락되어 프론트엔드에서 표시되지 않던 오류 수정 (KIS 원천 데이터에서 계산 식 추가).
  - KIS 데이터가 없을 경우 보조로 사용되는 OpenDART API(`api/opendart/company/[symbol]/route.ts`) 내부 연산식 버그 수정.
    - 기존 '영업이익 성장률'의 보조 데이터로 '순이익 성장률'이 잘못 사용되던 점을 '영업이익 성장률(CAGR)' 수식으로 교체 적용.
  - 관련 컴포넌트(`FinancialGrid.tsx`) 내부 보조 데이터 참조 키네임 매칭 수정.
  - 외부 데이터 호출 중 정보가 없거나 실패 시 리프레시 버튼을 노출하고, 데이터를 다 불러올 때까지 로딩 표시가 명확히 나오도록 디자인 원칙 고수.
- **Build Time**: 2026-03-05 20:17:55


### ✨ Feature & UI: Touch-friendly Trade Log & Category Label
- **Summary**: `StockDetailChartModal.tsx` 내 거래 내역 표기의 터치 사용성 개선 및 현재 카테고리 표시 라벨 추가
- **Detail**:
  - 아이패드/태블릿 등 터치 환경을 고려해 거래 내역(Trade Log) 항목 간의 상하 간격(Padding)을 넓히고 행간 구분선을 명확히 개선.
  - 내역 우측의 관리(수정) 버튼이 기존에는 데스크탑 마우스 호버 시에만 나타나던 불편을 해소하기 위해 항시 노출되도록 변경.
  - 기록 추가/수정 폼의 날짜, 구분, 가격 등 각종 입력 필드 높이를 강제로 `h-9` 로 통일하여, iOS 기기 등에서 발생하는 높이 불일치 현상 수정.
  - 모달 상단 우측(저장 버튼 옆)에 현재 설정된 2차 카테고리를 직관적으로 인지할 수 있도록, 등급 색상이 반영된 카테고리 라벨(Badge) 추가.
- **Build Time**: 2026-03-05 20:07:05


### ✨ Feature: Sync Secondary Category Input UI
- **Summary**: `내 주식 기록하기` 모달(`AddAssetForm.tsx`)의 2차 카테고리 입력 방식을 단순 텍스트 입력창에서 선택형(Select) 드롭다운으로 변경
- **Detail**:
  - `StockDetailChartModal.tsx`에 적용되어 있던 카테고리 옵션(Lv.0 미분류 ~ Lv.4 기대주)과 동일한 로직의 Select UI를 신규 자산 등록 폼에도 추가
  - 사용자가 사전에 정의된 등급(레벨)만 선택하도록 제한하여 오타나 형식 불일치로 인한 UI 테마(카드 색상 등) 미적용 버그를 미연에 방지
- **Build Time**: 2026-03-05 20:06:00


### 🐛 UI: Fix text wrapping in uncategorized listing
- **Summary**: `PortfolioSummaryBlock.tsx` 내 '미분류' 행의 텍스트가 줄바꿈(Wrapping) 되어 레이아웃이 깨지는 현상 수정
- **Detail**:
  - 금액 단위가 커질 경우 텍스트 엘리먼트가 찌그러지며 줄바꿈 처리되던 부분을 방지하기 위해 `whitespace-nowrap`, `shrink-0`, `min-w-max` 등의 CSS 클래스 속성을 컨테이너 및 텍스트 블록에 적용
  - 화면이 극단적으로 좁아질 경우 레이아웃이 깨지지 않도록 가로 스크롤(`overflow-x-auto`)을 임시 지원하여 가독성 보장
- **Build Time**: 2026-03-05 20:01:00


### 🎨 UI: Portfolio Card Design Refinements
- **Summary**: 포트폴리오 카드(`PortfolioCard.tsx`) 내부의 텍스트 크기 및 정보 배치 개선
- **Detail**:
  - `Card Effect / Target` 라벨을 `목표`로 변경하고, 시인성을 위해 폰트 크기 확대 (`text-[10px]` -> `text-sm`)
  - 목표 내용(메모 텍스트)의 폰트 크기를 키워 가독성 확보 (`text-xs` -> `text-sm`)
  - `Total Profit` 영역에서 **평가수익금액**이 가장 돋보이도록 수익률과 위치를 변경하고, 금액 크기를 점진적 가변(`text-lg`~`text-3xl`)으로 확대 적용 (금액이 커져도 잘리지 않도록 `truncate` 적용 유지)
  - `Total Profit` 하단의 **평가액** 텍스트를 `Invested`(투자금액) 수준 이상으로 확대하여 사용자 인지성 강화 (`text-[9px]` -> `text-[10px] sm:text-[11px]`)
- **Build Time**: 2026-03-05 19:53:00


### 🎨 UI: Typography and Label Adjustments
- **Summary**: 포트폴리오 요약 대시보드의 핵심 지표 텍스트 크기 조정 및 명칭 변경
- **Detail**:
  - `PortfolioSummaryBlock` 상단 '총 매입금액' 라벨을 '총 투자 금액'으로 변경
  - 상단 핵심 지표인 '총 투자 금액'과 '총 평가금액'의 숫자 폰트 크기를 확대 (`text-sm` -> `text-2xl`)
  - '분류별 리포트' 내 평가금액이 큰 숫자(예: 99,999,999원)일 경우 줄바꿈이 일어나지 않도록 폰트 크기 축소 (`text-3xl` -> `text-2xl`)
  - '미분류 기타자산' 라벨을 '미분류'로 간략하게 표시하도록 수정
- **Build Time**: 2026-03-05 19:42:00


### 🔎 UI: Secondary Category Dropdown Filter Added
- **Summary**: "내 주식에 메모하기" 최상단 목록 컨트롤 바 영역에 2차 카테고리를 기준으로 카드를 필터링 할 수 있는 기능 추가.
- **Detail**:
  - `PortfolioTable` 컴포넌트 우측 정렬박스 옆에 '전체/카테고리' Select UI를 구현.
  - 현재 입력된 2차 카테고리(Secondary Category) 항목을 중복 제거하여 옵션으로 자동 구성 (예: 대형주, 배당주, 기대주 등).
  - 전체 카테고리 보기 혹은 특정 카테고리를 선택 가능하도록 분류.
- **Build Time**: 2026-03-05 19:28:00


### 🔄 UI: View Mode Filtering Applied to Dashboard Main Blocks
- **Summary**: 포트폴리오 요약 대시보드의 전체/국내/해외 선택 버튼 클릭 시 모든 정보가 해당 뷰 모드에 맞춰 필터링 되어 노출되도록 기능 구현
- **Detail**:
  - `PortfolioSummaryBlock` 의 상단 전체 계좌 요약 카드, 좌측 도넛 차트 정보, 우측 카테고리별 테마 카드, 하단 완료 수익(실현손익) 블록 전체에 대해 `view===all` 제한을 해제하고 `useMemo` 계산 단계에서 자산을 `view` 값에 맞게 동적 필터링 하도록 리팩토링 구현.
  - 국내 선택 시 국내 자산만으로 분석 및 차트 구성, 해외 선택 시 해외 자산만 분류되어 표출.
- **Build Time**: 2026-03-05 19:07:00


## [Alpha V1.245] - 2026-03-05 18:59:00

### 🛡️ UX: Background Scroll Lock for Modals
- **Summary**: 종목 상세창(Modal)이 열려있을 때 브라우저 배경화면이 스크롤되는 현상 방지.
- **Detail**:
  - `StockDetailChartModal` 컴포넌트가 활성화(`isOpen={true}`)될 때 `document.body.style.overflow = 'hidden'` 을 적용하여 외부 스크롤 차단 기능 추가.
- **Build Time**: 2026-03-05 18:59:00

## [Alpha V1.244] - 2026-03-05 18:52:00

### 🔎 UI: Category Valuation Font Size Adjustment
- **Summary**: 내 주식 분류별 리포트 카드 내 '평가금액'의 폰트 사이즈를 축소.
- **Detail**:
  - 천만 원 단위 이상의 큰 숫자가 입력될 경우 화면 크기에 따라 텍스트가 말줄임(truncate) 처리되는 문제를 완화하기 위해 기준 폰트 크기를 `text-3xl` -> `text-2xl` 로 조정.
- **Build Time**: 2026-03-05 18:52:00

## [Alpha V1.243] - 2026-03-05 18:44:00

### 🎯 UI: Target Price Percentage Display Restored
- **Summary**: 포트폴리오 카드의 상/하한 목표가 표기 부분에 구매가 대비 등락 비율(%)을 다시 표시하도록 복원.
- **Detail**:
  - 카드 UI의 하단 Effect/Target 섹션에서 목표가(Support/Resist) 우측에 괄호로 비율(+/- %) 표기.
  - 공간 부족 시 텍스트 말줄임표(truncate)가 적용되도록 스타일링 보완.
- **Build Time**: 2026-03-05 18:44:00

## [Alpha V1.242] - 2026-03-05 18:24:00

### 🎨 UI: Portfolio Pie Chart Refinement
- **Summary**: 자산 비중을 보여주는 도넛 차트를 기본 원형(Pie) 차트로 변경하고, 내부에 라벨(이름 및 비율)을 노출하도록 수정.
- **Detail**:
  - Recharts `Pie` innerRadius를 0으로 설정하여 꽉 찬 원형으로 변경.
  - 커스텀 라벨 렌더러를 적용하여 그래프 조각 내부에 흰색 텍스트로 카테고리명과 비중(%) 출력.
- **Build Time**: 2026-03-05 18:24:00

## [Alpha V1.241] - 2026-03-05 18:25:00

### 🎨 UI: Uncategorized Items Display Refinement
- **Summary**: '미분류' 자산을 일반 테마 카드에서 분리하여 콤팩트한 한 줄 행렬로 별도 표기.
- **Detail**:
  - 기존 4종 메인 카드(배당주, 대형주 등)와 함께 표시되던 '미분류' 항목을 그리드에서 제외.
  - 리포트 카드 하단에 단일 Row 형태의 띠 배너 UI로 추가 구성하여 공간 활용도 및 정보 위계 개선.
- **Build Time**: 2026-03-05 18:25:00

## [Alpha V1.240] - 2026-03-05 17:35:00

### 🎨 UI: Portfolio Summary Structure Upgrade
- **Summary**: 포트폴리오 요약 화면의 최상위 그리드 통합 및 2단 분리 레이아웃 적용.
- **Detail**:
  - **Top Grid**: 기존 중앙 텍스트였던 총 매입금액/평가금액/손익을 최상위 가로 100% 영역으로 분리 이동, 텍스트 크기에 맞게 그리드 비율 조정(평가손익 칸 와이드 적용).
  - **Bottom Split**: 상위 그리드 하단 좌측은 도넛 차트 전용, 우측은 카테고리별 테마 카드 전용으로 명확한 2분할(flex 레이아웃) 구조로 전환.
  - **Typography Fix**: 카드 내 평가금액의 '원' 단위가 줄바꿈되지 않도록 truncate 및 반응형 텍스트 사이징 미세조정.
- **Build Time**: 2026-03-05 17:35:00

## [Alpha V1.239] - 2026-03-05 16:20:00

### 🎨 UI: Portfolio Summary Refinement
- **Summary**: 포트폴리오 요약 화면의 도넛 차트 크기 확대 및 카테고리별 단위/문구 조정.
- **Detail**:
  - **Donut Chart**: 폭을 확대하여 자산 비중 그래프가 한눈에 더 잘 들어오도록 개선 (최소 1/2 영역 차지).
  - **Summary Panel**: 국내/해외 요약 그리드를 삭제하고, 총 평가금액을 그래프 최상단에 배치하여 정보의 위계를 간소화.
  - **Category Cards**: 각 게임형 테마 카드(기대주 등)에서 '평가금액'을 가장 눈에 띄게 큰 폰트로 강조. 하단에 평가손익, 투자금액, 수익률을 재배치하여 가장 중요한 정보가 먼저 보이도록 수정.
- **Build Time**: 2026-03-05 16:20:00

## [Alpha V1.238] - 2026-03-05 16:11:00

### 🎨 UI: Portfolio Summary Redesign (Trading Card Game & Donut Chart)
- **Summary**: 포트폴리오 요약 화면의 도넛 차트 도입 및 게임형 테마 분류별 리포트 카드 적용.
- **Detail**:
  - **Layout**: 기존 상하 나열형에서 좌우 2단 하이브리드 대시보드 구조(CSS Grid)로 전면 개편.
  - **Donut Chart**: `recharts` 라이브러리를 활용하여 포트폴리오 내 2차 카테고리 자산 비중을 시각화.
  - **Category Cards**: 배당주, ETF, 대형주, 기대주 등 2차 카테고리별 리포트를 Trading Card Game(TCG) 게임 랭크(Lv.I ~ Lv.IV) 테마가 들어간 프리미엄 카드 UI로 디자인.
  - **Naming**: 기존 "도전주" 카테고리를 사용자 요구에 맞춰 "기대주"로 일괄 명칭 수정.
- **Build Time**: 2026-03-05 16:11:00

## [Alpha V1.237] - 2026-02-18 14:15:00

### 🐛 Fix: Daily Check Data Accuracy
- **Summary**: 일일체크 데이터(환율, 금값, 금리) 표기 오류 수정 및 단위 보정.
- **Detail**:
  - **환율**: 전일 대비 변동폭(Change/%)이 0으로 표시되던 문제 해결 (Yahoo Finance `chartPreviousClose` 적용).
  - **금**: 달러/온스(USD/oz) → **원/그램(KRW/g)** 단위로 자동 환산하여 표기 직관성 개선.
  - **금리**: 미국 기준금리 데이터 현행화 (3.50% ~ 3.75% 범위 표기).
  - **기준일**: 모든 시장 데이터에 기준 날짜(Reference Date) 표기 추가.
- **Build Time**: 2026-02-18 14:15:00

## [Alpha V1.236] - 2026-02-15 17:45:00

### 🔮 UI: Sophisticated Tech Design (Aurora & Glassmorphism)
- **Summary**: 생동감 넘치는 오로라 그라데이션, 노이즈 텍스처, 인터랙티브 UI로 'Digital Luxury' 감성 구현.
- **Detail**:
  - **Global**: 전체 화면에 **Noise Texture(Film Grain)**를 적용하여 밀도감 있는 질감 표현.
  - **Hero**: **Aurora Gradient** 배경과 스크롤에 반응하는 **Sticky Glassmorphic Header** 추가.
  - **Feature**: 정적인 차트 이미지를 **실시간 데이터 처리 애니메이션**으로 교체하여 생동감 부여.
- **Build Time**: 2026-02-15 17:45:00

## [Alpha V1.235] - 2026-02-15 17:35:00

### 🎨 UI: Premium Design Upgrade (Footer & Depth Effects)
- **Summary**: 랜딩 페이지의 프리미엄 감성을 위한 푸터 전면 개편 및 입체감 강화.
- **Detail**:
  - **Footer**: 별도 컴포넌트(`Footer.tsx`)로 분리 및 **System Status**, **대형 타이포그래피**가 포함된 테크 디자인 적용.
  - **Interaction**: Problem/Solution 섹션 카드에 마우스 호버 시 은은한 **Spotlight & Border Glow** 효과 추가.
- **Build Time**: 2026-02-15 17:35:00

## [Alpha V1.234] - 2026-02-15 17:25:00

### 🎨 UI: Landing Page Design Harmonization
- **Summary**: 랜딩 페이지 전체 섹션의 톤앤매너 통일 및 시인성 개선.
- **Detail**:
  - **Hero**: 메인 문구("투자는 운이 아니라...") 가독성 강화를 위한 글래스모피즘 백그라운드 및 텍스트 스타일 개선.
  - **Problem/Solution**: 기존 화이트 테마를 다크 테마(`bg-[#111]`, `bg-black`)로 변경하여 전체 페이지의 일관성 확보.
- **Build Time**: 2026-02-15 17:25:00

## [Alpha V1.233] - 2026-02-15 17:20:00

### 🎨 UI: Landing Page Polish (Dark Mode & Details)
- **Summary**: 랜딩 페이지의 전반적인 디자인 품질 향상을 위한 디테일 작업.
- **Detail**:
  - **SocialProof**: 화이트 테마를 Dark Mode(`bg-black`)로 변경하여 전체 톤앤매너 통일.
  - **Feature**: 텍스트 플레이스홀더를 CSS 기반의 추상적 차트 UI(`Abstract UI`)로 교체하여 시각적 완성도 향상.
  - **CTA**: 배경에 미세한 그리드 패턴(`Grid Pattern`) 및 그라데이션 추가로 깊이감 부여.
- **Build Time**: 2026-02-15 17:20:00

## [Alpha V1.232] - 2026-02-15 17:15:00

### 🎨 UI: Loading Screen Redesign (Dark Mode)
- **Summary**: 로딩 화면을 주봇 테마에 맞춘 Dark Mode 디자인으로 전면 교체.
- **Detail**:
  - **Visual**: 배경(`bg-black/80`) 및 카드 디자인을 어둡게 변경하여 눈의 피로도 감소.
  - **Brand**: 번개 아이콘을 **주봇 로고(Bot Icon)**로 교체하고 시그니처 컬러(#F7D047) 적용.
- **Build Time**: 2026-02-15 17:15:00

## [Alpha V1.231] - 2026-02-15 17:05:00

### 🐛 Fix: Sidebar Help Button Visibility
- **Summary**: 사이드바 하단 버튼(도움말, 로그아웃)이 보이지 않는 문제 해결.
- **Detail**:
  - **Layout**: `nav` 내부 스크롤 영역에서 하단 프로필/버튼 영역을 분리하여 `fixed footer` 형태로 변경.
  - **UI**: 스크롤 여부와 관계없이 항상 하단에 고정되도록 개선.
- **Build Time**: 2026-02-15 17:05:00

## [Alpha V1.230] - 2026-02-15 16:50:00

### 📚 Feature: Help Page
- **Summary**: 사용법 안내를 위한 도움말 페이지 추가.
- **Detail**:
  - **Sidebar**: 좌측 메뉴 하단에 '도움말' 버튼 추가 (로그아웃 버튼 상단).
  - **Page**: Supademo 가이드 영상을 포함한 `/help` 페이지 구현.
- **Build Time**: 2026-02-15 16:50:00

## [Alpha V1.229] - 2026-02-15 13:30:00

### 🎨 UI: Unicorn Studio Badge Removal (Advanced)
- **Summary**: Unicorn Studio "Made with" 배지를 완벽하게 제거하기 위한 이중 조치 적용.
- **Detail**:
  - **JS**: `MutationObserver`를 사용하여 동적으로 생성되는 배지 요소를 즉시 감지하고 제거 (`HeroSection.tsx`).
  - **CSS**: `globals.css`에 강력한 CSS 선택자(`!important`)를 추가하여 시각적 숨김 처리 강화.
- **Build Time**: 2026-02-15 13:25:00

## [Alpha V1.228] - 2026-02-15 13:00:00

### 🎨 UI: Landing Page Polish
- **Summary**: 랜딩 페이지 Hero 섹션 디자인 개선 (Unicorn Studio 배지 및 메뉴 제거).
- **Detail**:
  - **HeroSection**: 상단 Floating Menu 제거하여 깔끔한 첫인상 제공.
  - **CSS**: Unicorn Studio "Made with" 배지 숨김 처리 (`globals.css`).
- **Build Time**: 2026-02-15 14:10:00

## [Alpha V1.225] - 2026-02-15 13:30:00

### 🚑 Hotfix: Hero Section Redesign Not Applied
- **Summary**: `HeroSection.tsx` 파일이 이전 버전(V1.220)으로 남아있는 문제 확인 및 강제 덮어쓰기 배포.
- **Detail**:
  - **Correction**: "Minimalist Bold" 디자인 코드가 파일 시스템에 정상적으로 반영되지 않았던 오류 수정.
  - **Verification**: `page.tsx` 버전을 `Alpha V1.225`로 업데이트하고, Hero 섹션의 Bento Grid 코드가 완전히 제거되었음을 확인.
- **Build Time**: 2026-02-15 13:30:00

## [Alpha V1.226] - 2026-02-15 12:00:00

### 🚀 Deployment: Version Bump & Timestamp Correction
- **Summary**: 배포 요청에 따른 버전 업데이트 및 타임스탬프 동기화.
- **Detail**:
  - **Version**: `Alpha V1.226`
  - **Correction**: 이전 빌드 타임스탬프 오류 수정 및 최신 배포 트리거.
- **Build Time**: 2026-02-15 12:00:00

## [Alpha V1.225] - 2026-02-15 14:00:00

### 🎨 UI: Landing Page Redesign & Localization (Complete)
- **Summary**: 랜딩 페이지 전체 섹션 디자인 리팩토링 및 완전 한글화.
- **Detail**:
  - **SolutionSection**: Minimal Flow 스타일 적용, 4단계 프로세스 시각화.
  - **FeatureSection**: Focused Interface 스타일 적용, 핵심 기능 모듈화.
  - **SocialProofSection**: Data Stream (Ticker) 스타일 적용, 실시간 피드백 연출.
  - **CTASection**: Impact & Action 스타일 적용, 강력한 전환 유도.
  - **Localization**: Hero 섹션을 포함한 모든 랜딩 페이지 텍스트 한글화 완료.
  - **Animation**: `globals.css`에 Marquee 애니메이션 추가.
- **Build Time**: 2026-02-15 14:00:00

## [Alpha V1.224] - 2026-02-15 13:00:00

### 🚀 Deployment: Force Refresh
- **Summary**: 배포 반영 확인을 위한 버전 범프 및 강제 재배포.
- **Detail**:
  - **Version Check**: `page.tsx` Footer에 표시되는 버전을 `Alpha V1.224`로 업데이트하여 사용자가 배포 상태를 직관적으로 확인할 수 있도록 함.
  - **Force Rebuild**: Vercel 캐시 무효화 및 새 빌드 트리거.
- **Build Time**: 2026-02-15 13:00:00

## [Alpha V1.223] - 2026-02-15 12:30:00

### 🎨 UI: Landing Page Hero Redesign (Minimalist Bold)
- **Summary**: 사용자 피드백(첨부 이미지 Refference)을 반영하여 Hero 섹션을 대담하고 심플한 타이포그래피 중심으로 전면 재설계.
- **Detail**:
  - **Concept**: "Your Creative" 스타일의 Massive Typography ("Jubot").
  - **Layout**: 
    - Full-screen centered text (`text-[22vw]`).
    - Top Right Navigation (Start Now, Search).
    - Floating Bottom Navigation Pill (Dashboard, Portfolio, etc.).
  - **Background**: 기존 Unicorn Studio Fluid Effect 유지 (`I3ce1qwYAbbqQdgYp5FS`)하며 텍스트와 조화(mix-blend-multiply).
  - **Cleanup**: `page.tsx`의 중복된 Global Navigation 제거.
- **Build Time**: 2026-02-15 12:30:00

## [Alpha V1.222] - 2026-02-15 12:00:00

### 🐛 Fix: Favicon not updating
- **Summary**: 파비콘 변경이 반영되지 않는 문제 해결.
- **Detail**:
  - **Cleanup**: `public/favicon.ico` 삭제 (Next.js App Router의 `icon.png` 자동 생성 우선순위 보장).
  - **Metadata**: `layout.tsx`의 명시적 `icons` 설정을 제거하고 파일 시스템 기반 API(`src/app/icon.png`) 활용으로 전환.
  - **Verification**: `src/app/icon.png`가 자동으로 리사이징되어 파비콘 및 애플 터치 아이콘으로 생성됨.
- **Build Time**: 2026-02-15 12:00:00

## [Alpha V1.221] - 2026-02-15 11:30:00

### 🎨 UI: Landing Page Redesign (Industrial/Bento Grid)
- **Summary**: "ChainGPT Labs Aesthetic"을 적용한 랜딩 페이지 전면 리브랜딩 및 구조 개편.
- **Detail**:
  - **Design Concept**: Industrial, Technical, Bento Grid, High Contrast(Black/White/Yellow).
  - **New Sections**:
    - **Hero**: Bento Grid 레이아웃 + Unicorn Studio 배경 + Ticker.
    - **Problem**: System Diagnosis (Error Logs) 컨셉.
    - **Solution**: Process Optimization (Flow Chart) 컨셉.
    - **Feature**: Control Panel (System Modules) 컨셉.
    - **Social Proof**: User Access Logs (Database Records) 컨셉.
    - **CTA**: System Launch (Terminal Interface) 컨셉.
  - **Global UI**: Navigation 및 Footer 스타일을 Industrial 테마에 맞춰 업데이트.
- **Build Time**: 2026-02-15 11:30:00

## [Alpha V1.220] - 2026-02-15 10:20:00

### 🎨 UI: Hero Section Redesign (ChainGPT Style)
- **Summary**: ChainGPT 스타일의 Bento Grid 레이아웃 적용 및 배경 효과 교체
- **Detail**:
  - `HeroSection`: Bento Grid 시스템 도입 (Ticker, Left Panel, Right Visual).
  - **Background**: Unicorn Studio 프로젝트 교체 (`I3ce1qwYAbbqQdgYp5FS`).
  - **Design**: Industrial/Tech 테마 적용 (White/Grey 배경 + Yellow 포인트 + Grid Overlay).
- **Build Time**: 2026-02-15 10:20:00

## [Alpha V1.219] - 2026-02-15 10:00:00

### 🎨 UI: Landing Page Background Effect
- **Summary**: 랜딩 페이지 Hero 섹션에 Unicorn Studio 배경 효과 적용
- **Detail**:
  - `HeroSection`: Unicorn Studio 스크립트 연동 및 배경 컨테이너 추가.
  - 기존 노란색(`bg-[#F7D047]`) 배경 위에 Unicorn Studio 효과가 오버레이되도록 처리.
- **Build Time**: 2026-02-15 10:00:00

## [Alpha V1.218] - 2026-02-15 00:15:00

### 🐛 Fix: Favicon Visibility
- **Summary**: 파비콘 미표시 문제 해결을 위한 명시적 설정 추가
- **Detail**:
  - `src/app/layout.tsx`: Next.js Metadata에 `icons` 속성 명시적 추가.
  - `public/favicon.ico`: `icon.png`를 복사하여 레거시 브라우저 호환성 확보.
- **Build Time**: 2026-02-15 00:15:00

## [Alpha V1.217] - 2026-02-14 23:55:00

### 🎨 UI: Favicon Update
- **Summary**: 파비콘(Favicon) 및 앱 아이콘 적용
- **Detail**:
  - `src/app/icon.png`: 사용자 제공 파비콘 이미지 적용.
  - 브라우저 탭 및 북마크 아이콘이 주봇 로고로 변경됨.
- **Build Time**: 2026-02-14 23:55:00

## [Alpha V1.216] - 2026-02-14 23:45:00

### 🎨 UI: Landing Page Polish
- **Summary**: 랜딩 페이지 이미지 리소스 적용 및 디자인 필터 추가
- **Detail**:
  - `FeatureSection`: 4가지 핵심 기능(일일체크, 주식일지, 인사이트, 조건검색)에 실제 프리뷰 이미지 적용.
  - `Design Filter`: Hero 및 Feature 이미지에 미세한 밝기/대비 조절 필터(`brightness-90 contrast-110 saturate-110`)를 적용하여 세련된 느낌 전달.
  - `Hover Effect`: 이미지 호버 시 필터가 해제되면서 원본 색상이 드러나는 인터랙션 추가.
- **Build Time**: 2026-02-14 23:45:00

## [Alpha V1.215] - 2026-02-14 23:35:00

### 🎨 UI: Hero Section Animation
- **Summary**: 랜딩 페이지 Hero 섹션 대시보드 이미지 애니메이션 적용
- **Detail**:
  - `HeroSection`: 대시보드 스크린샷(`dashboard_ALL.png`)이 천천히 위로 스크롤되는 애니메이션 추가.
  - 사용자가 실제 대시보드를 훑어보는 듯한 시각적 효과 구현.
- **Build Time**: 2026-02-14 23:35:00

## [Alpha V1.214] - 2026-02-14 23:30:00

### 🎨 UI: Landing Page Overhaul
- **Summary**: 랜딩 페이지 전면 개편 (6단계 설득 구조)
- **Detail**:
  - `Hero`: "기록하는 투자 습관" 슬로건 및 메인 액션.
  - `Problem`: 초보 투자자의 Pain Point (매수/매도 기준 부재) 공감.
  - `Solution`: 주봇 = 페이스메이커 컨셉 제시.
  - `Features`: 4대 핵심 기능(일일체크, 주식일지, 인사이트, 조건검색) Benefit 강조.
  - `SocialProof` & `CTA`: 사용자 후기 및 가입 유도.
  - `framer-motion` 도입으로 스크롤 애니메이션 적용.
- **Build Time**: 2026-02-14 23:30:00

## [Alpha V1.213] - 2026-02-14 22:30:00

### 💡 Feature: Jubot Page Guide
- **Summary**: 각 페이지 상단에 주봇 가이드 아이콘 추가
- **Detail**:
  - `Dashboard`, `Portfolio`, `Insights`, `ConditionSearch` 페이지 타이틀 옆에 주봇 아이콘 배치.
  - 클릭 시 말풍선으로 해당 페이지의 역할과 사용팁 안내.
  - `JubotPageGuide` 공통 컴포넌트 구현.
- **Build Time**: 2026-02-14 22:30:00

## [Alpha V1.211] - 2026-02-14 21:30:00

### 📐 UI: Global Mobile Padding Reduction
- **Summary**: 모든 페이지의 모바일 컨테이너 여백 축소 (`p-1`)
- **Detail**:
  - `Dashboard`, `Portfolio`, `Insights`, `ConditionSearch`, `Jubot` 등 모든 메인 페이지의 모바일 컨테이너 패딩을 `p-6`에서 `p-1`(약 4px)로 일괄 축소.
  - 모바일 환경에서의 가용 화면 너비를 극대화하여 콘텐츠 집중도 향상.
- **Build Time**: 2026-02-14 21:30:00

## [Alpha V1.210] - 2026-02-14 21:20:00

### 📐 UI: Mobile Margin Refinement
- **Summary**: 주봇 페이지 전체 컨테이너 여백 축소 (모바일)
- **Detail**:
  - `JubotPage`의 컨테이너 패딩을 `p-6`에서 모바일 기준 `p-2`로 대폭 축소하여 화면 활용도 극대화 (기존 대비 약 1/3 수준으로 여백 감소)
- **Build Time**: 2026-02-14 21:20:00

## [Alpha V1.209] - 2026-02-14 21:10:00

### 📐 UI: Mobile Padding Adjustment
- **Summary**: 주봇 분석 카드 모바일 내부 여백 축소
- **Detail**:
  - `JubotPortfolioInsight` 및 `JubotBriefing`의 모바일 화면 내부 여백을 기존 대비 약 1/2~1/3 수준(`p-3`)으로 축소하여 콘텐츠 영역 확보
- **Build Time**: 2026-02-14 21:10:00

## [Alpha V1.208] - 2026-02-14 21:00:00

### 🎨 UI: Jubot Header Refinement
- **Summary**: 주봇 분석 컴포넌트 헤더 레이아웃 수정 (가로 → 세로)
- **Detail**:
  - **JubotPortfolioInsight**: 제목/시간과 재분석 버튼을 세로로 배치하여 모바일 가독성 및 터치 편의성 개선
  - **JubotBriefing**: 일관된 UX를 위해 브리핑 헤더도 동일한 수직 레이아웃 적용
- **Build Time**: 2026-02-14 21:00:00

## [Alpha V1.207] - 2026-02-14 20:45:00

### 📱 Mobile UI Refinement
- **Summary**: 사용자 피드백 반영 모바일 UI 여백 및 레이아웃 개선
- **Detail**:
  - **여백 최소화**: `SidebarLayout` 및 `PortfolioTable`의 모바일 여백을 축소하여 화면 활용도 극대화
  - **모달 최적화**: 종목 상세 모달(`StockDetailChartModal`)을 모바일에서 전체 화면 수준으로 확장
  - **헤더 간소화**: 모바일 모달 헤더의 중복 정보 제거 및 저장 버튼 아이콘화
  - **거래 카드뷰**: 모바일에서 거래 내역 테이블을 카드 리스트 형태로 변환하여 가독성 개선
- **Build Time**: 2026-02-14 20:45:00

## [Alpha V1.206] - 2026-02-14 18:35:00

### 📱 Mobile UI Overhaul
- **Summary**: Comprehensive mobile UI responsiveness updates.
- **Detail**:
  - **Navigation**: Added `MobileHeader` and `MobileDrawer` to replace the sidebar on mobile devices.
  - **Dashboard**: Refactored `MarketFlowChart` and `DashboardIndex` to stack correctly on single-column layouts.
  - **Portfolio**: Improved `PortfolioCard`, `PortfolioSummaryBlock`, and `SidebarLayout` padding for better mobile readability and to prevent overflow.
  - **Modals**: Optimized `StockDetailChartModal` to fit mobile screens with adjusted padding and chart heights.
- **Build Time**: 2026-02-14 18:35:00

## [Alpha V1.205] - 2026-02-14 09:31:00

### 🤖 주봇 1.0 (JUBOT 1.0) 대규모 업데이트
- **Summary**: 주봇 1.0 — 뉴스 소스 확대, 전문가 우선 노출, 거래기록 리뷰, 버전 관리 체계 도입
- **Detail** :
  - **뉴스 소스 4배 확대**: 매일경제/연합뉴스 + 네이버 경제/인베스팅닷컴 (소스별 최대 10개, 총 40개)
  - **전문가 우선 노출**: 박시동, 이광수 관련 기사 자동 감지 → 🎤 전문가 의견 섹션 별도 표시
  - **거래기록 리뷰 (0순위)**: 포트폴리오 분석 시 매수/매도 이력에 대한 타이밍 평가 최우선 제공
  - **포트폴리오에 뉴스 통합**: 재무/공시/배당 + 뉴스 데이터를 함께 AI에 전달하여 종합 분석
  - **JUBOT_LOGIC 버전 관리**: 주봇 1.0으로 명명, 변경 이력 추적 구조 도입
- **Build Time**: 2026-02-14 09:31:00

## [Alpha V1.204] - 2026-02-14 17:30:00

### 🔧 Bug Fix & UX Improvement
- **Summary**: 주요 지수 데이터 연동 및 브리핑/포트폴리오 로딩 속도 개선 (Phase 6.5)
- **Detail** :
  - **지수 데이터**: KOSPI, KOSDAQ, S&P500, NASDAQ 데이터 연동 (Yahoo Finance API 활용)
  - **즉시 로딩**: SessionStorage를 활용하여 페이지 이동 시 분석 결과가 '즉시' 표시되도록 개선 (불필요한 로딩바 제거)
- **Build Time**: 2026-02-14 17:30:00

## [Alpha V1.203] - 2026-02-14 17:00:00

### 🚀 Performance Optimization
- **Summary**: 캐싱 시스템 도입 및 성능 최적화 (Phase 6)
- **Detail** :
  - **일일 브리핑**: 생성된 브리핑 재사용 (DB 캐싱)
  - **포트폴리오/종목 분석**: 최근 분석 결과 자동 로드 (불필요한 AI 재생성 방지)
  - **UI 개선**: 분석 시간(Timestamp) 표기 추가
- **Build Time**: 2026-02-14 17:00:00

## [Alpha V1.202] - 2026-02-14 16:35:00

### 🔄 Build Update
- **Summary**: Cron Schedule Adjustment
- **Detail** :
  - **Cron**: 시장 브리핑 시간을 08:30 KST → **07:00 KST** 로 변경 (개장 전 브리핑 강화)
- **Build Time**: 2026-02-14 16:35:00

## [Alpha V1.201] - 2026-02-14 16:30:00

### 🔄 Build Update
- **Summary**: Vercel Cron & Daily Briefing Persistence
- **Detail** :
  - **Cron**: 매일 08:30 KST 시장 브리핑 자동 생성 (`vercel.json`)
  - **Persistence**: 생성된 브리핑을 DB에 자동 저장 (`jubot_analysis` 테이블)
  - `/api/jubot/analyze/daily?save=true` API 수정 완료
- **Build Time**: 2026-02-14 16:30:00

## [Alpha V1.200] - 2026-02-14 16:00:00

### 🔄 Build Update
- **Summary**: 화폐 표기 표준화 (KRW/USD)
- **Detail** :
  - 원화: 1,234원 (정수, '원' 포함)
  - 달러: $12.34 (소수점 2자리, '$' 포함)
  - 전체 UI 및 AI 분석 텍스트 일관성 적용
- **Build Time**: 2026-02-14 16:00:00

## [Alpha V1.199] - 2026-02-14 00:08:00

### 🔄 Build Update
- **Summary**: 주봇 포트폴리오 분석 고도화 및 KIS API 시세 조회 안정화
- **Detail**:
  - **시세 조회 안정화**: 배치(5개) + 딜레이(300ms) + 재시도(3회) 전략으로 0원 가격 버그 완전 해결
  - **DART 공시/배당 연동**: OpenDART API를 활용하여 공시 일정 및 배당금 정보 자동 수집
  - **전체 종목 분석**: 평가금액 순으로 모든 보유 종목에 대한 AI 분석 제공 (필터링 제거)
  - **AI 프롬프트 최적화**: 공시 → 배당 → 액션 → 가격 순의 4단계 분석 우선순위 적용
- **Build Time**: 2026-02-14 00:08:00

## [Alpha V1.188] - 2026-02-13 21:30:00

### 🔧 DART 재무 데이터 + 뉴스 연동 근본 수정
- **Summary**: OpenDART corp_code 매핑 + 뉴스 RSS 직접 파싱으로 전면 수정
- **Detail**:
  - `dart-corp-codes.json`: 3,946개 상장사 stock_code→corp_code 매핑 파일 생성
  - `opendart.ts`: API 호출 대신 JSON 매핑에서 corp_code 즉시 조회, `.KS` suffix 자동 제거
  - 종목 분석 뉴스: self-call 제거 → RSS 직접 파싱으로 관련 뉴스 추출
- **Build Time**: 2026-02-13 21:30:00



### 🐛 Bug Fix: 심층 분석 현재가 0원 표시 수정
- **Summary**: 서버 self-call(localhost) 실패 → KIS 클라이언트 직접 import로 전환
- **Detail**: `getDomesticPrice`/`getOverseasPrice`를 직접 호출하여 Vercel에서도 현재가 정상 조회
- **Build Time**: 2026-02-13 21:15:00



### 🚀 OpenDART API 직접 호출 적용
- **Summary**: DART 재무 데이터를 Supabase 테이블 대신 OpenDART API 직접 호출로 전환
- **Detail**:
  - `src/lib/opendart.ts` 유틸리티 생성 (corp_code 조회, 재무제표, 배당)
  - 포트폴리오 분석 API — OpenDART 직접 호출 전환
  - 종목 분석 API — OpenDART 직접 호출 전환
  - opendart/company API — 전면 리팩토링
  - .env.local에 DART_API_KEY 추가
- **Build Time**: 2026-02-13 21:00:00



### 🐛 Bug Fix: 주봇 종목 분석 현재가 완전 수정
- **Summary**: 종목 클릭 시 매입단가 대신 KIS API 실시간 현재가를 표시
- **Detail**: JubotStockCard가 서버에 currentPrice=0 전송 → 서버가 KIS API로 실가격 조회 → 응답의 current_price를 UI에 표시
- **Build Time**: 2026-02-13 20:52:00



### 🐛 Bug Fix: 주봇 종목 분석 현재가 미전달 수정
- **Summary**: 포트폴리오/종목 분석 시 매입단가를 현재가로 잘못 전달하던 문제 해결
- **Detail**: KIS API로 실제 현재가를 조회하여 AI 분석에 전달하도록 수정

### 🚀 주봇 Phase 3: 분석 히스토리 타임라인
- **Summary**: AI 분석 결과 자동 저장 및 히스토리 타임라인 UI
- **Detail**:
  - 분석 히스토리 API (`/api/jubot/history`) GET/POST
  - JubotHistory 타임라인 UI (인사이트 페이지 하단)
  - 포트폴리오 분석 시 결과 자동 저장
  - jubot_analysis 테이블 SQL 마이그레이션 스크립트
- **Build Time**: 2026-02-13 20:35:00



### 🚀 주봇 Phase 2: 포트폴리오 연동
- **Summary**: DART 재무 데이터 통합 + 종목별 심층 AI 분석 카드
- **Detail**:
  - 포트폴리오 분석 API에 DART 재무 데이터(매출/ROE/배당) 통합
  - 종목별 개별 분석 API 신규 (`/api/jubot/analyze/stock`)
  - JubotStockCard 모달 UI (재무 테이블, 리스크/기회, 행동 가이드)
  - 종목 클릭 → 심층 분석 카드 모달 연동
- **Build Time**: 2026-02-13 20:15:00



### 🐛 Bug Fix: 목표가 근접 경고 아이콘 위치 수정
- **Summary**: 아이패드 등 모바일 환경에서 목표가 근접 경고(🔥) 아이콘 위치가 어긋나는 문제 해결
- **Detail**: Recharts YAxis `foreignObject` 너비 증가(100→120px) 및 `scale` 변환 제거로 렌더링 안정성 확보
- **Build Time**: 2026-02-13 19:50:00



### 🎨 UI: 주봇 텍스트 크기 한 단계 증가
- **Summary**: 주봇 브리핑 및 포트폴리오 분석 컴포넌트의 모든 텍스트 크기를 한 단계씩 키움
- **Detail**: xs→sm, sm→base, base→lg, lg→xl, xl→2xl 전체 적용
- **Build Time**: 2026-02-13 19:30:00



### 🔄 Refactor: 주봇 컴포넌트 기존 페이지 통합
- **Summary**: 주봇 전용 페이지를 제거하고 기존 페이지에 통합 배치
- **Detail**:
  - 오늘의 시장 브리핑 → 일일체크 페이지 최상단 배치
  - 내 종목 AI 분석 → 인사이트 페이지 AI투자분석 교체
  - 사이드바 '주봇 AI' 독립 메뉴 제거
- **Build Time**: 2026-02-13 19:25:00



### 🤖 Feature: AI 주식 전문가 "주봇" Phase 1
- **Summary**: 뉴스 수집 + AI 시장 브리핑 + 포트폴리오 AI 분석 기능 및 전용 페이지 추가
- **Detail**:
  - **뉴스 수집**: 네이버 증권 + 한국경제 RSS 자동 수집 → Gemini AI 분석 (`/api/jubot/collect/news`)
  - **일일 브리핑**: 뉴스 + 시장 데이터 결합 AI 시장 요약 생성 (`/api/jubot/analyze/daily`)
  - **포트폴리오 분석**: 보유 종목별 AI 시그널(매수/보유/매도/관망) 생성 (`/api/jubot/analyze/portfolio`)
  - **전용 페이지**: `/jubot` 페이지 + `JubotBriefing`, `JubotPortfolioInsight` 컴포넌트
  - **사이드바**: '주봇 AI' 메뉴 추가
  - **DB**: Supabase 테이블 SQL 작성 (`doc/jubot_tables.sql`)
- **Build Time**: 2026-02-13 17:58:00

## [Alpha V1.178] - 2026-02-13 17:24:00

### 🔧 Infra: 주식 데이터 로딩 안정성 개선 (공통 모듈화)
- **Summary**: 주식 데이터 fetch 자동 Retry, Timeout, 수동 새로고침 기능을 공통 모듈로 구현
- **Detail**:
  - **공통 훅**: `useStockFetch.ts` - 자동 Retry(3회, 지수 백오프), AbortController Timeout(10초), 수동 refetch
  - **공통 UI**: `StockLoadError.tsx` - 에러 시 새로고침 버튼 (inline/block/section 모드)
  - **useBatchStockPrice 개선**: retry 1회→3회, 실패 심볼 추적, refetch/refetchSymbol 함수 노출
  - **Dashboard**: SectorWatchList에 블록 새로고침 버튼, SectorRowItem에 인라인 새로고침 아이콘
  - **Portfolio**: PortfolioTable에 에러 배너 + 새로고침
  - **모달**: 차트/투자자동향/재무분석 각각 독립 Retry + 새로고침 버튼
- **Build Time**: 2026-02-13 17:24:00

## [Alpha V1.177] - 2026-02-13 17:15:00

### 📋 UI: 주식일지 편의성 및 통화 표시 개선
- **Summary**: 거래 완료 종목 목록 숨김/펼치기 기능 및 해외 주식 USD($) 표기
- **Detail**:
  - **거래 완료 수익**: 기본적으로 요약(총계)만 표시하고 상세 목록은 '접기/펼치기' 버튼으로 조절
  - **해외 주식**: 내 주식 종합 '해외' 파트 및 해외 거래 내역의 통화 단위를 **USD($)**로 변경
- **Build Time**: 2026-02-13 17:15:00

## [Alpha V1.176] - 2026-02-13 16:50:00

### 🎨 UI: 대시보드 지수 시인성 개선 및 환율 상세화
- **Summary**: 주요 지표 폰트 확대, 마켓트렌드 섹션 삭제, 환율 변동폭 표시
- **Detail**:
  - **폰트 강조**: KOSDAQ, 미국지수 등락률(%) 및 환율/금리 수치 폰트 크기 확대
  - **환율/금**: 실시간 시세 및 **전일 대비 등락폭(▲/▼), 등락률(%)** 표시 추가 (Yahoo Finance 연동)
  - **엔화**: 100엔 단위로 환산 표시 적용
  - **섹션 정리**: "마켓트렌드" 테이블 삭제 및 KOSPI 블록 통합
- **Build Time**: 2026-02-13 16:50:00

## [Alpha V1.175] - 2026-02-13 15:10:00

### 🚀 Feature: 대시보드 지수종합 재설계
- **Summary**: KOSPI 일봉 차트+투자자동향, 기타 지수/환율/금리 블록 추가
- **Detail**:
  - **KOSPI 메인 블록**: 30일 일봉 AreaChart + 투자자 동향(개인/외국인/기관) 바+테이블
  - **기타 지수**: KOSDAQ, DOW, NASDAQ, S&P 500 컴팩트 카드
  - **환율**: 달러/원, 100엔/원, 위안/원 실시간 표시
  - **금리**: 한국/미국 기준금리 + 날짜 표기
  - **금 가격**: 1oz 기준 USD 표시
  - 새 API 라우트 `/api/market-extra` 추가
- **Build Time**: 2026-02-13 15:10:00

## [Alpha V1.174] - 2026-02-13 13:45:00

### 🚀 Feature: 포트폴리오 종합 블록 및 UX 개선
- **Summary**: 포트폴리오 페이지에 "내 주식 종합" 블록 추가 및 기본 정렬 변경
- **Detail**:
  - **내 주식 종합 블록**: 최상단에 전체/국내/해외 토글로 평가금액, 매입금액, 수익률 종합 표시
  - **거래 완료 수익 정리**: 매도 완료된 종목의 실현 수익금/수익률을 종목별 테이블로 제공
  - **기본 정렬 변경**: "최신등록순" → "평가금액순"으로 기본값 변경
  - **숫자 포맷팅**: 시가총액 등 모든 가격 정보에 1,000 단위 콤마 적용
- **Build Time**: 2026-02-13 13:45:00

## [Alpha V1.173] - 2026-02-13 11:50:00

### 🐛 Fix: 기업 재무 분석 데이터 미표시 수정
- **Summary**: KIS API 배열 응답 처리 수정으로 재무 정보 그리드 데이터 정상 표시
- **Detail**:
  - KIS Financial Ratio API가 분기별 배열을 반환하는 것을 감지하여 `[0]` (최신 분기) 접근으로 수정
  - OpenDART 의존성 제거 → KIS API 데이터 우선 사용, OpenDART는 선택적 보강
  - ROE, 매출성장률, 영업이익증가율, 순이익증가율, 부채비율 정상 표시 확인
- **Build Time**: 2026-02-13 11:50:00

## [Alpha V1.172] - 2026-02-13 11:17:00

### 🔄 Build Update
- **Summary**: StockDetailChartModal 기능 개선 및 OpenDART 연동
- **Detail**:
  - 차트 메인 색상 변경 (#F7D047)
  - 기업 재무 분석 그리드 추가 (OpenDART + KIS 하이브리드 데이터)
  - OpenDART API Route 구현 및 수집 스크립트 확장
- **Build Time**: 2026-02-13 11:17:00

## [Alpha V1.170] - 2026-02-12 23:28:00

### 🔄 StockDetailChartModal 재설계
- **Summary**: StockDetailChartModal의 레이아웃을 전면 재설계하여 사용성 및 정보 밀도 개선
- **Detail**:
  - 모달 폭 확대 (`max-w-5xl` → `max-w-7xl`)
  - 차트 기간 확대 (30일 → 45일, 약 2개월치 일봉)
  - **투자자동향 블록 신규 추가**: 차트 우측에 개인/외국인/기관 순매수 바 차트 및 일별 테이블
  - 매입정보(좌) + 목표설정(우) 2컬럼 배치로 레이아웃 변경
  - 전체 모달 Dark Mode 적용 (#1E1E1E, #252525, #333)
  - 지수대비 수익률 비교 오버레이도 Dark Mode 적용
- **Build Time**: 2026-02-12 23:28:00

## [Alpha V1.167] - 2026-02-12 16:35:00

### 🌏 Localization: Landing Page (Korean)
- **Summary**: 랜딩 페이지(`src/app/page.tsx`)의 모든 영문 텍스트를 자연스러운 한국어로 번역.
- **Detail**:
  - Hero, Features, Social Proof 섹션의 마케팅 문구를 국내 사용자 친화적인 톤앤매너로 수정.
  - "UI meets AI Investment" -> "AI 투자의 새로운 기준" 등 핵심 슬로건 현지화.
- **Build Time**: 2026-02-12 16:35:00

## [Alpha V1.169] - 2026-02-12 16:50:00

### 🔄 UI Polish based on User Feedback
- **Summary**: 사용자 피드백을 반영하여 Portfolio 및 Modal 관련 UI의 Dark Mode 완성도 향상.
- **Detail**:
  - **Portfolio**: 필터/정렬 컨트롤 바, "내 주식 기록하기" 버튼 가독성 개선 및 스타일 통일.
  - **Modals**: 종목 검색, 매매 기록 추가 모달 전체 Dark Theme 적용.
- **Build Time**: 2026-02-12 16:50:00

## [Alpha V1.168] - 2026-02-12 16:35:00

### 🔄 Design Update: Expanded Vibrant Dark Mode
- **Summary**: Condition Search, Portfolio, Memo 페이지까지 Vibrant Dark Mode 확대 적용 및 전체 빌드 안정화.
- **Detail**:
  - **Condition Search**: 필터 입력창, 결과 테이블, 프리셋 영역 Dark Theme(#1E1E1E) 적용.
  - **Portfolio**: 포트폴리오 카드 및 리스트 스타일 개선, 가독성 향상.
  - **Memo**: 메모 오버레이 및 전체 페이지 디자인 일관성 확보.
- **Build Time**: 2026-02-12 16:35:00

## [Alpha V1.166] - 2026-02-12 16:00:00

### 🔄 Design Update: Vibrant Dark Mode (Dashboard & Insights)
- **Summary**: Dashboard 및 Insights 페이지의 주요 컴포넌트에 Vibrant Dark Mode 적용.
- **Detail**:
  - **Dashboard**: MarketFlowChart, DashboardWatchlists, SectorBarChart 스타일 생생한 다크 테마로 변경.
  - **Insights**: AiGuruBlock, TargetProximityBlock, PortfolioCompositionBlock 등 핵심 분석 도구의 시인성 및 심미성 강화.
  - **Components**: 공통 차트, 리스트, 툴팁 등 세부 요소까지 일관된 디자인 언어(#1E1E1E 배경, #F7D047 포인트) 적용.
- **Build Time**: 2026-02-12 16:00:00

## [Alpha V1.165] - 2026-02-12 15:10:00

### 36. 랜딩 페이지 리브랜딩 (Vibrant Dark Mode)
- **Summary**: 고대비(High Contrast)와 생생한 컬러(Vibrant Colors)를 활용한 'Vibrant Dark Mode' 컨셉으로 디자인 전면 수정.
- **Detail**:
  - **Color Palette**: Bright Yellow(#F7D047) Hero + Deep Charcoal(#121212) Features + Vivid Accents (Blue, Purple, Orange, Teal)
  - **Layout**: Bento Grid 스타일의 모듈형 카드 레이아웃 적용
  - **Visual**: Bold Typography & Abstract CSS Graphics (Image Gen 대체)
- **Build Time**: 2026-02-12 15:10:00

## [Alpha V1.164] - 2026-02-12 14:35:00

### 35. 랜딩 페이지 리브랜딩 (Note Concept)
- **Summary**: 사용자 피드백을 반영하여 심플한 노트 필기 컨셉으로 랜딩 페이지 디자인 전면 수정.
- **Detail**:
  - **Design System**: 주황색 제거 → Indigo/Slate 기반의 Clean & Minimalist 스타일
  - **Visual**: CSS Grid 패턴 배경 + Line Art 스타일 아이콘 (Lucide React 활용)
  - **Concept**: "투자는 기록이다" — 노트에 직접 쓰는 듯한 아날로그 감성 구현
- **Build Time**: 2026-02-12 14:35:00

## [Alpha V1.163] - 2026-02-12 14:20:00

### 34. 랜딩 페이지 리브랜딩 (JUBOT)
- **Summary**: 서비스명을 '주봇(JUBOT)'으로 변경하고 랜딩 페이지를 전면 개편했습니다.
- **Detail**:
  - 브랜드 컨셉: "내 주식의 기록, 주봇" (감정 기록 + AI 조언)
  - 디자인: 오렌지/앰버 톤의 따뜻하고 친근한 UI
  - 캐릭터: 3D 로봇 캐릭터 '주봇' 일러스트 적용 (`jubot_main.png`)
  - 구성: Hero → Key Value → Features → How it works → Footer 5단 구성
- **Build Time**: 2026-02-12 14:20:00

## [Alpha V1.162] - 2026-02-11 00:55:00

### 33. 메모 저장 오류 수정
- **Summary**: 메모 API 인증 방식을 서버 사이드 쿠키 기반으로 변경하여 저장 실패 문제 해결.
- **Detail**:
  - `/api/memos`를 `createClient` from `@/utils/supabase/server` (쿠키 기반)로 변경
  - 프론트엔드에서 불필요한 `Authorization` 헤더 제거
- **Build Time**: 2026-02-11 00:55:00

## [Alpha V1.161] - 2026-02-11 00:50:00

### 32. 주식일지 메모 기능 추가
- **Summary**: 모든 페이지에서 사용 가능한 Layer 2 오버레이 메모장 + 메모 리스트 페이지 구현.
- **Detail**:
  - Supabase `stock_memos` 테이블 SQL 제공 (RLS 적용)
  - `/api/memos` CRUD API 라우트 (JWT 인증)
  - `MemoOverlay` 컴포넌트: 우측 하단 FAB → 슬라이드업 메모 패널 (오늘 날짜/현재 페이지 자동 기입)
  - `/memo` 메모 리스트 페이지: 날짜별 그룹핑, 검색, 인라인 편집, 삭제
  - 사이드바에 '주식일지메모' 메뉴 추가
- **Build Time**: 2026-02-11 00:50:00

## [Alpha V1.160] - 2026-02-11 00:20:00

### 31. 조건검색 투자의견 섹션 제거
- **Summary**: 조건 검색 화면 하단의 '투자의견(HTS 0640)' 섹션 삭제.
- **Detail**:
  - `ConditionSearchPage`에서 투자의견 조회 및 표시 관련 UI/로직 제거
- **Build Time**: 2026-02-11 00:20:00

## [Alpha V1.159] - 2026-02-10 23:25:00

### 30. AI 조언과 UI 경고 동기화
- **Summary**: 하한/상한 목표 경고(불꽃 아이콘)와 AI 조언의 불일치 문제 해결.
- **Detail**:
  - UI와 동일하게 목표가 5% 이내 접근 시 `proximity` 경고 데이터 생성
  - AI 프롬프트에 `proximity` 필드가 있는 종목을 **최우선(0순위, 긴급)**으로 다루도록 지시
  - 이제 불꽃 아이콘이 뜬 종목은 AI 조언에서도 반드시 "손절매 고려" 등으로 언급됨
- **Build Time**: 2026-02-10 23:25:00

## [Alpha V1.158] - 2026-02-10 23:10:00

### 29. AI 조언 블록 리디자인 & 소규모 종목 필터링
- **Summary**: AI 조언 블록 UI 전면 리디자인 및 3% 이하 종목 조언 제외.
- **Detail**:
  - 좌측 캐릭터 이미지 제거 → 아이콘 + 타이틀 헤더의 깔끔한 카드 디자인
  - 조언 항목을 카드형 레이아웃으로 변경 (배경 카드 + 태그 + 텍스트)
  - 로딩 UI를 스켈레톤 애니메이션으로 교체
  - 프론트엔드에서 포트폴리오 비중 3% 미만 종목을 API 호출 전 필터링
  - AI 프롬프트에 "비중 3% 이상 종목만 분석" 조건 명시
- **Build Time**: 2026-02-10 23:10:00

## [Alpha V1.157] - 2026-02-10 22:55:00

### 28. 해외 주식 모달 차트 최종 수정
- **Summary**: 해외 주식 차트 데이터가 없을 때 안내 메시지 표시 및 현재가 정상 표시.
- **Detail**:
  - 모달 차트 영역에 빈 데이터 fallback UI 추가 ("차트 데이터를 불러올 수 없습니다")
  - `useStockPrice` 카테고리 수정으로 해외 주식 현재가 정상 표시
  - PM 등 일부 종목은 KIS API에서 일봉 데이터 미제공 → 안내 표시
- **Build Time**: 2026-02-10 22:55:00

## [Alpha V1.156] - 2026-02-10 22:50:00

### 27. 해외 주식 일봉 차트 교환코드 재시도 강화
- **Summary**: NYSE 종목(PM 등)의 일봉 차트 데이터 조회 실패 수정.
- **Detail**:
  - `output2` 빈 배열 반환 시 교환코드 재시도 (NAS↔NYS 토글) 로직 추가
  - 기존 재시도는 `rt_cd` 에러 시에만 동작 → 이제 데이터 없을 때도 교환코드 전환
  - AAPL(NAS) 정상 확인 완료, PM(NYS) 재시도 로직으로 해결 예상
- **Build Time**: 2026-02-10 22:50:00

## [Alpha V1.155] - 2026-02-10 22:40:00

### 26. 해외 주식 일봉 차트 API URL 수정
- **Summary**: KIS API 해외 일봉 엔드포인트 URL 오류 수정 (`daily-price` → `dailyprice`).
- **Detail**:
  - KIS API URL에서 하이픈이 포함된 `/quotations/daily-price`가 404 반환 확인
  - 정확한 URL `/quotations/dailyprice` (하이픈 없음)로 교체
  - 교환코드 재시도, KST 날짜, 에러 허용 로직은 V1.154에서 이미 적용
- **Build Time**: 2026-02-10 22:40:00

## [Alpha V1.154] - 2026-02-10 21:55:00

### 25. AI 조언 전문가 말투 전환 & 해외 주식 차트 수정
- **Summary**: AI 조언 사투리→전문가 말투 전환, 조언 UI 형식 개선, 해외 주식 일봉 차트 API 수정.
- **Detail**:
  - AI 프롬프트: 충청도 사투리 → 전문가 표준어 존댓말로 전면 변경
  - AiGuruBlock UI: 번호 리스트/[카테고리] 대괄호 → 태그형 카드 레이아웃
  - `getOverseasDailyPriceHistory`: 교환코드 재시도, KST 날짜, 에러 시 빈 배열 반환
  - 차트 API 라우트: 500 에러 → 빈 배열 반환으로 변경
- **Build Time**: 2026-02-10 21:55:00

## [Alpha V1.153] - 2026-02-10 21:38:00

### 24. 해외 주식 현재가/차트 수정 (핵심 버그 수정)
- **Summary**: 해외 주식의 현재가가 매입단가로 표시되던 핵심 버그 수정.
- **Detail**:
  - **핵심 수정**: `StockDetailChartModal`에서 `useStockPrice(symbol, 0, 'KR')` → `useStockPrice(symbol, 0, asset.category)`로 변경. 해외 주식도 올바른 API를 호출하여 실시간 시세 표시.
  - **소수점 지원**: 해외 주식 가격(USD)의 소수점 처리를 위해 차트 데이터와 목표가 파싱을 `parseInt` → `parseFloat`로 전면 변경.
  - **적용 파일**: `StockDetailChartModal.tsx`, `PortfolioCard.tsx`, `AiGuruBlock.tsx`
- **Build Time**: 2026-02-10 21:38:00

## [Alpha V1.152] - 2026-02-10 21:20:00

### 23. Gemini 모델 업그레이드 (2.5-flash)
- **Summary**: `gemini-1.5-flash` 모델이 API에서 제거(404)되어 `gemini-2.5-flash`로 업그레이드.
- **Detail**:
  - **모델 변경**: `gemini-1.5-flash` → `gemini-2.5-flash`
  - **원인**: Google API v1beta에서 1.5-flash 모델 지원 중단.
- **Build Time**: 2026-02-10 21:20:00

## [Alpha V1.151] - 2026-02-10 21:15:00

### 22. AI 오류 진단 및 이미지 복구
- **Summary**: AI 조언 API의 구체적인 에러 내용을 클라이언트에 표시하고, 캐릭터 이미지를 재설정.
- **Detail**:
  - **이미지 복구**: `guru_dog.png` 원본 파일을 아티팩트에서 다시 복사하여 적용 (깨짐 현상 수정).
  - **디버깅 강화**: `Internal Error` 발생 시 구체적인 에러 메시지(`error.message`)를 말풍선에 표시하여 원인 파악 용이하게 변경.
- **Build Time**: 2026-02-10 21:15:00

## [Alpha V1.150] - 2026-02-10 21:05:00

### 21. AI 로딩 애니메이션 이미지 수정
- **Summary**: 로딩 화면의 '고래' 이미지를 '푸들'로 수정 (V1.149에서 누락된 부분 수정).
- **Detail**:
  - **로딩 애니메이션**: `guru_whale.png` -> `guru_dog.png` 변경 완료.
  - 이제 분석 중일 때도 푸들 캐릭터가 나타납니다.
- **Build Time**: 2026-02-10 21:05:00

## [Alpha V1.149] - 2026-02-10 21:00:00

### 20. AI 캐릭터 이미지 최종 수정 (푸들)
- **Summary**: 로딩 화면 및 메인 화면의 AI 캐릭터 이미지를 '고래'에서 '푸들(멍구루)'로 확실하게 변경.
- **Detail**:
  - **이미지 교체**: `guru_whale.png` -> `guru_dog.png` (로딩 애니메이션 포함).
  - **이전 배포 누락 수정**: V1.147 배포 시 반영되지 않았던 코드를 재적용.
- **Build Time**: 2026-02-10 21:00:00

## [Alpha V1.148] - 2026-02-10 20:55:00

### 19. AI API 안정성 긴급 패치
- **Summary**: AI 조언 API (`/api/ai/advice`)의 오류 처리 로직을 대폭 강화하여 서버 내부 오류(500) 방지.
- **Detail**:
  - **API 키 체크**: `GOOGLE_AI_API_KEY` 환경 변수 누락 시 클라이언트에 명확한 에러 메시지(조언 형식) 반환.
  - **데이터 검증**: 입력된 포트폴리오 데이터(가격 등)의 `NaN` 값을 `0`으로 자동 보정하여 AI 입력 오류 방지.
  - **예외 처리**: 내부 로직 오류 시에도 빈 응답이나 서버 에러 대신 "잠시만 기다려봐유"와 같은 사용자 친화적 에러 메시지 반환.
- **Build Time**: 2026-02-10 20:55:00

## [Alpha V1.147] - 2026-02-10 20:50:00

### 18. AI 캐릭터 이미지 롤백 (푸들)
- **Summary**: 사용자 요청에 따라 AI 캐릭터 이미지를 '고래'에서 기존 '푸들(멍구루)'로 원복.
- **Detail**:
  - **이미지 변경**: `guru_dog.png` (푸들) 적용.
  - **이름 유지**: 캐릭터 이름은 'AI 주식 도사 고래' 유지 (사용자 의도 반영).
- **Build Time**: 2026-02-10 20:50:00

## [Alpha V1.146] - 2026-02-10 20:45:00

### 17. AI 조언 오류 수정 및 안정성 강화
- **Summary**: AI 응답 처리 로직을 개선하여 '조언 불러오기 실패' 오류를 해결.
- **Detail**:
  - **JSON 파싱 강화**: AI 모델의 응답에서 JSON 데이터만 정확히 추출하도록 로직 개선 (Markdown 코드 블록 잔여물 처리).
  - **디버깅 로그 추가**: 오류 발생 원인을 파악하기 위한 서버/클라이언트 상세 로그 추가.
- **Build Time**: 2026-02-10 20:45:00

## [Alpha V1.145] - 2026-02-10 20:25:00

### 16. AI 주식 도사 고래 (Guru Gorae) 리브랜딩 및 로딩 개선
- **Summary**: AI 캐릭터를 '멍구루(푸들)'에서 '고래(Whale)'로 변경하고 로딩 경험을 개선.
- **Detail**:
  - **캐릭터 변경**: 푸들 → 고래 (Guru Gorae) 이미지 및 페르소나 적용.
  - **로딩화면 개선**: 분석 중일 때 빈 화면 대신 고래 캐릭터와 함께 "분석 중이여유..."라는 친근한 애니메이션 메시지 표시.
  - **안정성**: 포트폴리오 데이터가 완전히 로드된 후 조언을 요청하도록 로직 수정.
- **Build Time**: 2026-02-10 20:25:00

## [Alpha V1.144] - 2026-02-10 20:15:00

### 15. AI 주식 도사 (AI Guru Advice) 추가
- **Summary**: 포트폴리오 맞춤형 조언을 제공하는 AI 주식 도사 '멍구루' 추가.
- **Detail**:
  - **캐릭터**: 마이크를 든 푸들 캐릭터(3D Render)와 충청도 사투리를 사용하는 친근한 페르소나 적용.
  - **기능**: 사용자의 포트폴리오를 실시간 분석하여 8가지 핵심 항목(목표가 근접, 섹터 균형, 비중 관리 등)에 대한 위트 있는 조언 제공.
  - **기술**: Google Gemini 1.5 Flash 모델 연동 및 실시간 시세 배치 조회(Batch Querying) 최적화.
- **Build Time**: 2026-02-10 20:15:00

## [Alpha V1.141] - 2026-02-10 19:32:00

### 14. 내 주식 인사이트 기능 고도화
- **Summary**: 업종별 상세 보기 및 목표가 근접 종목 시각적 강조 기능 추가.
- **Detail**:
  - **업종별 상세 보기 (Drill-down)**:
    - 업종별 파이차트나 리스트 클릭 시 해당 업종에 속한 보유 종목 리스트를 확인할 수 있는 기능 추가.
    - '뒤로 가기' 버튼을 통해 전체 업종 목록으로 복귀 가능.
  - **목표가 근접 종목 강조 (Urgent Highlighting)**:
    - 목표가(상한/하한) 대비 **5% 이내** 근접한 종목을 붉은색/푸른색 및 '🔥' 아이콘으로 시각적 강조.
    - 툴팁에 'Limit 5%' 배지 및 남은 거리 강조 표시.
- **Build Time**: 2026-02-10 19:32:00

## [Alpha V1.140] - 2026-02-10 19:16:00

### 13. 포트폴리오 업종별 분석 기능 추가
- **Summary**: 포트폴리오 구성 원그래프에 '업종별 보기' 기능 추가.
- **Detail**:
  - **뷰 모드 토글**: '종목별' 보기와 '업종별' 보기를 전환할 수 있는 버튼 추가.
  - **업종별 집계**: 보유 종목을 업종(Sector) 기준으로 통합하여, 업종별 자산 비중을 파이차트와 리스트로 확인 가능.
  - **데이터 시각화**: 업종별 총 평가금액 및 비중(%)을 시각적으로 제공하여 포트폴리오 분산 투자 현황 파악 용이.
- **Build Time**: 2026-02-10 19:16:00

## [Alpha V1.139] - 2026-02-10 18:55:00

### 12. 내 주식 인사이트 UI 추가 개선
- **Summary**: 목표가 그래프 시인성 강화 및 필터링 적용.
- **Detail**:
  - **필터링**: 목표가와의 거리가 **30% 이내**인 종목만 그래프에 표시하여 긴급한 항목에 집중하도록 개선.
  - **스케일 고정**: 그래프의 가로축 최대값을 **30%**로 고정하여 종목 간 거리 비교를 직관적으로 변경.
  - **레이아웃**: 항목당 높이를 **50px**로 줄여 더 많은 정보를 한 화면에 표시 (Compact Layout).
  - **텍스트**: 종목명을 **굵게(Bold)** 표시하고, 긴 종목명은 **2줄**로 줄바꿈 처리하여 가독성 확보 (말줄임표 적용).
- **Build Time**: 2026-02-10 18:55:00

## [Alpha V1.138] - 2026-02-10 18:40:00

### 11. 내 주식 인사이트 UI 2차 개선
- **Summary**: 사용자 피드백 반영 (목표가 그래프 확장, 포트폴리오 파이차트 상세화).
- **Detail**:
  - **목표가 그래프**: 상한/하한 목표 달성 그래프의 세로 길이를 데이터 개수에 맞춰 유동적으로 늘려, 스크롤 없이 모든 종목을 시원하게 볼 수 있도록 개선 (항목당 100px 확보).
  - **포트폴리오 구성**:
    - **분석 대상 확대**: 파이차트의 개별 표시 항목을 상위 5개 → **상위 10개**로 확대하고 나머지는 '기타'로 통합 (Total 11 Slices).
    - **시인성 강화**: 차트 컨테이너 높이를 500px로 늘리고, 도넛 차트의 두께와 크기(Radius 120/180)를 대폭 키워 가독성 향상.
    - **범례 제거**: 우측 리스트와 중복되는 하단 범례를 제거하여 깔끔한 레이아웃 구현.
- **Build Time**: 2026-02-10 18:40:00

## [Alpha V1.137] - 2026-02-10 18:35:00

### 10. 내 주식 인사이트 UI 개선
- **Summary**: 포트폴리오 차트 및 목표가 분석 그래프 시인성 개선.
- **Detail**:
  - **포트폴리오 구성**: 상위 종목 분석 대상을 5개에서 10개로 확대, 원형 차트 크기 확대 및 중복 범례 제거.
  - **목표가 분석**: 그래프 높이 제한을 해제하고 종목 수에 따라 세로로 길게 확장되도록 변경 (스크롤 없이 전체 조회).
- **Build Time**: 2026-02-10 18:35:00

## [Alpha V1.136] - 2026-02-10 14:30:00

### 9. 주식 상세 모달 및 차트/거래내역 개선
- **Summary**: 상세 모달 UI/UX 개선 및 해외주식 차트 연동 강화.
- **Detail**:
  - **업종 표시**: 모달 헤더에 `[종목코드] | [시장] | [업종명]` 포맷 적용.
  - **모달 유지**: 거래내역 추가/수정 시 전체 화면이 리로딩되지 않고 모달 상태를 유지하며 데이터만 갱신 (UX 개선).
  - **해외 차트**: 해외주식(US) 일별 차트 데이터 연동 로직 추가 (Missing Data Fix).
  - **거래내역 관리**: 오조작 방지를 위해 목록에서 삭제 버튼 제거, 수정 모드 진입 시에만 삭제 기능 활성화.
- **Build Time**: 2026-02-10 14:30:00

## [Alpha V1.135] - 2026-02-10 14:15:00

### 8. 업종명 표시 개선 (내 주식일지)
- **Summary**: `[종목코드] | [시장] | [업종명]` 포맷 적용 (Portfolio)
- **Detail**:
  - '내 주식일지' 페이지의 종목 카드에도 업종명(KOSPI 공식 분류) 표시 적용
  - 신규 종목 추가 시 업종 정보를 자동 조회하여 저장
  - 기존 종목은 시세 조회 시 자동 업데이트 및 표시
- **Build Time**: 2026-02-10 14:15:00

## [Alpha V1.134] - 2026-02-10 14:05:00

### 🚀 Feature: 업종 표시 포맷(KOSPI 분류) 개선
- **Summary**: 종목별 업종 정보의 정확도를 높이고 표시 포맷을 표준화.
- **Detail**:
  - **포맷**: 종목명 하단에 `[종목코드] | [시장구분] | [업종명]` 형태로 정보 표시.
  - **데이터 연동**: KIS API 실시간 연동을 통해 정확한 KOSPI 업종명(예: 전기전자, 의약품 등)을 조회하여 표시.
  - **자동 업데이트**: 종목 추가 시 업종 정보를 자동 저장하며, 기존 등록된 종목도 시세 연동 시 업종명을 최신화.
- **Build Time**: 2026-02-10 14:05:00

## [Alpha V1.133] - 2026-02-10 13:45:00

### 🚀 Feature: 관심종목 개별 삭제 기능 추가
- **Summary**: 그룹 내 개별 종목을 삭제할 수 있는 기능 추가.
- **Detail**:
  - **종목 삭제**: 각 종목 카드(`SectorRowItem`) 우측 상단에 삭제(X) 버튼을 추가.
  - **UX**: 마우스 오버 시 삭제 버튼이 나타나며, 실수 방지를 위해 Confirm 대화상자를 거쳐 삭제됨.
- **Build Time**: 2026-02-10 13:45:00

## [Alpha V1.132] - 2026-02-10 13:25:00

### 🚀 Feature: 관심종목 그룹 관리 기능 고도화
- **Summary**: 그룹명 수정 팝업 추가 및 혼합 마켓(KR/US) 시세 동시 조회 지원.
- **Detail**:
  - **그룹 수정**: '그룹 설정(연필 아이콘)' 팝업을 통해 그룹명 수정 및 삭제 기능 통합.
  - **데이터 로딩**: `SectorWatchList`가 종목별 시장(KR/US)을 자동 감지하여 각각의 시세 API를 호출하도록 개선.
    - 이를 통해 종목 추가 시 즉시 시세 정보가 로딩되며, 하나의 그룹에 한국/미국 주식을 섞어서 관리 가능.
  - **UI 개선**: 실수로 삭제하는 것을 방지하기 위해 그룹 삭제 버튼을 수정 팝업 내부로 이동.
- **Build Time**: 2026-02-10 13:25:00

## [Alpha V1.131] - 2026-02-10 12:50:00

### 🔄 Build Update
- **Summary**: 일일체크 페이지 종목 표시 개선 및 관심종목 DB 연동
- **Detail**:
  - **종목 표시**: `[코드] | [시장] | [업종]` 형식으로 변경하여 정보 가독성 개선.
  - **모달 비활성화**: 일일체크 페이지 종목 클릭 시 상세 모달이 뜨지 않도록 수정.
  - **관심종목 개편**: 로컬 스토리지 -> **Supabase DB**로 마이그레이션하여 기기 간 동기화 지원.
  - **그룹 관리**: 사용자가 '관심종목' 전용 그룹을 최대 3개까지 생성 및 삭제 가능.
  - **종목 추가**: 검색 모달(`StockSearchModal`)에서 추가할 대상 그룹 선택 기능 구현.
- **Build Time**: 2026-02-10 12:50:00

## [Alpha V1.130] - 2026-02-10 12:10:00

### 💄 Style: KOSPI 업종 차트 위치 및 가독성 개선
- **Summary**: KOSPI 업종 차트 위치 이동 및 폰트 크기 확대.
- **Detail**:
  - **위치 이동**: 해외지수/마켓트렌드 섹션 아래로 이동 (가독성 확보)
  - **텍스트 확대**: X축 범례, 바 값 라벨, 하단 테이블 폰트 크기 대폭 확대 (`text-sm`)
  - **차트 높이**: 280px → 350px로 확대하여 시인성 개선
- **Build Time**: 2026-02-10 12:10:00



### 🚀 Feature: KOSPI 업종별 등락률 Bar Chart (HTS 0218)
- **Summary**: HTS 0218 스타일 KOSPI 업종 Bar Chart 추가. 25개 업종 실시간 등락률 시각화.
- **Detail**:
  - KIS `inquire-index-price` API(FHPUP02100000)로 25개 업종 데이터 조회
  - 상승(빨강)/하락(파랑) 양방향 바 차트 + 0기준선
  - 하단 3컬럼 범례 테이블: 업종명, 지수, 등락률
  - 위치: 지수종합(KOSPI/KOSDAQ) 아래, 해외/마켓트렌드 위
  - 업종: 종합, 대형주, 중형주, 소형주, 음식료·담배, 섬유·의류 등 25개
- **Build Time**: 2026-02-10 11:55:00



### 🔧 Fix: 배당수익률 데이터 연동 (Naver Finance API)
- **Summary**: 배당수익률 0 하드코딩 문제 해결. Naver Finance API로 실제 배당수익률 데이터 조회.
- **Detail**:
  - **원인 분석**: KIS API 6개 엔드포인트 모두 배당수익률 필드 미제공 확인
  - **해결**: Naver Finance mobile API(`dividendYieldRatio` 필드)에서 실제 배당수익률 조회
  - **병렬 호출**: KIS 재무 API 3건 + Naver 배당 API 1건을 동시 호출하여 성능 최적화
  - **UI**: 결과 테이블에 배당률 컬럼 추가 (amber 색상으로 강조)
- **Build Time**: 2026-02-10 10:30:00



### 🚀 Feature: SSE 스트리밍 조건검색 + 전체 종목 분석 로딩 UI
- **Summary**: 실시간 진행률 표시 로딩 화면 추가 및 재무분석 종목 수 제한 해제.
- **Detail**:
  - **SSE 스트리밍**: Server-Sent Events로 검색 진행 상황을 실시간 전송
  - **로딩 UI**: 프로그레스바 + 스피너 + 현재까지 발견된 종목 수 실시간 표시
  - **제한 해제**: MAX_FINANCIAL_FETCHES 제한 제거, 1차 필터 통과 종목 전체 재무분석
  - **장중 병합**: 라이브 랭킹 API(~168개) + fallback 리스트(200개) 병합으로 300개+ 커버
- **Build Time**: 2026-02-10 09:18:00



### 🚀 Feature: 조건검색 KOSPI 전체 범위 확장
- **Summary**: 조건검색 범위를 상위 50개에서 KOSPI 전체 종목으로 확장.
- **Detail**:
  - **장중**: 랭킹 API가 반환하는 전체 종목 사용 (limit 제거)
  - **장외**: fallback 종목 리스트를 50개에서 200개로 확대 (전 섹터 커버)
  - **2단계 필터링**: 1차에서 PER/PBR/시가총액/거래량 사전 필터링 → 2차에서 통과 종목만 재무 API 호출 (최대 100개)
  - **메타 정보 반환**: 총 후보, 1차필터 통과, 재무분석 처리, 최종 매칭 건수 표시
  - **병렬 처리**: 재무 API 호출을 5개씩 병렬 처리하여 응답 속도 개선
- **Build Time**: 2026-02-10 08:20:00



### 🚀 Feature: 조건검색 10개 항목 확장 및 프리셋 저장
- **Summary**: 조건검색 UI를 10개 필터 항목으로 확장하고, 사용자별 조건 프리셋 저장/불러오기 기능 추가.
- **Detail**:
  - **조건 항목 확장**: 매출액증가율, 영업이익증가율, ROE, PEG, PER, PBR, 부채비율, 배당수익률, 시가총액, 거래량
  - **프리셋 저장**: Supabase `condition_presets` 테이블을 통한 사용자별 CRUD (RLS 적용)
  - **백엔드**: `ranking/simple` API에 10개 범위 필터 파라미터 추가, ROE(`roe_val`) 추출, PEG 계산
  - **프론트엔드**: 5열 그리드 조건 입력, 프리셋 태그 버튼, 확장된 11열 결과 테이블
- **Build Time**: 2026-02-10 07:55:00



### 🐛 Critical Fix: 조건검색 장외 시간 데이터 미조회 해결
- **Summary**: 장 마감 후(15:30~09:00) 조건검색이 작동하지 않던 근본 원인 해결.
- **Detail**:
  - **근본 원인 1**: KIS 시가총액 랭킹 API(`FHPST01730000`)가 장외 시간에 `rt_cd: ""`와 `output: undefined`를 반환하여 빈 배열 리턴.
  - **해결책**: 사전 정의된 KOSPI 상위 50종목을 개별 조회하는 **Fallback 모드** 구현. 장 운영 시간에는 기존 랭킹 API, 장외에는 개별 조회 자동 전환.
  - **근본 원인 2**: 재무 데이터 API 호출 시 파라미터명 대소문자 불일치(`fid_input_iscd` → `FID_INPUT_ISCD`) 및 응답 필드명 매핑 오류.
  - **수정**: `FID_DIV_CLS_CODE=0` → `1`(연간), 필드명을 실제 API 응답 기준으로 교정(`opr_pft_grs` → `bsop_prfi_inrt`, `sales_grs` → `grs`, `opr_pft_rt` → `sale_totl_rate`).
- **Build Time**: 2026-02-10 07:45:00



### 📈 Feature: Investment Opinion (HTS 0640) Integration
- **Summary**: Added 'Investment Opinion' section to Condition Search page.
- **Detail**:
  - **Feature**: 조건검색 페이지 상단에 **투자의견 (HTS 0640)** 조회 기능 추가.
  - **API**: `/api/kis/invest-opinion` 엔드포인트 신설 및 KIS API(`FHKST663300C0`) 연동.
  - **UI**: 종목코드 입력 시 최근 1년간의 증권사 투자의견, 목표가, 작성자 정보를 테이블 형태로 제공.
  - **Default**: 페이지 진입 시 **삼성전자(005930)** 데이터를 기본 조회하여 사용자 편의성 제공.
- **Build Time**: 2026-02-09 23:30:00

## [Alpha V1.123] - 2026-02-09 23:58:00

### 🐛 Fix: 조건검색 API 엔드포인트 수정 (근본 원인 해결)
- **Summary**: 잘못된 KIS API 엔드포인트를 수정하여 조건검색이 정상 동작하도록 수정.
- **Detail**:
  - **근본 원인**: `FHPST01740000`(`quotations/market-cap`) 대신 검증된 `FHPST01730000`(`ranking/market-cap`) 사용.
  - **코드 개선**: 검증된 `getMarketCapRanking()` 함수를 재사용하도록 리팩토링.
- **Build Time**: 2026-02-09 23:58:00

## [Alpha V1.122] - 2026-02-09 23:55:00

### ⚡ Performance: Condition Search Optimization
- **Summary**: Optimized API performance to prevent 500 errors (Timeouts).
- **Detail**:
  - **Rate Limiter**: Relaxed throttling to allow up to ~20 requests/sec (previously ~3 req/sec).
  - **Concurrency**: Increased parallel processing for financial data fetching.
  - **Stability**: Enhanced error handling for individual stock data failures.
- **Build Time**: 2026-02-09 23:55:00

## [Alpha V1.121] - 2026-02-09 23:35:00

### 🐛 Fix: Condition Search 500 Error
- **Summary**: Fixed API crash in Condition Search (HTS 0330).
- **Detail**:
  - **Backend**: Rewrote `ranking/simple` API to robustly handle range parameters and KIS API errors.
  - **Revenue**: Added missing `minRevenue` filtering logic.
  - **Stability**: Added safety checks for `fetchFinancials` to prevent server errors.
- **Build Time**: 2026-02-09 23:35:00

## [Alpha V1.120] - 2026-02-09 23:20:00

### 🚀 Feature: HTS 0330 Range Search
- **Summary**: Upgraded Condition Search to use Range (Min/Max) filters.
- **Detail**:
  - **New UI**: Replaced sliders with Min/Max input fields for precise filtering.
  - **Cleanup**: Removed old "Condition 1" section.
  - **Reliability**: Improved backend error handling for search results.
- **Build Time**: 2026-02-09 23:20:00

## [Alpha V1.119] - 2026-02-09 23:05:00

### 🚀 Feature: HTS 0330 Enhanced Filters
- **Summary**: Added Revenue and Dividend Yield support.
- **Detail**:
  - **Revenue**: Added "Min Revenue" slider and column.
  - **Dividend**: Added Dividend Yield (currently placeholder until API confirmation) column.
  - **Format**: Improved number formatting (e.g. 1,000억).
- **Build Time**: 2026-02-09 23:05:00

## [Alpha V1.118] - 2026-02-09 22:55:00

### 🚀 Feature: HTS 0330 Condition Search
- **Summary**: Implemented simple condition search functionality.
- **Detail**:
  - **Ranking**: Filter by Op Margin, Growth, Debt, PER.
  - **Data**: Real-time KIS API integration for 5 key metrics.
  - **UI**: Added sliders for condition adjustment.
- **Build Time**: 2026-02-09 22:55:00

## [Alpha V1.117] - 2026-02-09 22:50:00

### 🐛 Fix: Condition Search
- **Summary**: Fixed layout and search logic issues in Condition Search page.
- **Detail**:
  - **Layout**: Missing `SidebarLayout` applied.
  - **Logic**: Lowered default Market Cap filter to 100 Billion KRW (1000억) to ensure results.
  - **Debug**: Added detailed logs to troubleshoot API data mapping.
- **Build Time**: 2026-02-09 22:50:00

## [Alpha V1.116] - 2026-02-09 22:20:00

### 📊 Feature: Portfolio Composition Analysis
- **Summary**: Added 'Portfolio Composition' block to Stock Insights.
- **Detail**:
  - **Pie Chart**: 보유 자산의 평가금액 비중을 도넛 차트로 시각화.
  - **Top 5 List**: 평가금액 또는 수익률 기준으로 상위 5개 종목을 리스팅.
  - **Filters**: 국내/해외/전체 및 금액순/수익률순 필터링 기능 제공.
- **Build Time**: 2026-02-09 22:20:00

## [Alpha V1.115] - 2026-02-09 21:50:00

### 🚨 UX Enhancement: Urgent Target Highlight
- **Summary**: Visually emphasize targets within 10% range.
- **Detail**:
  - **Visual**: 목표가까지 남은 거리가 **10% 미만**인 경우 막대 그래프를 **진한 색상(Opacity 100%)**과 **금색 테두리(Gold Stroke)**로 강조.
  - **Purpose**: 매수(하한) 또는 매도(상한) 타이밍이 임박했음을 시각적으로 알림.
- **Build Time**: 2026-02-09 21:50:00

## [Alpha V1.114] - 2026-02-09 21:40:00

### 📊 Feature: Stock Insights UX Improvements
- **Summary**: Improved chart layout and interaction for Target Price Proximity.
- **Detail**:
  - **Layout**: 기존 탭(Tab) 방식에서 **상한/하한 목표 블록 분리(Grid)** 방식으로 변경하여 두 정보를 한 눈에 파악 가능.
  - **Interaction**: 차트(막대/라벨) 클릭 시 **[종목 상세 모달]**이 호출되어 즉시 상세 분석 가능.
- **Build Time**: 2026-02-09 21:40:00

## [Alpha V1.113] - 2026-02-09 21:15:00

### 📊 Feature: Split Target Graphs (Lower/Upper)
- **Summary**: Separated target proximity charts into 'Lower Target' and 'Upper Target' tabs.
- **Detail**:
  - **Tabs**: [⬇️ 하한 목표]와 [⬆️ 상한 목표] 탭을 도입하여, 각 목표가에 대한 근접도를 독립적으로 확인 가능.
  - **Sort**:
    - 하한 목표: 현재가가 하한가에 가까운 순서(위험/매수기회)로 정렬.
    - 상한 목표: 현재가가 상한가에 가까운 순서(달성/매도기회)로 정렬.
  - **Visual**: 기존 Diverging Bar Chart 대신, 남은 거리를 직관적으로 보여주는 Simple Bar Chart로 변경.
  - **Filter**: 각 탭 선택 시 해당 목표가가 설정된 종목만 필터링하여 표시.
- **Build Time**: 2026-02-09 21:15:00

## [Alpha V1.112.2] - 2026-02-09 21:00:00

### 🚑 Hotfix: API Data Access & Crash
- **Summary**: Fix critical bug where price data was not read correctly, causing 'Price 0' and app crash.
- **Detail**:
  - **Issue**: API 응답이 이미 언랩핑(`output` 제거됨)된 상태이나, 프론트엔드에서 `data.output`을 참조하여 데이터가 `undefined`로 처리됨. 이로 인해 가격이 0으로 인식되고, 디버그 로그 출력 시 `slice` 메서드 호출 에러 발생.
  - **Fix**: 
    1. `data.output.stck_prpr` -> `data.stck_prpr` (직접 참조)로 수정하여 정상 가격 로딩.
    2. 디버그 로그 출력 시 `undefined` 데이터에 대한 안전장치(`JSON.stringify(data || {})`) 추가.
- **Build Time**: 2026-02-09 21:00:00

## [Alpha V1.112.1] - 2026-02-09 20:45:00

### 🚑 Hotfix: Price Fetching (Zero Price)
- **Summary**: Fix 'Price returns 0' issue on Stock Insights page.
- **Detail**:
  - **Issue**: 장 종료 후 또는 특정 상황에서 현재가(`stck_prpr` / `last`)가 0으로 반환되어 차트에서 제외되는 현상.
  - **Fix**: 현재가가 0일 경우 전일 종가(`stck_sdpr` / `base`)를 대체 가격으로 사용하여 차트 표시 보장.
  - **Debug**: 가격이 여전히 0일 경우 Raw Data를 로그에 남겨 원인 파악 용이하게 함.
- **Build Time**: 2026-02-09 20:45:00

## [Alpha V1.112] - 2026-02-09 19:38:00

### 📊 Feature: Stock Insights (Target Proximity)
- **Summary**: Added 'Stock Insights' page with 'Target Price Proximity' block.
- **Detail**:
  - **New Page**: `내 주식 인사이트` (/insights) 페이지 추가.
  - **Feature**: 보유 종목의 하한/상한 목표가 근접도를 시각화 (Diverging Bar Chart).
  - **Logic**: 목표가까지 남은 거리가 가까울수록 막대가 길어지며, 중앙(0%)에 가까운 순서대로 정렬됨.
  - **Loading**: 전체 데이터 로딩 후 그래프 표출 (Progressive Loading UI 적용: "삼성전자 조회 중...").
  - **Filter**: 보유 수량이 0인 종목(매도 완료)은 차트 및 데이터 조회 대상에서 제외.
  - **Debug UI**: 데이터 제외 사유(목표가 미설정, API 오류, 보유량 0 등)를 상세 리포트로 제공하여 사용자 혼란 방지.
  - **Real-time**: WebSocket 실시간 시세 연동. (장외 시간 대비 초기 데이터 Fetching 로직 추가)
- **Build Time**: 2026-02-09 19:38:00

## [Alpha V1.111] - 2026-02-09 16:00:00

### 🎨 UI/UX: Rename & Enhance Button
- **Summary**: Renamed 'Index Comparison' to 'Index Return Comparison' and improved button design.
- **Detail**:
  - **Terminology**: 기능 명칭을 "지수대비 수익률 비교"로 변경하여 목적을 명확히 함.
  - **Button**: 텍스트 링크 형태에서 **배경이 채워진 버튼(Solid Button)** 형태로 변경하여 가시성과 클릭 영역 확보.
  - **Modal**: 모달 타이틀도 "지수대비 수익률 비교"로 통일.
- **Build Time**: 2026-02-09 16:00:00

## [Alpha V1.110] - 2026-02-09 15:50:00

### 🔧 Fix: Manual KOSPI Input
- **Summary**: Allow manual editing of KOSPI index in trade logs.
- **Detail**:
  - **Display**: 거래내역 목록에서 KOSPI 지수가 없을 경우 '-' 대신 수동 입력된 값을 우선 표시하도록 수정.
  - **UI**: KOSPI 입력 필드를 메모 필드와 분리하고 스타일을 개선하여 입력 가능함을 명확히 함.
  - **Logic**: 자동 조회(Auto-fetch) 실패 시 기존에 입력된 수동 값을 덮어쓰지 않도록 보호 로직 적용.
- **Build Time**: 2026-02-09 15:50:00

## [Alpha V1.109] - 2026-02-09 15:35:00

### 📊 Feature: Index Comparison Columns
- **Summary**: Added 'Quantity' and 'Total Amount' to Index Comparison Modal.
- **Detail**:
  - **Columns**: 거래내역 비교 테이블에 **수량(Quantity)** 및 **합계금액(Total Amount)** 컬럼 추가.
  - **Logic**: 각 거래별 `매수가 * 수량`을 계산하여 총 매수 금액을 표시, 투자 규모 파악 용이.
- **Build Time**: 2026-02-09 15:35:00

## [Alpha V1.108] - 2026-02-09 15:15:00

### 🎨 UX Improvement: Index Comparison Modal
- **Summary**: Refined the Index Comparison UI for better readability.
- **Detail**:
  - **Change**: 기존 인라인(Accordion) 방식에서 **별도의 오버레이 팝업(Overlay Modal)** 방식으로 변경.
  - **Benefit**:
    - **Spacing**: 좁은 공간에 구겨져 있던 테이블을 넓은 화면(Wide Layout)에서 편안하게 조회 가능.
    - **Clarity**: 글자 크기 확대 및 여백 확보로 데이터 가독성 대폭 향상.
    - **Focus**: 주변 요소(차트 등)에 방해받지 않고 비교 데이터에만 집중할 수 있는 환경 제공.
- **Build Time**: 2026-02-09 15:15:00

## [Alpha V1.107] - 2026-02-09 14:00:00

### 📈 Feature: Market Index Comparison
- **Summary**: Added market index comparison to Stock Detail modal.
- **Detail** :
  - **Feature**: '종목 상세 모달' 내 '평가손익' 하단에 **[▼ 지수변화 참조]** 버튼 추가.
  - **Logic**:
    - **Benchmark**: 해당 종목의 국가에 따라 벤치마크 지수(KR: KOSPI, US: S&P 500) 자동 설정.
    - **Comparison**: 매수 시점의 지수와 현재 지수 등락률을 계산하여, 내 주식 수익률과 시장 수익률을 1:1 비교.
  - **Table**: 거래 건별 매수가/현재가, 매수당시지수/현재지수, 주가변동률/지수변동률 상세 데이터 제공.
- **Build Time**: 2026-02-09 14:00:00

## [Alpha V1.106] - 2026-02-09 13:00:00

### 🎨 UI/UX: 포트폴리오 카드 레이아웃 고정
- **Summary**: 종목명 길이에 따른 카드 높이 불일치 해결 및 미국 주식 표기 개선.
- **Detail**:
  - **Layout**: 카드 헤더에 배경색 추가 및 높이 고정(`h-14`, `line-clamp-2`)으로 시각적 통일감 확보.
  - **Format**: 미국 주식인 경우 통화 기호(`$`) 표시 및 매입단가 정수 표기 적용.
  - **Grid**: 데이터 영역(매입금액, 평가손익)의 수직 정렬을 맞춰 가독성 개선.
- **Build Time**: 2026-02-09 13:00:00

## [Alpha V1.105] - 2026-02-09 12:45:00

### 🎨 UI/UX: 텍스트 간소화
- **Summary**: 매도 관련 용어 정리로 UI 가독성 개선.
- **Detail**:
  - '매도 하한 목표' -> '하한 목표'
  - '매도 상한 목표' -> '상한 목표'
- **Build Time**: 2026-02-09 12:45:00

## [Alpha V1.104] - 2026-02-09 12:15:00

### 🎨 UI/UX: 목표가 수익률 표시 개선
- **Summary**: 매도 목표가(상/하한) 설정 시 기대 수익률 배지 표시.
- **Detail**:
  - **Feature**: '종목 상세 모달창' 및 '내 주식에 메모하기' 카드의 목표가 입력 필드 옆에 수익률(%) 배지 추가.
  - **Logic**: (목표가 - 평균매입단가) / 평균매입단가 * 100
  - **Visual**: 수익(+)일 경우 빨간색, 손실(-)일 경우 파란색으로 구분하여 직관성 강화.
- **Build Time**: 2026-02-09 12:15:00

## [Alpha V1.103] - 2026-02-09 11:55:00

### 🚀 Feature: 전체 포트폴리오 재계산
- **Summary**: 기존 자산의 매입단가 미반영 문제를 해결하기 위한 일괄 재계산 기능 추가.
- **Detail**:
  - **Feature**: '내 주식에 메모하기' 섹션에 **[↻ 매입단가 전체 재계산]** 버튼 추가.
  - **Action**: 버튼 클릭 시 모든 보유 종목의 거래내역을 순차적으로 분석하여, 현재 보유 수량과 평균 매입단가를 정확하게 다시 계산하고 DB에 업데이트함.
  - **Effect**: 과거 데이터나 수동 입력으로 인해 틀어진 매입단가를 거래내역 기준으로 정상화.
- **Build Time**: 2026-02-09 11:55:00

## [Alpha V1.102] - 2026-02-09 11:40:00

### 🔄 Feature: 매입단가 자동 재계산
- **Summary**: 거래내역 변경 시 평균 매입단가(Moving Average) 자동 재계산 로직 적용.
- **Detail**:
  - **Logic**: 매수/매도 내역 추가, 수정, 삭제 시 해당 종목의 모든 거래 기록을 바탕으로 보유 수량과 매입단가를 처음부터 다시 계산하여 정확성 보장.
  - **Real-time**: 모달창 상단 매입단가 정보가 즉시 업데이트됨.
- **Build Time**: 2026-02-09 11:40:00

## [Alpha V1.101] - 2026-02-09 11:30:00

### 🚀 Feature: 기능 개선 및 UI 고도화
- **Summary**: 그래프 시각화, 거래내역 관리, 목표 설정 기능을 모두 개선.
- **Detail**:
  - **Graph**: 매입단가가 그래프 범위를 벗어날 경우 최상단/최하단에 고정 표시(▲/▼). 현재가 옆에 등락률 표시.
  - **Trade Log**: 
    - **KOSPI Auto-fill**: 거래 날짜 선택 시 해당 일자의 KOSPI 지수를 자동으로 조회하여 입력.
    - **Edit**: 기존 거래내역에 '수정(Edit)' 버튼 추가 (날짜, 수량, 가격 변경 가능).
  - **Goals**: 매도 목표가(상/하한) 입력 시, 매입가 대비 예상 수익률(%) 자동 계산 및 표시.
  - **DB**: `trade_logs` 테이블에 `kospi_index` 컬럼 정식 추가.
- **Build Time**: 2026-02-09 11:30:00

## [Alpha V1.100] - 2026-02-09 09:40:00

### 📊 Visualization: 종목 상세 차트 고도화
- **Summary**: 사용자 피드백을 반영하여 차트의 가독성과 정보 전달력을 대폭 개선
- **Detail**:
  - **Period**: 60일 → **30일**로 축소하여 최근 추세를 더욱 상세하게 확인 가능하도록 변경.
  - **Colors**: 이동평균선(5/20/60/120일)의 범례 색상과 실제 그래프 라인 색상을 정확히 일치시킴.
  - **Reference**: 차트 내에 **'매입단가'** 기준선(점선)을 추가하여 현재가와의 위치 비교를 직관적으로 제공.
  - **Alignment**: 하단 거래량 차트의 여백(Margin)과 Y축 공간을 상단 가격 차트와 정밀하게 일치시켜 시각적 왜곡(Misalign) 해결.
- **Build Time**: 2026-02-09 09:40:00

## [Alpha V1.099] - 2026-02-09 00:05:00

### 🐛 Bug Fix: KOSPI 지수 미표시 수정
- **Summary**: 거래내역에서 KOSPI 지수가 '-'로 표시되는 문제 해결
- **Detail**: KIS API의 지수 조회 응답 필드명이 주식(`stck_clpr`)과 다른 `bstp_nmix_prpr`임을 확인하고 매핑 로직을 수정.
- **Build Time**: 2026-02-09 00:05:00

## [Alpha V1.098] - 2026-02-08 23:55:00

### 🔧 Improvement: KOSPI 지수 날짜 로직 개선
- **Summary**: 한국 시간(KST) 새벽 거래 시 전일 KOSPI 데이터를 불러오지 못하는 문제 해결
- **Detail**: KOSPI 지수 조회 기간 설정 시 UTC가 아닌 KST(UTC+9) 기준으로 '오늘' 날짜를 계산하도록 로직 수정.
- **Build Time**: 2026-02-08 17:30:00

## [Alpha V1.097] - 2026-02-08 17:00:00

### ✨ New Feature: 거래내역 KOSPI 지수 연동
- **Summary**: 종목 상세 모달의 거래내역에서 각 거래일의 KOSPI 지수를 함께 표시
- **Detail**:
  - **API Update**: `/api/kis/index/domestic/[symbol]` API에 기간 조회(`startDate`, `endDate`) 기능 추가
  - **UI Update**: 종목 상세 모달 내 거래내역 테이블에 'KOSPI' 컬럼 추가 및 해당 일자의 KOSPI 종가 표시
- **Build Time**: 2026-02-08 17:00:00

## [Alpha V1.096] - 2026-02-08 16:15:00

### 🐛 Bug Fix: 거래내역 미표시 문제 수정
- **Summary**: 내 주식일지 상세 모달에서 거래내역이 보이지 않는 현상을 수정
- **Detail**:
  - **Data Fetching**: `fetchPortfolio` 함수에서 포트폴리오 데이터 조회 시 `trade_logs` 테이블을 조인(Join)하지 않아 데이터가 누락되던 문제를 해결.
  - **Mapping**: 가져온 거래내역 데이터를 `Asset` 객체의 `trades` 속성에 올바르게 매핑하고 날짜 내림차순으로 정렬.
- **Build Time**: 2026-02-08 16:15:00

## [Alpha V1.095] - 2026-02-08 15:30:00

### 🐛 Bug Fix: 조건검색 API 404 오류 수정
- **Summary**: 조건검색 시 'API Limit or Error' 메시지가 발생하는 문제(404 Not Found)를 수정하고 에러 핸들링을 개선
- **Detail**:
  - **Route Refactoring**: `/api/kis/ranking/market-cap` → `/api/kis/ranking?type=market-cap` 으로 경로 구조 단순화
  - **Dynamic Configuration**: `export const dynamic = 'force-dynamic'` 옵션을 추가하여 정적 빌드 시점의 오류 방지 및 런타임 실행 보장
  - **Error Messaging**: Frontend에서 API 오류 발생 시 상태 코드(Status Code)와 상세 메시지를 표시하도록 개선하여 정확한 원인 파악 가능
- **Build Time**: 2026-02-08 15:30:00

## [Alpha V1.094] - 2026-02-08 14:45:00

### ✨ Feature: 조건검색 (Condition Search) 기능 추가
- **Summary**: 사용자가 원하는 재무 조건(시가총액, PER, ROE)을 설정하여 KOSPI 우량주를 발굴할 수 있는 검색 페이지 추가
- **Detail**:
  - **New Page**: `/condition-search` (사이드바에서 접근 가능)
  - **Dynamic Filtering**: 다중 조건 추가 및 상세 범위 설정 기능 구현
  - **Data Source**: KIS 시가총액 순위 API(`FHPST01730000`)를 기반으로 후보군을 선정하고, 현재가 배치 조회(`inquire-price`)를 통해 PER/ROE 등 상세 지표를 확보하여 필터링 수행.
  - **Ranking**: 검색 결과는 시가총액, 거래량, PER, ROE 등 주요 지표와 함께 테이블 형태로 제공.
- **Build Time**: 2026-02-08 14:45:00

## [Alpha V1.093] - 2026-02-08 13:30:00

### 🚀 UX Enhancement: 포트폴리오 실시간 주가 로딩 최적화
- **Summary**: 보유 주식이 많을 경우 화면 끊김 현상을 방지하기 위해 주가 조회 방식을 개선
- **Detail**:
  - **Batch Processing**: 실시간 현재가 조회를 한 번에 수행하지 않고, 6개씩(3x2 그리드 기준) 나누어 순차적으로 조회하도록 변경 (`chunkSize: 6`).
  - **Prioritization**: 화면 상단에 위치한 최신 등록 주식부터 우선적으로 조회되도록 요청 순서를 최적화 (Reverse Order).
  - **Result**: 포트폴리오 페이지 진입 시 상단 아이템의 가격이 빠르게 표시되며, 스크롤에 따라 자연스럽게 데이터가 업데이트됨.
- **Build Time**: 2026-02-08 13:30:00

## [Alpha V1.092] - 2026-02-08 12:45:00

### 🚑 Critical Fix: 로그인 후 데이터 로딩 누락 수정
- **Summary**: 로그인 직후 "내 주식일지" 페이지에 데이터가 표시되지 않는 치명적 버그 수정
- **Detail**:
  - **Bug**: `PortfolioContext`가 이미 사용자 정보(`initialUser`)를 가지고 있을 때, 중복 호출 방지를 위해 데이터 페칭(`fetchPortfolio`)까지 건너뛰는 로직 오류가 있었음.
  - **Fix**: 사용자 정보가 있더라도 데이터 로딩은 항상 수행하도록 변경.
  - **Result**: 로그인 직후 또는 페이지 이동 시 항상 최신 포트폴리오 데이터를 불러옴.
- **Build Time**: 2026-02-08 12:45:00

## [Alpha V1.091] - 2026-02-08 11:30:00

### 🐛 Bug Fix: 포트폴리오 화면 로딩 상태 유지 버그 수정
- **Summary**: "내 주식일지" 페이지에서 스켈레톤 로더가 사라지지 않는 문제 해결
- **Detail**:
  - **Issue**: `PortfolioContext` 초기화 최적화 로직에서, 사용자 정보가 이미 존재하는 경우(`initialUser` 매칭) `loadingMessage`만 해제하고 `isLoading` 상태를 `false`로 변경하지 않음.
  - **Fix**: `initialUser` 매칭 시 `setIsLoading(false)`를 명시적으로 호출하여 데이터 로딩 완료 상태로 전환.
  - **Result**: 페이지 진입 시 정상적으로 데이터 목록이 표시됨.
- **Build Time**: 2026-02-08 11:30:00

## [Alpha V1.090] - 2026-02-08 10:25:00

### 🐛 Bug Fix: 로딩 화면 무한 로딩 수정
- **Summary**: 로그인 직후 또는 새로고침 시 "회원 정보를 불러오는 중..." 화면에서 멈추는 현상 해결
- **Detail**:
  - **Issue**: `PortfolioContext` 초기화 시, 이미 동기화된 상태(`user.id === initialUser.id`)인 경우 로딩 메시지를 해제하는 로직이 누락됨.
  - **Fix**:
    1. `initialUser` 매칭 시 `loadingMessage`를 즉시 `null`로 초기화.
    2. `fetchPortfolio` 호출을 `try/finally`로 감싸 예외 발생 시에도 로딩 메시지 해제 보장.
  - **Result**: 어떤 상황에서도 로딩 화면이 적절한 시점에 사라지고 앱 화면으로 진입함.
- **Build Time**: 2026-02-08 10:25:00

## [Alpha V1.089] - 2026-02-08 09:30:00

### ⚡ Performance: 로그인 직후 데이터 동기화 최적화
- **Summary**: 로그인 후 포트폴리오 페이지 진입 시 데이터가 로드되지 않는 문제 해결
- **Detail**:
  - **Fix**: `PortfolioContext`가 Server Component(`layout.tsx`)로부터 전달받은 최신 `initialUser` 정보를 즉시 감지하도록 수정 (React State 동기화 문제 해결).
  - **UX**: 데이터 로딩 중 "회원 정보를 불러오는 중...", "내 주식일지를 불러오고 있습니다..." 등 상세 메시지를 표시하여 안정감 제공.
  - **Result**: 새로고침 없이도 로그인 직후 내 주식일지 데이터가 즉시 로드됨.
- **Build Time**: 2026-02-08 09:30:00

## [Alpha V1.088] - 2026-02-08 00:30:00

### ⏳ UX Improvement: 로딩 화면 메시지 개선
- **Summary**: 초기 로딩 시 진행 상황을 알 수 있도록 단계별 메시지 표시
- **Detail**:
  - **Feature**: `FullPageLoader`를 전역(`PortfolioContext`)으로 적용하고, 데이터 로딩 상태에 따라 메시지 업데이트.
  - **Messages**:
    - "사용자 정보를 확인하고 있습니다..."
    - "로그인 정보를 동기화하고 있습니다..."
    - "나의 주식 목록을 불러오고 있습니다..."
  - **Benefit**: 로그인 직후 또는 새로고침 시 빈 화면 대신 명확한 진행 상태를 보여주어 사용자 경험 개선.
- **Build Time**: 2026-02-08 00:30:00

## [Alpha V1.087] - 2026-02-08 00:00:00

### 🔄 Auth Upgrade: 로그아웃 Server Action 전환
- **Summary**: 로그아웃 로직을 로그인과 동일한 Server Action 방식으로 변경
- **Detail**:
  - **New Feature**: `signout` Server Action 도입 (`src/app/login/actions.ts`)
  - **UX**: 로그아웃 시 클라이언트 상태 즉시 초기화(Optimistic UI) 후 서버 측 쿠키 제거 및 리다이렉트 수행
  - **Security**: 브라우저 쿠키를 확실하게 제거하여 보안성 강화
- **Build Time**: 2026-02-08 00:00:00

## [Alpha V1.086] - 2026-02-08 23:30:00

### 🐛 Critical Bug Fix: 로그인 세션 동기화
- **Summary**: `client.ts` 인증 스토리지 설정을 쿠키 기반으로 변경
- **Detail**:
  - **Issue**: `client.ts`가 `localStorage`를 강제하고 있어, Server Action 로그인(쿠키 설정) 결과를 클라이언트가 인식하지 못함. 이로 인해 로그인 직후 "내 주식일지" 데이터가 보이지 않음.
  - **Fix**: `storage: window.localStorage` 및 `storageKey` 설정을 제거하여 `@supabase/ssr`의 기본값(Cookie)을 사용하도록 수정.
  - **Effect**: 이제 Server Action 로그인 -> 클라이언트 세션 동기화가 즉시 이루어지며, RLS 에러 없이 포트폴리오 데이터가 정상 조회됨.
- **Build Time**: 2026-02-08 23:30:00

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

## [Alpha V1.084] - 2026-02-08 22:00:00

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
- **Build Time**: 2026-02-08 22:00:00

## [Alpha V1.083] - 2026-02-08 21:45:00

### 🐛 Critical Bug Fix
- **Summary**: Replace useMemo with useRef for True Singleton
- **Detail**:
  - **Issue**: `useMemo`가 React 렌더링 사이클(특히 Strict Mode)에서 클라이언트를 여러 번 생성하여 AbortError 발생.
  - **Fix**: 
    - `useRef`로 변경하여 컴포넌트 생명주기 동안 단 한 번만 생성 보장
    - `supabaseRef.current`로 클라이언트 접근
  - **Expected**: 이제 클라이언트가 단 1번만 생성되고 AbortError가 사라질 것.
- **Build Time**: 2026-02-08 21:45:00

## [Alpha V1.082] - 2026-02-08 21:30:00

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
- **Build Time**: 2026-02-08 21:30:00

## [Alpha V1.081] - 2026-02-08 21:15:00

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
- **Build Time**: 2026-02-08 21:15:00

## [Alpha V1.080] - 2026-02-08 21:00:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error in PortfolioContext
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` line 172의 `onAuthStateChange` 콜백에서 `event`, `session` 파라미터 타입 미지정으로 빌드 실패.
  - **Fix**: `event: any`, `session: any` 타입 추가.
- **Build Time**: 2026-02-08 21:00:00

## [Alpha V1.079] - 2026-02-08 20:50:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error
- **Detail**:
  - **Issue**: `update-password/page.tsx`에서 `session` 파라미터 타입 미지정으로 빌드 실패.
  - **Fix**: `session` 파라미터에 `any` 타입 추가.
- **Build Time**: 2026-02-08 20:50:00

## [Alpha V1.078] - 2026-02-08 20:45:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Supabase Client Singleton Pattern
- **Detail**:
  - **Issue**: Supabase 쿼리 Promise가 영원히 resolve되지 않음. `useMemo`로 생성된 클라이언트가 매번 재생성될 가능성.
  - **Fix**: 
    - `client.ts`에 진정한 싱글톤 패턴 구현
    - `PortfolioContext`에서 singleton을 직접 import하여 사용
    - `useMemo` 제거
  - **Note**: 콘솔 로그에서 `[DEBUG] Query returned...`가 나타나지 않아 쿼리 hang 확인됨.
- **Build Time**: 2026-02-08 20:45:00

## [Alpha V1.077] - 2026-02-08 20:30:00

### 🔍 Debug Enhancement
- **Summary**: Add Console Logs for Browser Debugging
- **Detail**:
  - **Issue**: trade_logs 제거 후에도 쿼리가 완료되지 않음. 조인이 문제가 아님.
  - **Fix**: console.log 추가하여 브라우저 콘솔에서 Supabase 클라이언트 상태와 쿼리 실행 여부 확인.
  - **Note**: F12 Console 탭에서 [DEBUG] 로그 확인 필요.
- **Build Time**: 2026-02-08 20:30:00

## [Alpha V1.076] - 2026-02-08 20:15:00

### 🔍 Debug Test
- **Summary**: Remove trade_logs Join to Isolate Hang Issue
- **Detail**:
  - **Issue**: Supabase 쿼리가 `trade_logs` 조인 후 완료되지 않고 hang됨.
  - **Test**: `trade_logs` 조인을 임시 제거하고 `portfolios`만 조회하여 문제 원인 파악.
  - **Note**: 이는 임시 디버깅 버전. 성공 시 trade_logs를 별도 쿼리로 가져오도록 수정 예정.
- **Build Time**: 2026-02-08 20:15:00

## [Alpha V1.075] - 2026-02-08 20:00:00

### 🐛 Critical Bug Fix
- **Summary**: Fix Infinite useEffect Loop and Hanging Query
- **Detail**:
  - **Issue**: `fetchPortfolio`의 useCallback 의존성에 `supabase`가 포함되어 있어 fetchPortfolio가 변경될 때마다 useEffect가 재실행. 또한 Supabase 쿼리가 완료되지 않고 hang됨.
  - **Fix**: 
    - `useCallback`과 `useEffect` 의존성 배열을 `[]`로 변경하여 최초 1회만 실행
    - `finally` 블록에 `setIsInitialized(true)` 추가하여 초기화 보장
- **Build Time**: 2026-02-08 20:00:00

## [Alpha V1.074] - 2026-02-08 19:45:00

### 🔍 Debug Enhancement
- **Summary**: Add Detailed Debug Logs
- **Detail**:
  - **Issue**: `[Fetch] Starting` 이후 로그가 전혀 없어 문제 파악 불가.
  - **Fix**: Supabase 쿼리 실행 전후, 데이터 처리 과정에 상세 로그 추가.
- **Build Time**: 2026-02-08 19:45:00

## [Alpha V1.073] - 2026-02-08 19:30:00

### 🐛 Critical Bug Fix
- **Summary**: Fix useEffect Dependency Causing Abort Loop
- **Detail**:
  - **Issue**: `useEffect` 의존성 배열에 `isInitialized`가 포함되어 있어, 이 값이 변경될 때마다 useEffect가 재실행되면서 이미 진행 중인 fetch를 중단(abort)하고 새로운 fetch를 시작. 무한 abort 루프 발생.
  - **Fix**: `isInitialized`를 useEffect 의존성 배열에서 제거.
- **Build Time**: 2026-02-08 19:30:00

## [Alpha V1.072] - 2026-02-08 19:15:00

### 🐛 Critical Bug Fix
- **Summary**: Remove Timeout Causing AbortError
- **Detail**:
  - **Issue**: 10초 timeout이 너무 짧아서 68개 주식 + 거래기록 조인 쿼리가 완료되기 전에 abort됨. 모든 요청이 "AbortError: signal is aborted without reason"로 실패.
  - **Fix**: `abortSignal(AbortSignal.timeout(10000))` 제거. Supabase 자체 timeout에 의존.
- **Build Time**: 2026-02-08 19:15:00

## [Alpha V1.071] - 2026-02-08 19:00:00

### 🐛 Critical Bug Fix
- **Summary**: Fix fetchPort folio Hoisting Issue
- **Detail**:
  - **Issue**: `fetchPortfolio` 함수가 `useEffect` 이후에 정의되어 호이스팅 문제로 실행되지 않음. Force Refresh 시 로그만 표시되고 실제 데이터가 로딩되지 않는 문제.
  - **Fix**: `fetchPortfolio`를 `useCallback`으로 감싸고 `useEffect` 전에 정의. `useEffect` 의존성 배열에 `fetchPortfolio` 추가.
- **Build Time**: 2026-02-08 19:00:00

## [Alpha V1.070] - 2026-02-08 18:35:00

### 🚑 Build Fix
- **Summary**: Fix Duplicate Declarations & Missing Property
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 내 `fetchPortfolio`, `refreshPortfolio` 함수가 중복 선언되어 빌드 실패. 이후 Provider에서 `refreshPortfolio` 누락.
  - **Fix**: 중복된 함수 정의 제거 및 Provider value에 `refreshPortfolio` 추가.
- **Build Time**: 2026-02-08 18:35:00

## [Alpha V1.069] - 2026-02-08 18:25:00

### 🚑 Build Fix
- **Summary**: Fix Syntax Error in PortfolioContext
- **Detail**:
  - **Issue**: `refreshPortfolio` 추가 과정에서 닫는 괄호(`}`) 위치가 잘못되어 `return` 문이 함수 밖으로 밀려나는 문법 오류 발생.
  - **Fix**: 괄호 위치 수정 및 코드 구조 정상화.
- **Build Time**: 2026-02-08 18:25:00

## [Alpha V1.068] - 2026-02-08 18:05:00

### 🔍 Deep Debugging UI
- **Summary**: Expose Client-Side Logs
- **Detail**:
  - **Feature**: '내 주식일지' 페이지에 **실시간 디버그 로그(Client Debug Logs)** 창 추가.
  - **Purpose**: 데이터 로딩이 멈추거나 실패하는 정확한 단계(Fetch 시작, Supabase 응답, 에러 발생 등)를 시각적으로 확인.
  - **Action**: **[Force Refresh]** 버튼을 추가하여, 로딩이 멈췄을 때 수동으로 데이터 재요청 가능.
- **Build Time**: 2026-02-08 18:05:00

## [Alpha V1.067] - 2026-02-08 17:50:00

### 🛡️ Data Sync Safety Net
- **Summary**: Add Auto-Diagnostic UI for Data Sync
- **Detail**:
  - **Feature**: 클라이언트(`PortfolioClientPage`)에서 서버 데이터 개수(`serverCount`)와 실제 로드된 개수(`clientCount`)를 비교.
  - **UX**: 불일치 발생 시(서버엔 있는데 클라이언트에 없을 때) 붉은색 **'데이터 동기화 오류'** 경고 카드 표시.
  - **Action**: 사용자가 즉시 대응할 수 있도록 '페이지 새로고침' 및 '재로그인' 버튼 제공.
- **Build Time**: 2026-02-08 17:50:00

## [Alpha V1.066] - 2026-02-08 17:40:00

### 🚑 Build Fix
- **Summary**: Restore Missing Variable
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 수정 중 `totalInvested` 변수 선언이 누락되어 빌드 실패.
  - **Fix**: `totalInvested` 계산 로직 복구.
- **Build Time**: 2026-02-08 17:40:00

## [Alpha V1.065] - 2026-02-08 17:20:00

### 🎨 UX Upgrade: Global Loading
- **Summary**: Implement minimum 3s Loading Screen
- **Detail**:
  - **Feature**: '일일 체크' 및 '내 주식일지' 진입 시 최소 3초간 유지되는 **전체 화면 로딩(Full Page Loader)** 적용.
  - **Design**: "데이터를 불러오는 중입니다..." 문구와 애니메이션 아이콘이 포함된 중앙 정렬 로딩 화면.
  - **Purpose**: 데이터가 부분적으로 로드되거나 빈 화면이 깜빡이는 현상을 방지하고, 안정적인 로딩 경험 제공.
- **Build Time**: 2026-02-08 17:20:00

## [Alpha V1.064] - 2026-02-08 17:00:00

### 🐛 UI Loading Logic Fix
- **Summary**: Fix Premature Empty State
- **Detail**:
  - **Issue**: 사용자 세션이 서버에서 주입(`initialUser`)될 경우, 데이터 로딩이 시작되기도 전에 `isLoading`이 `false`로 설정되어 빈 화면("자산 없음")이 깜빡이거나 고정되는 문제.
  - **Fix**: 초기 `isLoading` 값을 무조건 `true`로 설정하여, 첫 데이터 패칭이 완료될 때까지 스켈레톤 UI가 유지되도록 수정.
- **Build Time**: 2026-02-08 17:00:00

## [Alpha V1.063] - 2026-02-08 16:45:00

### 🛡️ Client Stability Upgrade
- **Summary**: Fix `AbortError` in Portfolio Fetch
- **Detail**:
  - **Issue**: `PortfolioContext` 리렌더링 시 Supabase Client가 재생성되거나, 네트워크 상태에 따라 `fetch` 요청이 중단(`AbortError`)되는 현상.
  - **Fix**:
    1.  `useMemo`를 사용하여 Supabase Client 인스턴스를 메모이제이션 (싱글톤 유지).
    2.  `fetchPortfolio` 함수에 `retry` 로직을 추가하여 `AbortError` 또는 일시적 네트워크 오류 발생 시 최대 2회 자동 재시도.
- **Build Time**: 2026-02-08 16:45:00

## [Alpha V1.062] - 2026-02-08 16:25:00

### 🚑 Build Fix
- **Summary**: Fix Syntax Error in PortfolioContext
- **Detail**:
  - **Issue**: `PortfolioContext.tsx` 파일 내 `PortfolioContextType` 인터페이스 정의 중 중복된 닫는 중괄호(`}`)로 인한 빌드 파싱 에러 수정.
- **Build Time**: 2026-02-08 16:25:00

## [Alpha V1.061] - 2026-02-08 16:00:00

### 🔄 Auth Architecture Upgrade
- **Summary**: Implement Server-Side Session Hydration
- **Detail**:
  - **Issue**: 클라이언트 사이드 인증 로직(`supabase-js`)이 간헐적으로 세션을 감지하지 못해 "Guest" 상태로 머무는 현상.
  - **Fix**: `RootLayout`(Server Component)에서 안전하게 사용자 세션을 조회한 뒤, `PortfolioProvider` 초기값(`initialUser`)으로 주입(Hydration).
  - **Effect**: 앱 실행 즉시 로그인 상태가 보장되며, 불필요한 클라이언트 사이드 세션 체크 로직을 단축하여 초기 로딩 속도 향상.
- **Build Time**: 2026-02-08 16:00:00

## [Alpha V1.060] - 2026-02-08 15:45:00

### 🚑 Build Fix
- **Summary**: Fix PortfolioContext Type Error
- **Detail**:
  - **Issue**: V1.059 빌드 시 `PortfolioContextType`에 정의된 `debugLog` 속성이 Provider value에서 누락되었다는 타입 에러 발생.
  - **Fix**: `PortfolioContext.Provider`의 `value` 객체에 `debugLog`를 명시적으로 전달하도록 코드 수정 및 재적용.
- **Build Time**: 2026-02-08 15:45:00

## [Alpha V1.059] - 2026-02-08 15:30:00

### 🔬 Client-Side Deep Debugging
- **Summary**: Expose Client Fetch Logs
- **Detail**:
  - **Feature**: `PortfolioContext` 내부에서 발생하는 데이터 패칭 과정(Fetch Start, Success, Error, Loaded Count)을 실시간으로 기록(`debugLog`).
  - **UI**: "내 주식일지" 페이지 상단 디버그 콘솔에 Server Data와 Client Logs를 동시에 표시하여 비교 가능하게 함.
- **Build Time**: 2026-02-08 15:30:00

## [Alpha V1.058] - 2026-02-08 15:15:00

### 🔍 Server-Side Verification
- **Summary**: Add Debug Info for Portfolio Sync
- **Detail**:
  - **Feature**: `PortfolioPage`를 서버 컴포넌트로 전환하고, 서버 사이드에서 직접 DB의 포트폴리오 개수(`count`)를 조회하여 화면에 표시.
  - **Purpose**: 클라이언트(`Context`)와 서버(`DB/RLS`) 간의 데이터 불일치 원인을 파악하기 위함.
  - **UI**: 페이지 상단에 노란색 디버그 박스로 서버 측 조회 결과(User Email, DB Count) 표시.
- **Build Time**: 2026-02-08 15:15:00

## [Alpha V1.057] - 2026-02-08 15:00:00

### 🐛 Data Sync Debugging
- **Summary**: Improve Error Visibility for Portfolio Sync
- **Detail**:
  - **Issue**: "내 주식일지" 데이터가 로그인 후에도 보이지 않는 현상.
  - **Fix**: `PortfolioContext`에 에러 상태(`error`)를 추가하고, 데이터 로딩 실패 시 UI에 에러 메시지를 표시하도록 `PortfolioTable` 수정.
  - **Purpose**: 데이터가 없는 것인지, 로딩에 실패한 것인지 명확히 구분하여 디버깅 용이성 확보.
- **Build Time**: 2026-02-08 15:00:00

## [Alpha V1.056] - 2026-02-08 14:45:00

### 🔄 User Flow Optimization
- **Summary**: Fix User Info Missing / Login Loading Issue
- **Detail**:
  - **Issue**: 사이드바 사용자 정보가 'Guest'로 뜨거나 로그인 프로세스 중 로딩 화면이 생략되는 문제
  - **Fix**: `Sidebar` 컴포넌트가 `PortfolioContext`의 전역 사용자 상태(`user`, `logout`)를 직접 사용하도록 리팩토링. (Single Source of Truth 적용)
  - **Effect**: 전역 로딩(`Initializing...`)이 완료되면 사이드바에도 정확한 사용자 정보가 즉시 표시됨.
- **Build Time**: 2026-02-08 14:45:00

## [Alpha V1.055] - 2026-02-08 14:30:00

### 🛡️ Initialization Stability
- **Summary**: Fix Infinite Loading Issue
- **Detail**:
  - **Issue**: 초기화 과정(`initSession` 등)에서 응답이 지연되거나 실패할 경우, 로딩 화면(Initializing...)이 계속 유지되는 현상
  - **Fix**: `PortfolioContext`에 3초 안전 타임아웃(Safety Timeout) 추가. 초기화가 일정 시간 내에 완료되지 않으면 강제로 로딩을 해제하여 사용자가 앱을 사용할 수 있도록 조치.
  - **Misc**: 디버깅 로그 추가 및 `try-catch` 블록으로 예외 처리 강화.
- **Build Time**: 2026-02-08 14:30:00

## [Alpha V1.054] - 2026-02-08 14:15:00

### 🚑 Build Fix (Refined)
- **Summary**: Resolve Persistent TypeScript Build Error
- **Detail**:
  - **Issue**: 이전 `filter` 타입 가드 적용에도 불구하고 여전히 타입 불일치 에러 발생
  - **Fix**: `.map()` 후 `null`을 제거하는 방식 대신, 데이터 가공 전 `.filter()`로 유효한 데이터만 먼저 걸러내는 방식(`filter` -> `map`)으로 변경하여 타입 안정성 보장
- **Build Time**: 2026-02-08 14:15:00

## [Alpha V1.053] - 2026-02-08 14:00:00

### 🚑 Build Fix
- **Summary**: Fix TypeScript Build Error
- **Detail**:
  - **Issue**: `PortfolioContext`에서 `null` 체크 로직의 타입 추론 실패로 인한 빌드 에러 (`Type 'null' is not assignable to type 'Asset'`)
  - **Fix**: `.filter()`에 Type Predicate(`asset is Asset`)를 적용하여 타입 안정성 확보
- **Build Time**: 2026-02-08 14:00:00

## [Alpha V1.052] - 2026-02-08 13:45:00

### 🛡️ Data Fetching Stability
- **Summary**: Prevent Dashboard Crash/Empty State
- **Detail**:
  - **Issue**: 일부 데이터 오류(Symbol 누락 등) 시 전체 포트폴리오 로드가 실패하여 빈 화면이 나올 수 있는 문제 방지
  - **Fix**: `getMarketType` 안전성 강화 및 포트폴리오 매핑 시 예외 처리 추가
- **Build Time**: 2026-02-08 13:45:00

## [Alpha V1.051] - 2026-02-08 13:30:00

### 🔄 Login Process Refactor
- **Summary**: Implement Global Initialization Loader (Splash Screen)
- **Detail**:
  - **Issue**: 로그인 후 데이터가 로드되기 전 대시보드가 먼저 노출되는 현상 수정
  - **Fix**: `PortfolioProvider`에 `isInitialized` 상태 추가. 세션 및 포트폴리오 데이터가 모두 준비될 때까지 전역 로딩 화면 표시.
  - **Flow**: 로그인 -> Initializing... (데이터 로드) -> 대시보드 진입
- **Build Time**: 2026-02-08 13:30:00

## [Alpha V1.050] - 2026-02-08 13:00:00

### ⏳ Sidebar Loading Fix
- **Summary**: Fix infinite loading state in Sidebar
- **Detail**:
  - **Issue**: 로그인 직후 사이드바의 사용자 정보가 'Loading...' 상태로 멈추는 현상 수정
  - **Fix**: Auth 이벤트 발생 시 강제로 로딩 상태를 해제(`setLoading(false)`)하고, 안전장치(Timeout 2s)를 추가하여 무한 로딩 방지
- **Build Time**: 2026-02-08 13:00:00

## [Alpha V1.049] - 2026-02-08 12:45:00

### 🔄 Market Logic Updates (Refined)
- **Summary**: Refined Domestic Stock Distinction Rule
- **Detail**:
  - **Rule Update**: 국내 주식(KR) 구분 조건 확대
  - **New Rule**: 숫자 6자리 또는 "숫자 5개 + 알파벳 1개" (총 6자리) 패턴을 포함 (예: `0080G0`)
  - **Coverage**: 상장지수증권(ETN) 및 신형 우선주 등 혼합형 코드 지원
- **Build Time**: 2026-02-08 12:45:00

## [Alpha V1.048] - 2026-02-08 12:35:00

### 🔄 Market Logic Updates
- **Summary**: Fix Domestic/Overseas Stock Distinction
- **Detail**:
  - **Rule Changed**: 주식 심볼 패턴에 따라 자동으로 국가를 구분하도록 로직 변경
    - **국내(KR)**: 숫자 6자리 (예: `005930`, `005930.KS`)
    - **해외(US)**: 알파벳 등 그 외 (예: `AAPL`, `LIT`)
  - **Context**: 포트폴리오 로딩 시 위 규칙을 적용하여 `category` 재설정
- **Build Time**: 2026-02-08 12:35:00

## [Alpha V1.047] - 2026-02-08 12:20:00

### 👤 User Info Sync Fix
- **Summary**: Fix user info not displaying immediately after login
- **Detail**:
  - **Auth State**: `Sidebar` 컴포넌트의 인증 상태 동기화 로직 개선
  - **Event Handling**: 로그인(`SIGNED_IN`) 및 초기 세션(`INITIAL_SESSION`) 이벤트 발생 시 즉시 UI 갱신(`router.refresh`)하도록 수정
- **Build Time**: 2026-02-08 12:20:00

## [Alpha V1.046] - 2026-02-08 12:10:00

### 🌍 Overseas Stock Data Fix
- **Summary**: Fix missing data for Overseas Stocks (e.g., NYSE ETFs like LIT)
- **Detail**:
  - **Retry Logic**: 해외 주식 조회 시 거래소(NAS/NYS) 불일치로 인한 에러 발생 시, 자동으로 대체 거래소로 재조회하도록 로직 강화
  - **Coverage**: ETF 및 NYSE 종목 조회 성공률 대폭 향상
- **Build Time**: 2026-02-08 12:10:00

## [Alpha V1.045] - 2026-02-08 11:55:00

### 🚑 Hotfix (Build Error)
- **Summary**: Fix Portfolio Table Build Error
- **Detail**:
  - **Fix**: `PortfolioTable`에서 `PortfolioCard`로 `stockData` prop을 전달하지 않아 발생한 빌드 에러 수정
  - **Cleanup**: 누락된 `useBatchStockPrice` 훅 적용 완료
- **Build Time**: 2026-02-08 11:55:00

## [Alpha V1.044] - 2026-02-08 11:45:00

### 🚑 Deep Fix (Portfolio Data)
- **Summary**: Resolve Missing Profit/Loss & Return Rate (0%)
- **Detail**:
  - **Refactor**: 포트폴리오 데이터 조회 방식을 개별 호출(`useStockPrice`)에서 **일괄 조회(`useBatchStockPrice`)**로 변경하여 API 과부하 및 500 에러 원천 차단
  - **Symbol Fix**: 국내 주식 심볼(`.KS`) 처리 로직 개선으로 실시간 데이터 매칭 정확도 향상
  - **Performance**: 불필요한 리렌더링 감소 및 데이터 로딩 속도 개선
- **Build Time**: 2026-02-08 11:45:00

## [Alpha V1.043] - 2026-02-08 11:30:00

### 🔍 Portfolio UX Upgrade
- **Summary**: Implement Filtering & Sorting with Real-time Valuation
- **Detail**:
  - **Filtering**: 국내/해외/거래완료(수량0) 필터 추가 및 각 항목별 자산 개수(Count) 표시 기능 구현
  - **Sorting**: 최신순, 가나다순, **평가금액순** 정렬 기능 추가 (평가금액은 실시간 시세 반영하여 정렬)
  - **UI**: 필터 및 정렬 컨트롤 바 추가로 포트폴리오 관리 편의성 증대
- **Build Time**: 2026-02-08 11:30:00

## [Alpha V1.042] - 2026-02-08 11:00:00

### 💰 Portfolio Refactor & Fixes
- **Summary**: Portfolio Page Cleanup & Calculation Safe-guard
- **Detail**:
  - **UI Refactor**: 포트폴리오 페이지 상단 '내 자산관리' 중복 섹션 제거 및 '내 주식에 메모하기'로 타이틀 변경
  - **Calculation**: 평가손익 및 수익률 계산 로직 개선 (매입가 0원 또는 데이터 로딩 지연 시 0%로 안전하게 표시)
  - **Loading State**: 포트폴리오 목록 로딩 시 스켈레톤 UI를 적용하여 빈 화면(No assets)이 깜빡이는 현상 해결
- **Build Time**: 2026-02-08 11:00:00

## [Alpha V1.041] - 2026-02-08 10:45:00

### 🛡️ Auth Logic Hardening
- **Summary**: Improve Session Fetching & Logout
- **Detail**:
  - **Session**: `getSession`(로컬)과 `getUser`(서버) 이중 체크로 로그인 정보 로딩 속도 및 안정성 강화
  - **State**: 데이터 로딩 중 'Loading...' 표시 추가 (Guest 깜빡임 방지)
  - **Logout**: `onAuthStateChange` 이벤트를 통한 확실한 리다이렉트 처리
- **Build Time**: 2026-02-08 10:45:00

## [Alpha V1.040] - 2026-02-08 09:30:00

### 🎨 Sidebar Profile Update
- **Summary**: Refactor User Info Display
- **Detail**:
  - **Cleanup**: 상단 중복 프로필 영역 제거
  - **Profile**: 하단 '내정보' 메뉴를 실제 사용자 정보(닉네임/이메일) 표시 영역으로 변경 (요청사항 반영)
- **Build Time**: 2026-02-08 09:30:00

## [Alpha V1.039] - 2026-02-08 08:30:00

### 🔧 Critical Fix: Middleware & Session
- **Summary**: Restore Missing Middleware
- **Detail**:
  - **Middleware**: `src/middleware.ts` 파일이 누락되어 세션 관리가 작동하지 않던 치명적 오류 수정. 이제 페이지 이동 시 세션 갱신 및 보호 로직이 정상 작동합니다.
  - **Cleanup**: 디버깅 로그 제거 및 코드 정리.
- **Build Time**: 2026-02-08 08:30:00

## [Alpha V1.038] - 2026-02-08 07:45:00

### 🚑 Authentication Fix
- **Summary**: Fix Sidebar User State
- **Detail**:
  - **Sidebar**: `onAuthStateChange` 리스너 추가로 로그인 직후 사용자 정보 미표시 현상 수정
  - **Redirect**: 로그아웃 시 로그인 페이지로 즉시 이동하도록 로직 강화
- **Build Time**: 2026-02-08 07:45:00

## [Alpha V1.037] - 2026-02-08 07:00:00

### 🧭 Sidebar Navigation
- **Summary**: Implement Collapsible Sidebar & Layout
- **Detail**:
  - **Sidebar**: 좌측에 접고 펼 수 있는 사이드바(일일체크, 내주식일지, 설정, 내정보, 로그아웃) 추가
  - **Layout**: Dashboard 및 Portfolio 페이지에 사이드바 레이아웃 적용
  - **Cleanup**: 상단 헤더의 중복된 버튼 제거 및 UI 정리
- **Build Time**: 2026-02-08 07:00:00

## [Alpha V1.036] - 2026-02-08 06:15:00

### 🎨 UI Refinement & Formatting
- **Summary**: Improve Number Visibility & Layout
- **Detail**:
  - **Decimal Removal**: KOSPI/KOSDAQ 지수를 제외한 모든 숫자(등락폭, 수급주체별 금액, 해외지수 등)의 소수점 제거하여 가독성 향상
  - **Overseas Layout**: 해외지수(DOW/NASDAQ/S&P500) 표시 방식을 3단 그리드(종목명 | 등락률 | 현재가)로 변경하여 데이터 구분 명확화
- **Build Time**: 2026-02-08 06:15:00

## [Alpha V1.035] - 2026-02-08 06:00:00

### 🌏 Overseas Index Symbol Fix
- **Summary**: Correct Symbols for NASDAQ & S&P500
- **Detail**:
  - **Symbol Correction**: KIS API에서 요구하는 올바른 심볼로 교체 (NASDAQ: `.IXIC` -> `COMP`, S&P500: `.SPX` -> `SPX`)
  - **Exchange Code**: 각 지수에 맞는 거래소 코드 매핑 적용 (`COMP` -> `NAS`, `SPX` -> `NYS`)
  - **Verification**: DOW(.DJI), NASDAQ(COMP), S&P500(SPX) 데이터 수신 확인 완료
- **Build Time**: 2026-02-08 06:00:00

## [Alpha V1.034] - 2026-02-08 05:00:00

### 🌏 Overseas Index Fallback & Fix
- **Summary**: Implement Date/Time Fallback & Rate Parsing Fix
- **Detail**:
  - **Fallback Logic**: KIS API가 시계열 데이터(`output2`)를 반환하지 않을 경우(장중/휴장 등), 서버 시간(KST)을 기준으로 날짜/시간을 생성하여 "표시 없음" 현상 방지
  - **Rate Parsing**: 등락률(`rate`)이 `NaN%`로 표시되던 문제 해결 (API 필드 파싱 안전장치 추가)
  - **Cleanup**: 로깅 로직 제거
- **Build Time**: 2026-02-08 05:00:00

## [Alpha V1.033] - 2026-02-08 04:00:00

### 🌏 Overseas Index & Env Fix
- **Summary**: Fix Overseas Index Display (Date/Time) & Restore KIS API Keys
- **Detail**:
  - **Env Fix**: `.env.local`에 누락된 KIS API Key 복구 (Token 발급 에러 해결)
  - **Overseas Index**: 해외지수(다우, 나스닥 등) 표출 시 날짜/시간 및 지연/종가 상태 표시 기능 추가 (`output2` Time Series 활용)
  - **Cleanup**: 디버깅용 API 및 로그 파일 제거
- **Build Time**: 2026-02-08 04:00:00

## [Alpha V1.032] - 2026-02-08 03:30:00

### 🖥️ Dashboard UX Redesign
- **Summary**: Modern Dashboard Header & Layout Update
- **Detail**:
  - **지수종합 카드**: KOSPI, KOSDAQ의 지수와 당일 투자자 순매수 현황을 한눈에 볼 수 있는 대형 카드 레이아웃 적용
  - **해외지수 리스트**: 주요 해외 지수(DOW, NASDAQ, S&P 500)를 컴팩트한 리스트 형태로 제공
  - **마켓트렌드 테이블**: 시장별(코스피, 코스닥) 외국인/개인/기관 순매수 현황을 직관적인 테이블로 구성
- **Build Time**: 2026-02-08 03:30:00

## [Alpha V1.031] - 2026-02-08 03:00:00

### 🟢 Real-Time Investor Data (Intraday)
- **Summary**: Switched Investor Trends to Real-Time Intraday API
- **Detail**:
  - **투자자별 순매수**: 기존 '일별(Daily)' 데이터 대신 '장중 실시간(Time-By-Market, FHPTJ04030000)' 데이터를 사용하여, 현재 시점의 누적 순매수 현황을 정확하게 표시
  - **차트**: 차트는 여전히 최근 1개월 일별 추이를 표시 (Daily API 병행 호출)
- **Build Time**: 2026-02-08 03:00:00

## [Alpha V1.030] - 2026-02-08 02:30:00

### 📊 Data Unit Correction
- **Summary**: Investor Net Buying unit fix (Million -> Eok)
- **Detail**:
  - **투자자별 순매수**: API 원본 단위(백만원)를 통상적으로 사용하는 **억 원** 단위로 변환하여 표시 (값 / 100)
  - **S&P 500**: 데이터 로딩 디버깅 로그 추가
- **Build Time**: 2026-02-08 02:30:00

## [Alpha V1.029] - 2026-02-08 02:00:00

### 📈 S&P 500 & Investor Data Fix
- **Summary**: Correct API usage for S&P 500 Index and Investor Trends
- **Detail**:
  - **S&P 500**: ETF(SPY)가 아닌 실제 지수(SPX) 데이터를 가져오도록 해외지수 전용 API(`FHKST03030200`) 연결
  - **Investor Trends**: KOSPI 투자자별 매매동향 API를 `FHPTJ04040000`(시장별 투자자매매동향)로 교체하여 정확한 순매수 데이터 제공 (개인/외국인/기관)
- **Build Time**: 2026-02-08 02:00:00

## [Alpha V1.028] - 2026-02-08 01:30:00

### 🛡️ System Stabilization
- **Summary**: Rate Limit Tightening & Investor API Fix
- **Detail**:
  - **Rate Limit**: 서버 요청 제한을 강화 (Concurrency 5->3, Interval 100ms->300ms)하여 500 에러 원천 차단
  - **Investor API**: 투자자별 순매수 데이터 요청 시 날짜 파라미터(최근 1개월)를 명시하여 호출 오류 수정
  - **S&P 500**: (TODO) 인덱스 심볼 점검 예정
- **Build Time**: 2026-02-08 01:30:00

## [Alpha V1.027] - 2026-02-08 01:00:00

### 🚑 Deep Fix (Data Blocking & WS Stability)
- **Summary**: Client-side Sequential Chunking & WS Backoff
- **Detail**:
  - **Data Blocking**: Batch 데이터를 4개씩 끊어서 순차적으로 요청(Sequential Chunking)하고, 실패 시 자동 재시도하는 로직 적용. (서버 500 에러 및 타임아웃 원천 차단)
  - **WS Stability**: WebSocket 연결 실패 시 무한 재접속으로 인한 깜빡임을 막기 위해 지수적 백오프(Exponential Backoff, 실패할수록 대기시간 증가) 알고리즘 적용
- **Build Time**: 2026-02-08 01:00:00

## [Alpha V1.026] - 2026-02-08 00:30:00

### 🚑 Deep Fix (Data Flood Prevention)
- **Summary**: Fix Massive 500 Errors & Data Loss
- **Detail**:
  - **Flooding Fix**: `SectorWatchList` 내의 모든 종목이 동시에 개별 API를 호출하여 서버 Rate Limit을 초과하던 문제 해결 (개별 Fetch 비활성화 및 Batch 전용 모드 적용)
  - **Stability**: 이제 리스트 로딩 시 Batch API 하나만 호출되므로 서버 부하가 95% 이상 감소하고 데이터 로딩 성공률 향상 예상
- **Build Time**: 2026-02-08 00:30:00

## [Alpha V1.025] - 2026-02-08 00:00:00

### 🎨 UI & Data Stability
- **Summary**: Grid Layout for Watchlists & Data Debugging
- **Detail**:
  - **UI**: 종목 리스트의 정렬 불량을 해결하기 위해 CSS Grid(12 cols) 시스템 도입 (종목명 6: 현재가 3: 등락률 3 비율)
  - **Debugging**: 데이터 유실 원인 파악을 위한 Batch API 응답 로그 추가
- **Build Time**: 2026-02-08 00:00:00

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
