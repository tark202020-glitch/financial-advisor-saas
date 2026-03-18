# KIS API 기반 국내 액티브 ETF 추적 서비스

## 개요

KIS Open API를 활용하여 국내 액티브 ETF 종목을 자동/수동으로 선정하고, 보유종목 구성 변화를 추적하여 알림하는 Python 기반 서비스를 구축합니다.

기존 `open-trading-api` 프로젝트 구조(Python, [kis_auth.py](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/examples_llm/kis_auth.py), `examples_llm/` 패턴)를 재활용하고, `dart_collector`의 Supabase/config 패턴을 참고하여 구현합니다.

---

## 시스템 아키텍처

```
open-trading-api/
├── etf_tracker/                    ← [NEW] 메인 서비스 폴더
│   ├── config.py                   ← 환경설정 (Supabase, Google Sheets)
│   ├── etf_selector.py             ← Phase 1: ETF 종목 자동선정 엔진
│   ├── etf_holdings_collector.py   ← Phase 2: 보유종목/비중 수집기
│   ├── etf_change_detector.py      ← Phase 3: 변경감지 & 알림
│   ├── manual_selector.py          ← 수동 종목 관리
│   ├── google_sheets.py            ← Google Sheets 연동 모듈
│   ├── scheduler.py                ← 일일 스케줄러
│   └── requirements.txt            ← 추가 의존성
├── examples_llm/                   ← 기존 KIS API 샘플 (참조용)
│   ├── kis_auth.py                 ← 인증 모듈 (재사용)
│   ├── etfetn/                     ← ETF API 샘플 (참조용)
│   └── domestic_stock/             ← 주식 API 샘플 (참조용)
└── stocks_info/                    ← 종목 마스터 파싱 (참조용)
```

---

## Phase 1: 액티브 ETF 종목 자동 선정

### 요구사항 정리

| 조건 | 상세 |
|------|------|
| **필수 키워드** | 종목명에 "액티브" 포함 |
| **카테고리별 선정** | AI(10개), 전략(10개), 배당(10개) |
| **제외 조건** | "커버드콜" 키워드 포함 종목 제외 |
| **범위** | 국내 주식만 (해외 주식 제외) |
| **정렬** | 시가총액 상위 기준, 카테고리당 최대 10개 |

### 구현 방식

#### [NEW] `etf_tracker/etf_selector.py`

1. **종목 마스터 다운로드**: [stocks_info/kis_kospi_code_mst.py](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/stocks_info/kis_kospi_code_mst.py)의 패턴을 재활용하여 KOSPI/KOSDAQ 마스터 파일을 다운로드 및 파싱
2. **ETF 필터링 로직**:
   - 마스터 파일에서 `ETP == 'Y'` (ETF/ETN 종목) 필터링
   - 종목명에 **"액티브"** 키워드 필수 포함
   - **"커버드콜"** 키워드 포함 종목 제외
   - 해외투자 ETF 제외 (종목명에 "해외", "미국", "S&P", "나스닥", "글로벌", "차이나", "일본", "유럽", "인도" 등)
3. **카테고리 분류**:
   - **AI 키워드**: "AI", "인공지능", "로봇", "자율주행", "빅데이터", "클라우드", "반도체", "메타버스" 등
   - **전략 키워드**: "전략", "모멘텀", "밸류", "퀄리티", "성장", "멀티팩터", "스마트" 등
   - **배당 키워드**: "배당", "고배당", "월배당", "인컴", "리츠" 등
