"use client";

import { useState, useCallback, useEffect } from 'react';
import { X, Target, Loader2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';

interface CategoryRatio {
    label: string;
    key: string;
    ratio: number;
}

const DEFAULT_RATIOS: CategoryRatio[] = [
    { label: '대형주', key: '대형주 (Lv.1)', ratio: 0.80 },
    { label: 'ETF모음', key: 'ETF모음 (Lv.2)', ratio: 0.85 },
    { label: '배당주', key: '배당주 (Lv.3)', ratio: 0.80 },
    { label: '기대주', key: '기대주 (Lv.4)', ratio: 0.90 },
];

const STORAGE_KEY = 'jubot_auto_target_ratios';

interface AutoTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AutoTargetModal({ isOpen, onClose }: AutoTargetModalProps) {
    const { assets, updateAsset } = usePortfolio();

    // Load saved ratios from localStorage
    const [ratios, setRatios] = useState<CategoryRatio[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return JSON.parse(saved);
            } catch (e) { /* ignore */ }
        }
        return DEFAULT_RATIOS;
    });

    // Running state
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [failed, setFailed] = useState<{ id: number; symbol: string; name: string }[]>([]);
    const [isDone, setIsDone] = useState(false);
    const [successCount, setSuccessCount] = useState(0);

    // Save ratios to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ratios));
        }
    }, [ratios]);

    const handleRatioChange = (index: number, value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 1) return;
        setRatios(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ratio: num };
            return next;
        });
    };

    // Get ratio for a given asset based on its secondary_category
    const getRatioForAsset = (asset: Asset): number => {
        const cat = asset.secondary_category || '';
        const match = ratios.find(r => cat.startsWith(r.label));
        return match ? match.ratio : 0.9; // default 0.9
    };

    // Calculate target for a single asset
    const calcTargetForAsset = useCallback(async (asset: Asset): Promise<boolean> => {
        if (asset.category === 'GOLD' || asset.quantity === 0) return true;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`/api/kis/chart/daily/${asset.symbol.replace('.KS', '')}?market=${asset.category}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) return false;
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) return false;

            // 최근 45일 데이터에서 종가(stck_clpr) 최고값 추출
            const recent45 = data.slice(0, 45);
            const maxClose = Math.max(...recent45.map((d: any) =>
                parseFloat(d.stck_clpr || d.close || '0')
            ));
            if (maxClose <= 0) return false;

            // 카테고리별 비율 적용
            const ratio = getRatioForAsset(asset);
            const targetLower = Math.round(maxClose * ratio);
            await updateAsset(asset.id, { targetPriceLower: targetLower });
            return true;
        } catch (e) {
            console.warn(`[AutoTarget] Failed for ${asset.symbol}:`, e);
            return false;
        }
    }, [updateAsset, ratios]);

    // Run auto target for all eligible assets
    const handleRun = useCallback(async () => {
        const eligible = assets.filter(a => a.category !== 'GOLD' && a.quantity > 0);
        if (eligible.length === 0) return;

        setIsRunning(true);
        setIsDone(false);
        setFailed([]);
        setSuccessCount(0);
        setProgress({ current: 0, total: eligible.length });

        const failedList: typeof failed = [];
        let success = 0;

        for (let i = 0; i < eligible.length; i++) {
            const asset = eligible[i];
            setProgress({ current: i + 1, total: eligible.length });

            const ok = await calcTargetForAsset(asset);
            if (ok) {
                success++;
            } else {
                failedList.push({ id: asset.id, symbol: asset.symbol, name: asset.name });
            }

            // Rate limit 1초 대기
            if (i < eligible.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setFailed(failedList);
        setSuccessCount(success);
        setIsRunning(false);
        setIsDone(true);
    }, [assets, calcTargetForAsset]);

    // Retry a single failed asset
    const handleRetry = useCallback(async (failedAsset: { id: number; symbol: string; name: string }) => {
        const fullAsset = assets.find(a => a.id === failedAsset.id);
        if (!fullAsset) return;
        const ok = await calcTargetForAsset(fullAsset);
        if (ok) {
            setFailed(prev => prev.filter(f => f.id !== failedAsset.id));
            setSuccessCount(prev => prev + 1);
        }
    }, [assets, calcTargetForAsset]);

    if (!isOpen) return null;

    const eligibleCount = assets.filter(a => a.category !== 'GOLD' && a.quantity > 0).length;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#333]">
                    <div className="flex items-center gap-2">
                        <Target size={18} className="text-[#F7D047]" />
                        <h2 className="text-lg font-bold text-white">하한목표 자동설정</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed">
                        최근 <strong className="text-white">45일 종가 최고값</strong>에 카테고리별 비율을 곱하여 하한목표를 자동 설정합니다.
                    </p>

                    {/* Category Ratio Settings */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-300">📊 카테고리별 비율 설정</h3>
                        {ratios.map((item, index) => (
                            <div key={item.key} className="flex items-center justify-between bg-[#252525] rounded-xl p-3 border border-[#333]">
                                <span className="text-sm font-bold text-white">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.0"
                                        step="0.01"
                                        value={item.ratio}
                                        onChange={(e) => handleRatioChange(index, e.target.value)}
                                        className="w-24 accent-[#F7D047]"
                                        disabled={isRunning}
                                    />
                                    <span className="text-sm font-mono font-bold text-[#F7D047] w-14 text-right">
                                        {(item.ratio * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-gray-500">
                            미분류 종목은 기본 90% 비율이 적용됩니다.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[#333]" />

                    {/* Progress */}
                    {isRunning && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-[#F7D047]">🎯 진행 중...</span>
                                <span className="text-xs text-gray-400">{progress.current} / {progress.total}</span>
                            </div>
                            <div className="w-full bg-[#333] rounded-full h-2">
                                <div
                                    className="bg-[#F7D047] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Done Result */}
                    {isDone && !isRunning && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-green-400" />
                                <span className="text-sm font-bold text-green-400">완료: {successCount}개 설정됨</span>
                                {failed.length > 0 && (
                                    <span className="text-sm text-red-400">/ {failed.length}개 실패</span>
                                )}
                            </div>
                            {failed.length > 0 && (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {failed.map(f => (
                                        <div key={f.id} className="flex items-center justify-between bg-red-900/10 border border-red-900/20 rounded-lg px-3 py-2">
                                            <span className="text-sm text-red-300">{f.name}</span>
                                            <button
                                                onClick={() => handleRetry(f)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 text-xs font-bold transition"
                                            >
                                                <RefreshCw size={12} /> 새로고침
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Run Button */}
                    <button
                        onClick={handleRun}
                        disabled={isRunning || eligibleCount === 0}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#F7D047] text-black hover:bg-[#f5c623] active:scale-[0.98]"
                    >
                        {isRunning ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                처리 중... ({progress.current}/{progress.total})
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Target size={16} />
                                {eligibleCount}개 종목 하한목표 자동설정
                            </span>
                        )}
                    </button>

                    {/* Warning */}
                    <p className="text-xs text-gray-500 flex items-start gap-1">
                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                        기존 하한목표가 덮어씌워집니다. 종목당 1초 간격으로 순차 처리됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
