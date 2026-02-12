# 📋 Financial Advisor SaaS — 사이트맵 & 페이지 네이밍 가이드

> 전체 UI 수정 작업을 위한 페이지별 구조 정리 문서  
> 최종 업데이트: 2026-02-12

---

## 🗂️ 페이지 라우트 총괄

| # | 라우트 | 페이지명 (한글) | 파일 경로 | 사이드바 | 로그인 필요 |
|---|--------|----------------|-----------|:--------:|:-----------:|
| 1 | `/` | 랜딩 페이지 | `src/app/page.tsx` | ✗ | ✗ |
| 2 | `/login` | 로그인 | `src/app/login/page.tsx` | ✗ | ✗ |
| 3 | `/register` | 회원가입 | `src/app/register/page.tsx` | ✗ | ✗ |
| 4 | `/forgot-password` | 비밀번호 찾기 | `src/app/forgot-password/page.tsx` | ✗ | ✗ |
| 5 | `/update-password` | 비밀번호 변경 | `src/app/update-password/page.tsx` | ✗ | ✗ |
| 6 | `/dashboard` | 일일체크 | `src/app/dashboard/page.tsx` | ✓ | ✓ |
| 7 | `/portfolio` | 내 주식일지 | `src/app/portfolio/page.tsx` | ✓ | ✓ |
| 8 | `/insights` | 내 주식 인사이트 | `src/app/insights/page.tsx` | ✓ | ✓ |
| 9 | `/condition-search` | 조건검색 | `src/app/condition-search/page.tsx` | ✓ | ✓ |
| 10 | `/memo` | 주식일지메모 | `src/app/memo/page.tsx` | ✓ | ✓ |

---

## 🔲 공통 레이아웃

### Sidebar (`src/components/Sidebar.tsx`)
좌측 고정 네비게이션. 접기/펼치기 가능 (w-64 ↔ w-20).

| 메뉴 항목 | 아이콘 | 라우트 |
|-----------|--------|--------|
| 일일체크 | `LayoutDashboard` | `/dashboard` |
| 내 주식일지 | `BookOpen` | `/portfolio` |
| 내 주식 인사이트 | `LineChart` | `/insights` |
| 조건검색 | `Search` | `/condition-search` |
| 주식일지메모 | `StickyNote` | `/memo` |
| 설정 | `Settings` | `#` (비활성) |

하단: **내 정보** (닉네임/이메일) + **로그아웃** 버튼

### SidebarLayout (`src/components/SidebarLayout.tsx`)
모든 로그인 후 페이지의 공통 래퍼. 포함:
- `Sidebar` 컴포넌트
- `MemoOverlay` (Layer 2 오버레이 메모장)
- **FAB 메모 버튼** (우측 하단, 오렌지색)

---

## 📄 페이지별 상세 구조

---

### 1. 랜딩 페이지 (`/`)

**파일:** `src/app/page.tsx` — `LandingPage()`

| 섹션 | 설명 |
|------|------|
| Navbar | 로고 "Market Insight" + 로그인/회원가입 버튼 |
| Hero Section | 메인 타이틀 "시장을 읽는 가장 확실한 방법" + CTA 버튼 |
| Feature Grid | 3개 카드: 실시간 수급 분석, 검증된 데이터, 투자 일지 관리 |
| Footer | 저작권 + 이용약관/개인정보처리방침 |

서브 컴포넌트: `FeatureCard()` (같은 파일 내 정의)

---

### 2. 로그인 (`/login`)

**파일:** `src/app/login/page.tsx`

| 섹션 | 설명 |
|------|------|
| 로그인 폼 | 이메일/비밀번호 입력 + 로그인 버튼 |
| 링크 | 비밀번호 찾기, 회원가입 이동 |

---

### 3. 회원가입 (`/register`)

**파일:** `src/app/register/page.tsx`

| 섹션 | 설명 |
|------|------|
| 회원가입 폼 | 이메일/비밀번호/닉네임 입력 |

---

### 4. 일일체크 (`/dashboard`)

**파일:** `src/app/dashboard/page.tsx` — `DashboardPage()`

| 섹션 | 컴포넌트 | 설명 |
|------|----------|------|
| 로딩 화면 | `FullPageLoader` | 3초 로딩 후 대시보드 표시 |
| **헤더** | — | "일일 체크" 타이틀 |
| **시장 정보 & 트렌드** | `MarketFlowChart` | 국내/해외 지수 + 업종별 등락률 |
| **관심종목** | `DashboardWatchlists` | 관심종목 그룹별 리스트 |

