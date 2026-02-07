export interface KisTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface KisDomStockPrice {
    stck_prpr: string; // 현재가
    prdy_vrss: string; // 전일 대비
    prdy_ctrt: string; // 전일 대비율
    stck_bsop_date?: string; // 영업 일자 (YYYYMMDD)
    stck_cntg_hour?: string; // 체결 시간 (HHMMSS)
}

export interface KisOvStockPrice {
    last: string; // 현재가 (달러)
    diff: string; // 전일 대비
    rate: string; // 등락률
    tvol: string; // 거래량
    e_date?: string; // 현지 일자 (YYYYMMDD) or similar
    e_time?: string; // 현지 시간 (HHMMSS)
    ymd?: string;
    t?: string;
    date?: string; // Formatted Date (e.g. 20240206)
    time?: string; // Formatted Time (e.g. 000000)
    isDelay?: boolean; // Delayed data (15min)
}

export interface KisDomIndexPrice {
    bstp_nmix_prpr: string; // 업종 현재가
    bstp_nmix_prdy_vrss: string; // 전일 대비
    bstp_nmix_prdy_ctrt: string; // 전일 대비율
}

export interface KisWebSocketApprovalResponse {
    approval_key: string;
}

export interface KisResponse<T> {
    rt_cd: string;
    msg1: string;
    output: T;
}

export interface KisIndexChartResponse {
    rt_cd: string;
    msg1: string;
    output1: KisDomIndexPrice;
    output2: any[]; // Daily data array
}
