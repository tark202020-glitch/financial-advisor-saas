-- ETF 배당 수익률 및 히스토리 저장을 위한 컬럼 추가
-- etf_tracked_list 테이블에 dividend_yield, dividend_history 컬럼을 추가합니다.

ALTER TABLE public.etf_tracked_list 
ADD COLUMN IF NOT EXISTS dividend_yield NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dividend_history JSONB DEFAULT NULL;

-- 설명 추가 (Comment)
COMMENT ON COLUMN public.etf_tracked_list.dividend_yield IS '연환산 누적 배분율 (%)';
COMMENT ON COLUMN public.etf_tracked_list.dividend_history IS '해당 연도에 지급된 분배금 내역 목록 [{ 분배락일, 지급예정일, 1주당 분배금 }]';
