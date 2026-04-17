-- ETF 분석기: 수동 검색 전환 — 추적 목록 테이블 확장
-- memo: 사용자가 종목에 달 수 있는 간단한 메모
-- market: KR/US 구분 (해외 주식도 추가 가능하도록)

ALTER TABLE etf_tracked_list ADD COLUMN IF NOT EXISTS memo TEXT DEFAULT '';
ALTER TABLE etf_tracked_list ADD COLUMN IF NOT EXISTS market TEXT DEFAULT 'KR';