#### MarketFlowChart (`src/components/MarketFlowChart.tsx`)
| 내부 섹션 | 컴포넌트 | 설명 |
|-----------|----------|------|
| 국내 지수 카드 | `DomesticIndexCard` | KOSPI, KOSDAQ 지수 + 외인/기관/개인 수급 |
| 해외 지수 행 | `OverseasRow` | S&P 500, NASDAQ, DOW |
| 시장 트렌드 행 | `MarketTrendRow` | KOSPI/KOSDAQ 외인/기관/개인 데이터 |
| **업종별 등락률** | `SectorBarChart` | KOSPI 업종별 바 차트 + 업종 상세 테이블 |

#### SectorBarChart (`src/components/SectorBarChart.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 등락률 바 차트 | KOSPI 업종별 등락률 시각화 |
| 업종 상세 테이블 | 업종명 / 지수 / 등락률 / 업종대표 종목 |

#### DashboardWatchlists (`src/components/DashboardWatchlists.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 관심종목 그룹 탭 | 그룹별 탭 + 새 그룹 만들기 |
| 종목 리스트 | 종목명, 현재가, 전일대비 |
| 종목 추가 모달 | `StockSearchModal` |

---

### 5. 내 주식일지 (`/portfolio`)

**파일:** `src/app/portfolio/page.tsx` → `src/components/portfolio/PortfolioClientPage.tsx`

| 섹션 | 컴포넌트 | 설명 |
|------|----------|------|
| **종목 추가 폼** | `AddAssetForm` | 종목 검색 + 매수가/수량/카테고리 입력 |
| **포트폴리오 테이블** | `PortfolioTable` | 보유 종목 리스트 (헤더: 종목명/매수가/수량/현재가/수익률/목표가) |
| **포트폴리오 카드** | `PortfolioCard` | 각 종목별 카드 (현재가, 수익률, 목표가 설정) |

#### AddAssetForm (`src/components/portfolio/AddAssetForm.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 종목 검색 | 종목명/코드 입력 → 자동완성 |
| 매수 정보 | 매수가, 수량, 카테고리(KR/US) |
| 저장 버튼 | Supabase에 자산 저장 |

#### PortfolioCard (`src/components/portfolio/PortfolioCard.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 종목 정보 | 종목명, 코드, 카테고리 |
| 가격 정보 | 현재가, 전일대비, 수익률 |
| 목표가 설정 | 상한/하한 목표가 설정 + 저장 |
| 삭제 버튼 | 종목 삭제 |

---

### 6. 내 주식 인사이트 (`/insights`)

**파일:** `src/app/insights/page.tsx` — `InsightsPage()`

| 섹션 | 컴포넌트 | 설명 |
|------|----------|------|
| **헤더** | — | "내 주식 인사이트" 타이틀 |
| **AI 조언** | `AiGuruBlock` | AI 투자 어드바이저 "고래"의 조언 (3~4개 카드) |
| **목표가 달성 현황** | `TargetProximityBlock` | 상한/하한 목표가 대비 달성률 그래프 |
| **포트폴리오 구성** | `PortfolioCompositionBlock` | 파이차트 + 종목별 비중 리스트 |

#### AiGuruBlock (`src/components/insights/AiGuruBlock.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 스켈레톤 로딩 | AI 분석 중 로딩 애니메이션 |
| 조언 카드 리스트 | 카테고리별 아이콘 + 조언 텍스트 |

#### TargetProximityBlock (`src/components/insights/TargetProximityBlock.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 상한 목표 달성률 | 각 종목의 상한 목표 대비 현재가 프로그레스 바 |
| 하한 목표 달성률 | 각 종목의 하한 목표 대비 현재가 프로그레스 바 |
| 🔥 5% 이내 경고 | 목표가 5% 이내 종목 하이라이트 |

#### PortfolioCompositionBlock (`src/components/insights/PortfolioCompositionBlock.tsx`)
| 내부 섹션 | 설명 |
|-----------|------|
| 파이 차트 | 상위 10개 종목 비중 시각화 |
| 종목별 비중 리스트 | 종목명, 비중%, 금액 |

---

### 7. 조건검색 (`/condition-search`)

**파일:** `src/app/condition-search/page.tsx` — `ConditionSearchPage()`