4. **시가총액 정렬**: 마스터 파일의 `시가총액` 필드 또는 KIS API [market_cap](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/examples_llm/domestic_stock/market_cap/market_cap.py#24-134) 활용하여 각 카테고리 내 상위 10개 선정

#### [NEW] `etf_tracker/manual_selector.py`

- 수동으로 ETF 종목을 추가/제거할 수 있는 JSON 기반 설정 파일
- `manual_etf_list.json` 파일에서 수동 종목 관리

> [!IMPORTANT]
> **ETF 종목명 매칭 전략**: 종목 마스터 파일의 한글명에서 키워드를 매칭합니다. 예: "TIGER AI코리아그로스액티브" → "AI" + "액티브" → AI 카테고리. 한 종목이 여러 카테고리에 중복 분류될 수 있으며, 이 경우 첫 번째 매칭 카테고리에만 할당합니다.

---

## Phase 2: 보유종목 및 비중 정보 수집

### 구현 방식

#### [NEW] `etf_tracker/etf_holdings_collector.py`

1. **KIS API 활용**: [inquire_component_stock_price](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/examples_user/etfetn/etfetn_functions.py#19-85) API 호출
   - API: `/uapi/etfetn/v1/quotations/inquire-component-stock-price`
   - TR ID: `FHKST121600C0`
   - 파라미터: `FID_COND_MRKT_DIV_CODE="J"`, `FID_INPUT_ISCD=종목코드`, `FID_COND_SCR_DIV_CODE="11216"`
   - output2에서 구성종목 코드, 종목명, 보유 비중 정보 추출
2. **수집 주기**: 1일 1회 (장 마감 후)
3. **Rate Limit 고려**: `ka.smart_sleep()` 활용, 종목 간 0.1초 이상 간격

#### [NEW] `etf_tracker/google_sheets.py`

1. **Google Sheets API 연동**: `gspread` + `google-auth` 라이브러리 사용
2. **시트 구조**:
   - **시트1 (ETF_종목리스트)**: 선정된 ETF 종목 목록 (카테고리, 종목코드, 종목명, 시가총액)
   - **시트2 (보유종목_기록)**: 각 ETF별 구성 종목과 비중 (날짜, ETF코드, 구성종목코드, 구성종목명, 비중%)
   - **시트3 (변경_이력)**: 비중 변경 발생시 기록
3. **인증**: Google Service Account JSON 키 파일 사용

#### [NEW] `etf_tracker/config.py`

- [dart_collector/config.py](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/dart_collector/config.py) 패턴 참고
- `.env` 파일 기반 환경변수 관리
  - `GOOGLE_SHEETS_CREDENTIAL_PATH`: Google 서비스 계정 키 경로
  - `GOOGLE_SHEETS_ID`: 저장할 Google Sheet ID
  - `SUPABASE_URL` / `SUPABASE_KEY`: Supabase 연동 (선택)
  - `ALERT_EMAIL` 또는 `ALERT_WEBHOOK_URL`: 알림 수신 설정

---

## Phase 3: 변경 감지 및 알림

### 구현 방식

#### [NEW] `etf_tracker/etf_change_detector.py`

1. **비교 로직**:
   - 전일 보유종목/비중 vs 금일 보유종목/비중 비교
   - 신규 편입 종목 감지
   - 편출(제거) 종목 감지
   - 비중 변경 (임계치 이상, 예: ±1%) 감지
2. **알림 방식** (우선순위별):
   - **Google Sheets 기록**: 변경_이력 시트에 자동 기록
   - **콘솔 로깅**: 상세 변경 내역 출력
   - **이메일 알림** (선택): `smtplib` 활용
   - **웹훅 알림** (선택): Slack/Discord/Teams 웹훅 연동
3. **리뷰 리포트**: 변경 발생시 요약 리포트 자동 생성

---

## Phase 4: 스케줄러

#### [NEW] `etf_tracker/scheduler.py`

- `schedule` 라이브러리 사용하여 매일 특정 시간에 실행
- 기본 실행 시간: 오후 4시 30분 (장 마감 30분 후)
- 실행 순서:
  1. ETF 종목 목록 갱신 (주 1회 또는 수동 트리거)
  2. 보유종목/비중 수집
  3. 변경 감지 및 알림
  4. Google Sheets 저장

---

## 필요 의존성

#### [NEW] `etf_tracker/requirements.txt`

```
gspread>=6.0.0          # Google Sheets API
google-auth>=2.0.0      # Google 인증
python-dotenv>=1.0.0    # 환경변수 관리
schedule>=1.2.0         # 스케줄러
```

> [!NOTE]
> 기존 `open-trading-api`의 [requirements.txt](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/requirements.txt)(pandas, requests, pyyaml 등)는 공유하며, 추가 의존성만 별도 관리합니다.

---

## 사전 확인 사항 (사용자 검토 필요)

> [!WARNING]
> 아래 항목들은 구현 전에 확인이 필요합니다:

1. **KIS API 인증 정보**: [kis_devlp.yaml](file:///G:/Antigravity_Google/Stock_DB/open-trading-api/kis_devlp.yaml)에 실전투자용 앱키/시크릿이 설정되어 있는지 확인
2. **Google Sheets API**:
   - Google Cloud Console에서 프로젝트 생성 및 Sheets API 활성화 필요
   - Service Account 생성 후 JSON 키 다운로드
   - 대상 Google Sheet에 Service Account 이메일 공유 설정
3. **알림 방식 선택**: 이메일, Slack 웹훅, Discord 웹훅 중 어떤 알림을 사용할지?
4. **ETF 카테고리 키워드 목록**: 제안한 키워드 외에 추가/수정할 키워드가 있는지?
5. **비중 변경 임계치**: 알림을 보낼 최소 비중 변경 퍼센트 (기본 제안: ±1%)
6. **스케줄링 환경**: 이 프로그램을 항시 실행할 서버/PC가 있는지, 아니면 Windows Task Scheduler 또는 다른 방식을 사용할지?

---

## 검증 계획

### 자동 테스트

1. **ETF 선정 테스트**: 종목 마스터 파일에서 "액티브" 키워드가 포함된 ETF가 정상적으로 필터링되는지 검증
   - 실행: `python -m pytest etf_tracker/tests/test_etf_selector.py -v`
2. **변경 감지 테스트**: 모의 데이터로 신규 편입/편출/비중 변경 감지 정확도 검증
   - 실행: `python -m pytest etf_tracker/tests/test_change_detector.py -v`

### 수동 검증
1. **Phase 1 검증**: `etf_selector.py`를 단독 실행하여 선정된 ETF 목록이 요구사항과 일치하는지 확인
   - 실행: `cd open-trading-api && uv run python etf_tracker/etf_selector.py`
   - 확인: 각 카테고리당 최대 10개, "액티브" 포함, "커버드콜" 제외, 해외 제외
2. **Phase 2 검증**: 특정 ETF 종목 1~2개에 대해 `etf_holdings_collector.py`를 실행하여 구성종목 데이터가 정상 수집되는지 확인
   - 실행: `cd open-trading-api && uv run python etf_tracker/etf_holdings_collector.py --test`
3. **Google Sheets 연동 검증**: 수집된 데이터가 Google Sheet에 정상 기록되는지 직접 확인
   - 사용자가 실제 Google Sheet를 열어 데이터 확인
