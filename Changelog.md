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