| 섹션 | 설명 |
|------|------|
| **헤더** | "조건검색" + HTS 0330 뱃지 |
| **조건 프리셋** | 프리셋 불러오기/저장/삭제 |
| **10개 조건 입력** | 매출액 증가율, 영업이익 증가율, ROE, PEG, PER, PBR, 부채비율, 배당수익률, 시가총액, 거래량 — 각 Min/Max 입력 |
| **진행률 표시** | SSE 스트리밍 기반 실시간 분석 진행률 |
| **검색 결과 테이블** | 종목명/현재가/매출증가율/영업이익증가율/ROE/PEG/PER/PBR/배당률/부채비율/시가총액/거래량 |

---

### 8. 주식일지메모 (`/memo`)

**파일:** `src/app/memo/page.tsx` — `MemoPage()`

| 섹션 | 설명 |
|------|------|
| **헤더** | "📝 주식일지 메모" |
| **검색바** | 제목/내용/페이지명 검색 |
| **통계 카드** | 전체 메모 수 / 검색 결과 수 |
| **날짜별 메모 리스트** | 날짜 구분선 + 메모 카드 (인라인 수정/삭제) |

---

## 🪟 모달 (Modal)

| 모달 | 파일 | 호출 위치 | 설명 |
|------|------|-----------|------|
| `StockDetailChartModal` | `src/components/modals/StockDetailChartModal.tsx` | Portfolio 카드 클릭 | 종목 상세 차트 + 기업정보 + 목표가 + 재무정보 |
| `StockDetailModal` | `src/components/modals/StockDetailModal.tsx` | 관심종목 클릭 | 종목 기본 정보 |
| `StockSearchModal` | `src/components/modals/StockSearchModal.tsx` | 관심종목 추가 | 종목 검색 + 선택 |
| `WatchlistEditModal` | `src/components/modals/WatchlistEditModal.tsx` | 관심종목 그룹 수정 | 그룹명 변경/삭제 |

### StockDetailChartModal 내부 탭

| 탭 | 설명 |
|----|------|
| 기업 정보 | 종목명, 업종, 설립일, 시가총액 등 |
| 차트 | 일봉 차트 (Recharts) |
| 목표가 | 상한/하한 목표 설정 및 달성률 |
| 재무 지표 | PER, PBR, ROE, 배당률, 부채비율 등 |

---

## 🌐 API 라우트 정리

### `/api/memos` — 메모 CRUD
### `/api/condition-presets` — 조건 프리셋 CRUD
### `/api/ai/advice` — AI 투자 조언 생성

### `/api/kis/*` — KIS Open API 프록시

| 라우트 | 설명 |
|--------|------|
| `/api/kis/price/domestic/[symbol]` | 국내 종목 실시간 가격 |
| `/api/kis/price/overseas/[symbol]` | 해외 종목 실시간 가격 |
| `/api/kis/price/batch` | 복수 종목 가격 일괄 조회 |
| `/api/kis/chart/daily/[symbol]` | 일봉 차트 데이터 |
| `/api/kis/company/[symbol]` | 기업 정보 |
| `/api/kis/invest-opinion` | 투자의견 |
| `/api/kis/ranking` | 종목 랭킹 |
| `/api/kis/ranking/simple` | 조건검색용 간편 랭킹 |
| `/api/kis/market/investor` | 투자자별 수급 |
| `/api/kis/market/sector` | 업종별 지수 |
| `/api/kis/index/domestic/[symbol]` | 국내 시장 지수 |
| `/api/kis/index/overseas/[symbol]` | 해외 시장 지수 |
| `/api/kis/ws-approval` | WebSocket 접속키 발급 |

---

## 🧩 공통 Context / Hook

| 파일 | 용도 |
|------|------|
| `src/context/PortfolioContext.tsx` | 포트폴리오 데이터 + 유저 인증 상태 전역 관리 |
| `src/context/WatchlistContext.tsx` | 관심종목 그룹 전역 관리 |
| `src/context/WebSocketContext.tsx` | KIS WebSocket 실시간 가격 구독 |
| `src/hooks/useStockPrice.tsx` | 종목 가격 조회 (WebSocket 우선 → REST 폴백) |
| `src/hooks/useMarketIndex.tsx` | 시장 지수 조회 |

---

## 📌 Layer 2 오버레이

| 컴포넌트 | 파일 | 설명 |
|----------|------|------|
| `MemoOverlay` | `src/components/memo/MemoOverlay.tsx` | 우측 하단 플로팅 메모장 (FAB 버튼으로 토글) |

**MemoOverlay 구성:**
- 헤더: 📝 "주식일지 메모" + 오늘 날짜
- 페이지 정보 바: 현재 페이지명 자동 표시
- 제목 입력 (선택)
- 내용 입력 (textarea)
- 저장 버튼
- 최근 메모 (5건) 접기/펼치기
