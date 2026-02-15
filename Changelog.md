

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
