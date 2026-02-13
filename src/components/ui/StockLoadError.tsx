"use client";

import { RefreshCw, AlertCircle } from 'lucide-react';

interface StockLoadErrorProps {
    message?: string;
    onRetry: () => void;
    variant?: 'inline' | 'block' | 'section';
    retrying?: boolean;
}

/**
 * 주식 데이터 로딩 실패 시 표시할 공통 UI 컴포넌트
 * 
 * - inline: 종목 행 안에 작은 새로고침 아이콘  
 * - block: 카드/블록 전체에 에러 메시지 + 새로고침 버튼
 * - section: 모달 내 섹션(차트, 투자자동향, 재무분석)에 사용
 */
export default function StockLoadError({ message, onRetry, variant = 'block', retrying = false }: StockLoadErrorProps) {
    if (variant === 'inline') {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                }}
                className="text-gray-500 hover:text-[#F7D047] transition-colors p-0.5"
                title="새로고침"
                disabled={retrying}
            >
                <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
            </button>
        );
    }

    if (variant === 'section') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <AlertCircle size={24} className="text-gray-500" />
                <p className="text-sm text-gray-500">{message || '데이터를 불러올 수 없습니다'}</p>
                <button
                    onClick={onRetry}
                    disabled={retrying}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#333] hover:bg-[#444] text-gray-300 text-xs font-bold transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
                    {retrying ? '불러오는 중...' : '새로고침'}
                </button>
            </div>
        );
    }

    // block (default)
    return (
        <div className="flex items-center justify-between bg-amber-900/10 border border-amber-800/20 rounded-lg px-4 py-2.5 mb-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
                <AlertCircle size={14} />
                <span>{message || '일부 데이터를 불러오지 못했습니다'}</span>
            </div>
            <button
                onClick={onRetry}
                disabled={retrying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-900/20 hover:bg-amber-900/40 text-amber-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
                <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                {retrying ? '재시도...' : '새로고침'}
            </button>
        </div>
    );
}
