"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Edit3, Trash2, Save, Plus, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ReferenceLine
} from 'recharts';
import { useStockPrice } from '@/hooks/useStockPrice';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import FinancialGrid from '@/components/FinancialGrid';
import StockLoadError from '@/components/ui/StockLoadError';

// 2차 카테고리에 따른 테마 색상 반환 함수 (PortfolioCard와 동일)
const getCategoryStyle = (category: string | undefined) => {
    const rawLabel = category || '미분류';
    const label = rawLabel.replace(/\(별.*?\)/g, '').trim();

    if (!category) return {
        level: '0',
        label,
        wrapper: "bg-[#1E1E1E] sm:rounded-2xl shadow-2xl shadow-black/50 border border-[#333]",
        header: "bg-[#252525] border-b border-[#333]",
        badgeBg: "bg-gradient-to-br from-gray-700 to-gray-900",
        border: "border-gray-700"
    };

    if (category.includes('배당주')) {
        return {
            level: 'I',
            label,
            wrapper: "bg-[#1E2A22] sm:rounded-2xl shadow-2xl shadow-emerald-900/20 border border-emerald-500/30",
            header: "bg-gradient-to-r from-emerald-950/40 to-[#252525] border-b border-emerald-500/30",
            badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-700",
            border: "border-emerald-400/50"
        };
    }
    if (category.includes('ETF모음')) {
        return {
            level: 'II',
            label,
            wrapper: "bg-[#1E242A] sm:rounded-2xl shadow-2xl shadow-blue-900/20 border border-blue-500/30",
            header: "bg-gradient-to-r from-blue-950/40 to-[#252525] border-b border-blue-500/30",
            badgeBg: "bg-gradient-to-br from-blue-400 to-indigo-700",
            border: "border-blue-400/50"
        };
    }
    if (category.includes('대형주')) {
        return {
            level: 'III',
            label,
            wrapper: "bg-[#2A1E2A] sm:rounded-2xl shadow-2xl shadow-purple-900/20 border border-purple-500/30",
            header: "bg-gradient-to-r from-purple-950/40 to-[#252525] border-b border-purple-500/30",
            badgeBg: "bg-gradient-to-br from-fuchsia-500 to-purple-800",
            border: "border-purple-400/50"
        };
    }
    if (category.includes('기대주')) {
        return {
            level: 'IV',
            label,
            wrapper: "bg-[#2A1E1E] sm:rounded-2xl shadow-2xl shadow-red-900/20 border border-red-500/40",
            header: "bg-gradient-to-r from-red-950/40 to-[#252525] border-b border-red-500/40",
            badgeBg: "bg-gradient-to-br from-orange-500 to-red-800",
            border: "border-red-500/50"
        };
    }

    return {
        level: '0',
        label,
        wrapper: "bg-[#1E1E1E] sm:rounded-2xl shadow-2xl shadow-black/50 border border-[#333]",
        header: "bg-[#252525] border-b border-[#333]",
        badgeBg: "bg-gradient-to-br from-gray-700 to-gray-900",
        border: "border-gray-700"
    };
};

// Color Constants for Consistency
const COLORS = {
    ma5: '#f97316',   // orange-500
    ma20: '#8b5cf6',  // violet-500
    ma60: '#3b82f6',  // blue-500
    ma120: '#22c55e', // green-500
    up: '#ef4444',    // red-500
    down: '#3b82f6',  // blue-500
    buyPrice: '#ef4444', // red-500
    main: '#F7D047',   // Main Chart Color (Yellow)
    targetLower: '#60a5fa' // blue-400 for lower target
};

interface StockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
    viewOnly?: boolean;
}

interface CandleData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    ma5?: number;
    ma20?: number;
    ma60?: number;
    ma120?: number;
}

interface InvestorData {
    stck_bsop_date: string;
    prsn_ntby_qty: string;
    frgn_ntby_qty: string;
    orgn_ntby_qty: string;
}

export default function StockDetailModal({ isOpen, onClose, asset, viewOnly = false }: StockDetailModalProps) {
    const { updateAsset, removeAsset, addTradeLog, updateTradeLog, removeTradeLog } = usePortfolio();
    const stockLive = useStockPrice(asset.symbol, 0, asset.category);

    const formatPrice = (val: number) => {
        const isKRW = asset.category === 'KR' || asset.category === 'GOLD';
        const formatted = formatCurrency(val, isKRW ? 'KRW' : 'USD');
        return isKRW ? `${formatted}원` : formatted;
    };

    // Local State for Chart
    const [history, setHistory] = useState<CandleData[]>([]);
    const [chartLoading, setChartLoading] = useState(true);
    const [chartError, setChartError] = useState(false);
    const [chartRetryTrigger, setChartRetryTrigger] = useState(0);

    // Local State for Investor Trend
    const [investorData, setInvestorData] = useState<InvestorData[]>([]);
    const [investorLoading, setInvestorLoading] = useState(true);
    const [investorError, setInvestorError] = useState(false);
    const [investorRetryTrigger, setInvestorRetryTrigger] = useState(0);

    // Local State for KOSPI Index Map
    const [kospiMap, setKospiMap] = useState<Record<string, string>>({});

    // Local State for Index Comparison
    const [showIndexComparison, setShowIndexComparison] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [benchmarkName, setBenchmarkName] = useState<string>('KOSPI');

    // Local State for Market Name (KOSPI / KOSDAQ)
    const [displayMarketName, setDisplayMarketName] = useState<string>(
        asset.category === 'GOLD' ? 'KRX 금현물' : asset.category === 'KR' ? 'KOSPI' : 'US'
    );

    // Logic for Benchmark
    const getBenchmarkInfo = (category: string) => {
        if (category === 'US') return { symbol: 'SPX', name: 'S&P 500', api: '/api/kis/index/overseas/SPX' };
        return { symbol: '0001', name: 'KOSPI', api: '/api/kis/index/domestic/0001' };
    };

    // Local State for Inputs (Goals)
    const [secondaryCategory, setSecondaryCategory] = useState(asset.secondary_category || '');
    const [memo, setMemo] = useState(asset.memo || '');
    const [targetLower, setTargetLower] = useState(asset.targetPriceLower?.toString() || '');
    const [targetUpper, setTargetUpper] = useState(asset.targetPriceUpper?.toString() || '');

    // Local State for New Trade Log
    const [newTrade, setNewTrade] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'BUY' as 'BUY' | 'SELL' | 'DIVIDEND',
        price: '',
        quantity: '',
        kospiIndex: '',
        memo: ''
    });
    const [isAddingLog, setIsAddingLog] = useState(false);
    const [editingTradeId, setEditingTradeId] = useState<number | null>(null);

    // --- Effects ---

    // 0. Body Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // 1. Fetch Chart Data (with auto-retry)
    const fetchChartData = useCallback(async () => {
        if (!isOpen || !asset.symbol) return;

        setChartLoading(true);
        setChartError(false);

        const maxRetries = 3;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (attempt > 0) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
            }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                // GOLD: no chart data available from KRX scraping
                if (asset.category === 'GOLD') {
                    setHistory([]);
                    setChartLoading(false);
                    return;
                }

                const res = await fetch(`/api/kis/chart/daily/${asset.symbol}?market=${asset.category}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const sorted = [...data].reverse().map(d => ({
                        date: d.stck_bsop_date,
                        open: parseFloat(d.stck_oprc),
                        high: parseFloat(d.stck_hgpr),
                        low: parseFloat(d.stck_lwpr),
                        close: parseFloat(d.stck_clpr),
                        volume: parseInt(d.acml_vol),
                    }));

                    const withMA = sorted.map((d, i) => {
                        const getSlice = (w: number) => i >= w - 1 ? sorted.slice(i - w + 1, i + 1) : [];
                        const avg = (arr: any[]) => arr.length ? arr.reduce((a, b) => a + b.close, 0) / arr.length : undefined;
                        return {
                            ...d,
                            ma5: avg(getSlice(5)),
                            ma20: avg(getSlice(20)),
                            ma60: avg(getSlice(60)),
                            ma120: avg(getSlice(120)),
                        };
                    });
                    setHistory(withMA);
                    setChartLoading(false);
                    return; // Success
                }
            } catch (e) {
                console.warn(`[Chart] Attempt ${attempt + 1} failed:`, e);
            }
        }
        // All retries failed
        setChartLoading(false);
        setChartError(true);
    }, [isOpen, asset.symbol, asset.category]);

    useEffect(() => {
        fetchChartData();

        // Sync local state
        if (isOpen && asset.symbol) {
            setSecondaryCategory(asset.secondary_category || '');
            setMemo(asset.memo || '');
            setTargetLower(asset.targetPriceLower?.toString() || '');
            setTargetUpper(asset.targetPriceUpper?.toString() || '');
            const benchmark = getBenchmarkInfo(asset.category);
            setBenchmarkName(benchmark.name);
        }
    }, [isOpen, asset.symbol, asset.category, chartRetryTrigger]);

    // Fetch Market Name (KOSPI/KOSDAQ) on open
    useEffect(() => {
        if (!isOpen || !asset.symbol) return;
        // GOLD: keep 'KRX 금현물' and don't fetch market name
        if (asset.category === 'GOLD') {
            setDisplayMarketName('KRX 금현물');
            return;
        }
        if (asset.category !== 'KR') {
            setDisplayMarketName('US');
            return;
        }
        const fetchMarketName = async () => {
            try {
                const res = await fetch(`/api/kis/price/domestic/${asset.symbol.replace('.KS', '')}`);
                if (!res.ok) return;
                const data = await res.json();
                const mktName = data?.rprs_mrkt_kor_name;
                if (mktName) {
                    setDisplayMarketName(mktName);
                }
            } catch (e) {
                // Silent fail - keep default
            }
        };
        fetchMarketName();
    }, [isOpen, asset.symbol, asset.category]);

    // 1.5 Fetch Investor Trend Data (with auto-retry)
    const fetchInvestorData = useCallback(async () => {
        if (!isOpen || !asset.symbol || asset.category !== 'KR') {
            setInvestorData([]);
            setInvestorLoading(false);
            return;
        }

        setInvestorLoading(true);
        setInvestorError(false);

        const cleanSymbol = asset.symbol.replace('.KS', '');
        const maxRetries = 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (attempt > 0) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
            }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(`/api/kis/market/investor?symbol=${cleanSymbol}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await res.json();
                if (data.daily && Array.isArray(data.daily) && data.daily.length > 0) {
                    setInvestorData(data.daily.slice(0, 7));
                    setInvestorLoading(false);
                    return; // Success
                }
            } catch (e) {
                console.warn(`[Investor] Attempt ${attempt + 1} failed:`, e);
            }
        }
        // All retries failed
        setInvestorLoading(false);
        setInvestorError(true);
    }, [isOpen, asset.symbol, asset.category]);

    useEffect(() => {
        fetchInvestorData();
    }, [isOpen, asset.symbol, asset.category, investorRetryTrigger]);

    // 2. Fetch Benchmark History
    useEffect(() => {
        if (isOpen && asset.symbol) {
            const benchmark = getBenchmarkInfo(asset.category);

            if (asset.trades && asset.trades.length > 0) {
                const dates = asset.trades.map(t => new Date(t.date).getTime());
                const minTime = Math.min(...dates);
                const minDate = new Date(minTime).toISOString().slice(0, 10).replace(/-/g, "");
                const now = new Date();
                const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
                const maxDate = kstDate.toISOString().slice(0, 10).replace(/-/g, "");

                fetch(`${benchmark.api}?startDate=${minDate}&endDate=${maxDate}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            const map: Record<string, string> = {};
                            let latestVal: number | null = null;
                            let latestDate = "";

                            data.forEach((item: any) => {
                                const date = item.stck_bsop_date;
                                const val = item.bstp_nmix_prpr || item.ovrs_nmix_prpr || item.clpr;
                                if (date && val) {
                                    const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
                                    map[formattedDate] = val;
                                    if (date > latestDate) {
                                        latestDate = date;
                                        latestVal = parseFloat(val);
                                    }
                                }
                            });
                            setKospiMap(map);
                            if (latestVal) setCurrentIndex(latestVal);
                        }
                    })
                    .catch(e => console.error("Failed to fetch Index history:", e));
            } else {
                const nowKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
                fetch(`${benchmark.api}?startDate=${nowKst}&endDate=${nowKst}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            const item = data[0];
                            const val = item.bstp_nmix_prpr || item.ovrs_nmix_prpr || item.clpr;
                            if (val) setCurrentIndex(parseFloat(val));
                        }
                    })
                    .catch(e => console.error("Failed to fetch current index:", e));
            }
        }
    }, [isOpen, asset.symbol, asset.category, asset.trades]);

    // 3. Auto-fetch Index for New Trade Date
    useEffect(() => {
        if ((isAddingLog || editingTradeId) && newTrade.date) {
            const benchmark = getBenchmarkInfo(asset.category);
            const dateStr = newTrade.date.replace(/-/g, "");

            fetch(`${benchmark.api}?startDate=${dateStr}&endDate=${dateStr}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const match = data.find((d: any) => d.stck_bsop_date === dateStr);
                        if (match) {
                            const val = match.bstp_nmix_prpr || match.ovrs_nmix_prpr || match.clpr;
                            setNewTrade(prev => ({ ...prev, kospiIndex: val }));
                        }
                    }
                })
                .catch(e => console.error(e));
        }
    }, [newTrade.date, isAddingLog, editingTradeId, asset.category]);

    // --- Handlers ---
    const isDirty = useMemo(() => {
        return (
            secondaryCategory !== (asset.secondary_category || '') ||
            memo !== (asset.memo || '') ||
            targetLower !== (asset.targetPriceLower?.toString() || '') ||
            targetUpper !== (asset.targetPriceUpper?.toString() || '')
        );
    }, [secondaryCategory, memo, targetLower, targetUpper, asset]);

    const handleClose = () => {
        if (isDirty) {
            if (confirm('저장되지 않은 대상 목표/분류 변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleSaveGoals = () => {
        if (!isDirty) return;
        updateAsset(asset.id, {
            secondary_category: secondaryCategory === '' ? null : secondaryCategory,
            memo,
            targetPriceLower: targetLower ? parseFloat(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseFloat(targetUpper.replace(/,/g, '')) : undefined,
        });
        alert('저장되었습니다.');
    };

    const handleSaveTrade = async () => {
        if (!newTrade.price || (newTrade.type !== 'DIVIDEND' && !newTrade.quantity)) {
            alert('가격과 수량(배당금 제외)을 모두 입력해주세요.');
            return;
        }
        const tradeData = {
            date: newTrade.date,
            type: newTrade.type,
            price: Number(newTrade.price),
            quantity: newTrade.type === 'DIVIDEND' && !newTrade.quantity ? 1 : Number(newTrade.quantity),
            kospiIndex: newTrade.kospiIndex ? Number(newTrade.kospiIndex) : undefined,
            memo: newTrade.memo
        };

        try {
            if (editingTradeId) {
                await updateTradeLog(editingTradeId, asset.id, tradeData);
            } else {
                await addTradeLog(asset.id, tradeData);
            }

            setNewTrade({ date: new Date().toISOString().split('T')[0], type: 'BUY', price: '', quantity: '', kospiIndex: '', memo: '' });
            setIsAddingLog(false);
            setEditingTradeId(null);
        } catch (e: any) {
            alert(`저장 중 오류가 발생했습니다. DB 타입 에러일 수 있습니다. 메시지: ${e.message}`);
        }
    };

    const handleEditTrade = (trade: any) => {
        setNewTrade({
            date: trade.date, type: trade.type, price: trade.price.toString(), quantity: trade.quantity.toString(),
            kospiIndex: trade.kospiIndex || trade.kospi_index || '', memo: trade.memo || ''
        });
        setEditingTradeId(trade.id);
        setIsAddingLog(true);
    };

    const handleDeleteTrade = async (tradeId: number) => {
        if (confirm('이 기록을 삭제하시겠습니까?')) {
            await removeTradeLog(tradeId, asset.id);
        }
    };

    const handleDeleteAsset = () => {
        if (confirm('정말로 이 종목을 삭제하시겠습니까?')) {
            removeAsset(asset.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    // View Data
    const currentPrice = stockLive?.price || (history.length > 0 ? history[history.length - 1].close : asset.pricePerShare);
    const changePercent = stockLive?.changePercent || 0;

    // 45 days for 1~2 months
    const displayData = history.slice(-45);

    // Valuation
    const totalPurchase = asset.pricePerShare * asset.quantity;
    const currentValuation = currentPrice * asset.quantity;
    const profitLoss = currentValuation - totalPurchase;
    const returnRate = totalPurchase > 0 ? (profitLoss / totalPurchase) * 100 : 0;
    const isPositive = profitLoss >= 0;

    const totalDividend = (asset.trades || [])
        .filter(t => t.type === 'DIVIDEND')
        .reduce((sum, t) => sum + (t.price * t.quantity), 0);

    // Out of bounds Logic for ReferenceLine
    const chartMax = displayData.length > 0 ? Math.max(...displayData.map(d => d.high)) : 0;
    const chartMin = displayData.length > 0 ? Math.min(...displayData.map(d => d.low)) : 0;
    const domainMax = chartMax * 1.05;
    const domainMin = chartMin * 0.95;

    let purchaseLineY = asset.pricePerShare;
    let purchaseLineLabel = `매입 ${formatPrice(asset.pricePerShare)}`;
    let isOutOfBounds = false;

    if (asset.pricePerShare > domainMax) {
        purchaseLineY = chartMax;
        purchaseLineLabel = `매입 ${formatPrice(asset.pricePerShare)} (▲)`;
        isOutOfBounds = true;
    } else if (asset.pricePerShare < domainMin) {
        purchaseLineY = chartMin;
        purchaseLineLabel = `매입 ${formatPrice(asset.pricePerShare)} (▼)`;
        isOutOfBounds = true;
    }

    // Lower Target Line
    let targetLowerLineY = asset.targetPriceLower || 0;
    let targetLowerLabel = asset.targetPriceLower ? `하한 ${formatPrice(asset.targetPriceLower)}` : '';
    let isTargetLowerOutOfBounds = false;

    if (asset.targetPriceLower) {
        if (asset.targetPriceLower > domainMax) {
            targetLowerLineY = chartMax;
            targetLowerLabel = `하한 ${formatPrice(asset.targetPriceLower)} (▲)`;
            isTargetLowerOutOfBounds = true;
        } else if (asset.targetPriceLower < domainMin) {
            targetLowerLineY = chartMin;
            targetLowerLabel = `하한 ${formatPrice(asset.targetPriceLower)} (▼)`;
            isTargetLowerOutOfBounds = true;
        }
    }

    // Goal Return Rates
    const getGoalRate = (target: string) => {
        if (!target || !asset.pricePerShare) return null;
        const t = parseFloat(target.replace(/,/g, ''));
        if (isNaN(t)) return null;
        return ((t - asset.pricePerShare) / asset.pricePerShare) * 100;
    };
    const lowerRate = getGoalRate(targetLower);
    const upperRate = getGoalRate(targetUpper);

    // Investor Data helpers
    const formatInvestorQty = (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return '-';
        const abs = Math.abs(num);
        const formatted = abs >= 10000 ? `${(abs / 10000).toFixed(0)}만` : abs.toLocaleString();
        return `${num >= 0 ? '+' : '-'}${formatted}`;
    };

    const todayInvestor = investorData.length > 0 ? investorData[0] : null;

    const getBarWidth = (val: string, maxVal: number) => {
        const num = Math.abs(parseInt(val) || 0);
        if (maxVal === 0) return 0;
        return Math.min((num / maxVal) * 100, 100);
    };

    const investorMaxVal = todayInvestor ? Math.max(
        Math.abs(parseInt(todayInvestor.prsn_ntby_qty) || 0),
        Math.abs(parseInt(todayInvestor.frgn_ntby_qty) || 0),
        Math.abs(parseInt(todayInvestor.orgn_ntby_qty) || 0)
    ) : 0;

    const themeStyle = getCategoryStyle(secondaryCategory);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
            <div className={`${themeStyle.wrapper} w-full h-full sm:w-[90%] max-w-5xl sm:h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>

                {/* ======= HEADER ======= */}
                <div className={`p-3 sm:p-6 flex justify-between items-start flex-shrink-0 ${themeStyle.header}`}>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div>
                            <div className="hidden sm:flex items-center gap-2 text-gray-400 text-xs mb-0.5 font-medium">
                                <span>{asset.symbol}</span>
                                <span className="text-gray-600">|</span>
                                <span>{displayMarketName}</span>
                                {asset.sector && (<><span className="text-gray-600">|</span><span>{asset.sector}</span></>)}
                            </div>
                            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight max-w-[200px] sm:max-w-none truncate">{asset.name || asset.symbol}</h2>
                        </div>
                        <div className="border-l border-[#333] pl-3 sm:pl-6">
                            <div className={`text-xl sm:text-3xl font-bold ${changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {formatPrice(currentPrice)}
                            </div>
                            <div className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {changePercent >= 0 ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {themeStyle.level !== '0' && (
                            <div className={`px-2 py-1 lg:px-3 rounded-md ${themeStyle.badgeBg} border ${themeStyle.border} flex items-center gap-1.5 shadow-sm mr-1 sm:mr-2`}>
                                <span className="font-bold italic text-xs text-white tracking-wider">
                                    Lv.{themeStyle.level}
                                </span>
                                <span className="w-px h-2.5 bg-white/30 hidden sm:block"></span>
                                <span className="text-[10px] sm:text-xs font-bold text-white/90 hidden sm:block">
                                    {themeStyle.label}
                                </span>
                            </div>
                        )}
                        {!viewOnly && (
                            <button
                                onClick={handleSaveGoals}
                                disabled={!isDirty}
                                className={`p-2 rounded-lg transition ${isDirty ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-[#333] text-gray-500 cursor-not-allowed'}`}
                                title="저장"
                            >
                                <Save size={20} />
                            </button>
                        )}
                        <button onClick={handleClose} className="p-2 text-gray-500 hover:text-white hover:bg-[#333] rounded-lg transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ======= BODY ======= */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                    {/* ---- ROW 1: Chart (2col) + Investor Trend (1col) ---- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Chart Block */}
                        <div className="lg:col-span-2 bg-[#252525] rounded-2xl p-4 sm:p-5 border border-[#333] relative">
                            {/* Chart Header */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3 text-gray-500 text-xs font-medium">
                                    <span>이동평균선</span>
                                    <div className="flex gap-2 text-[10px]">
                                        <span style={{ color: COLORS.ma5 }}>■ 5</span>
                                        <span style={{ color: COLORS.ma20 }}>■ 20</span>
                                        <span style={{ color: COLORS.ma60 }}>■ 60</span>
                                        <span style={{ color: COLORS.ma120 }}>■ 120</span>
                                    </div>
                                </div>
                                <div className="bg-[#333] rounded-md px-2 py-1 text-[10px] font-bold text-gray-400">일봉 45일</div>
                            </div>

                            {/* Price Chart */}
                            <div className="h-[250px] sm:h-[400px] w-full">
                                {chartLoading ? (
                                    <div className="h-full flex items-center justify-center text-gray-600">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    </div>
                                ) : chartError || history.length === 0 ? (
                                    <StockLoadError
                                        message="차트 데이터를 불러올 수 없습니다"
                                        onRetry={() => setChartRetryTrigger(prev => prev + 1)}
                                        variant="section"
                                        retrying={chartLoading}
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={displayData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }} syncId="stockDetail">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                orientation="right"
                                                tick={{ fontSize: 10, fill: '#666' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                                labelStyle={{ color: '#999' }}
                                            />
                                            <Line type="monotone" dataKey="ma5" stroke={COLORS.ma5} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma20" stroke={COLORS.ma20} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma60" stroke={COLORS.ma60} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma120" stroke={COLORS.ma120} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="close" stroke={COLORS.main} strokeWidth={2} dot={false} />

                                            {/* Avg Purchase Price Line */}
                                            {asset.pricePerShare > 0 && (
                                                <ReferenceLine
                                                    y={purchaseLineY}
                                                    stroke={COLORS.buyPrice}
                                                    strokeDasharray="5 3"
                                                    strokeWidth={1.5}
                                                    label={{
                                                        value: purchaseLineLabel,
                                                        fill: COLORS.buyPrice,
                                                        fontSize: 10,
                                                        fontWeight: 'bold',
                                                        position: isOutOfBounds ? 'insideBottomRight' : 'insideRight',
                                                        dy: isOutOfBounds && purchaseLineY === chartMax ? 10 : (isOutOfBounds && purchaseLineY === chartMin ? -10 : -10)
                                                    }}
                                                />
                                            )}

                                            {/* Lower Target Price Line */}
                                            {asset.targetPriceLower && asset.targetPriceLower > 0 && (
                                                <ReferenceLine
                                                    y={targetLowerLineY}
                                                    stroke={COLORS.targetLower}
                                                    strokeDasharray="8 4"
                                                    strokeWidth={1.5}
                                                    label={{
                                                        value: targetLowerLabel,
                                                        fill: COLORS.targetLower,
                                                        fontSize: 10,
                                                        fontWeight: 'bold',
                                                        position: isTargetLowerOutOfBounds ? 'insideBottomRight' : 'insideRight',
                                                        dy: isTargetLowerOutOfBounds && targetLowerLineY === chartMax ? 20 : (isTargetLowerOutOfBounds && targetLowerLineY === chartMin ? -10 : 5)
                                                    }}
                                                />
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Volume Chart */}
                            <div className="h-14 mt-1 border-t border-[#333] relative">
                                <span className="absolute top-1 left-0 text-[9px] text-gray-600 font-bold">거래량</span>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={displayData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }} syncId="stockDetail">
                                        <Bar dataKey="volume" fill="#444" />
                                        <YAxis orientation="right" tick={false} axisLine={false} tickLine={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Investor Trend Block */}
                        <div className="bg-[#252525] rounded-2xl p-5 border border-[#333] flex flex-col">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                📊 투자자 동향
                                {asset.category !== 'KR' && <span className="text-[10px] text-gray-600 font-normal">(국내주식만 지원)</span>}
                            </h3>

                            {asset.category !== 'KR' ? (
                                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">해외주식은 미지원</div>
                            ) : investorLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : investorError || !todayInvestor ? (
                                <StockLoadError
                                    message="투자자 동향을 불러올 수 없습니다"
                                    onRetry={() => setInvestorRetryTrigger(prev => prev + 1)}
                                    variant="section"
                                    retrying={investorLoading}
                                />
                            ) : (
                                <>
                                    {/* Today Summary Bars */}
                                    <div className="space-y-3 mb-5">
                                        {[
                                            { label: '개인', val: todayInvestor.prsn_ntby_qty },
                                            { label: '외국인', val: todayInvestor.frgn_ntby_qty },
                                            { label: '기관', val: todayInvestor.orgn_ntby_qty },
                                        ].map(({ label, val }) => {
                                            const num = parseInt(val) || 0;
                                            const isPos = num >= 0;
                                            const width = getBarWidth(val, investorMaxVal);
                                            return (
                                                <div key={label} className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400 w-10 flex-shrink-0">{label}</span>
                                                    <span className={`text-xs font-bold w-16 text-right flex-shrink-0 ${isPos ? 'text-red-400' : 'text-blue-400'}`}>
                                                        {formatInvestorQty(val)}
                                                    </span>
                                                    <div className="flex-1 h-4 bg-[#1E1E1E] rounded-sm overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-sm transition-all duration-500 ${isPos ? 'bg-red-500/60' : 'bg-blue-500/60'}`}
                                                            style={{ width: `${width}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Daily Table */}
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-[11px]">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-[#333]">
                                                    <th className="text-left py-1.5 font-medium">일자</th>
                                                    <th className="text-right py-1.5 font-medium">개인</th>
                                                    <th className="text-right py-1.5 font-medium">외국인</th>
                                                    <th className="text-right py-1.5 font-medium">기관</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {investorData.map((row, idx) => {
                                                    const dateStr = row.stck_bsop_date;
                                                    const display = dateStr ? `${dateStr.slice(2, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}` : '-';
                                                    return (
                                                        <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[#1E1E1E] transition">
                                                            <td className="py-1.5 text-gray-400 font-mono">{idx === 0 ? '오늘' : display}</td>
                                                            <td className={`py-1.5 text-right font-bold ${parseInt(row.prsn_ntby_qty) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {formatInvestorQty(row.prsn_ntby_qty)}
                                                            </td>
                                                            <td className={`py-1.5 text-right font-bold ${parseInt(row.frgn_ntby_qty) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {formatInvestorQty(row.frgn_ntby_qty)}
                                                            </td>
                                                            <td className={`py-1.5 text-right font-bold ${parseInt(row.orgn_ntby_qty) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {formatInvestorQty(row.orgn_ntby_qty)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ---- ROW 1.5: Detailed Financials (OpenDART + KIS) ---- */}
                    {asset.category === 'KR' && (
                        <div className="bg-[#252525] rounded-2xl p-6 border border-[#333] mb-4">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                📈 기업 재무 분석
                                <span className="text-[10px] text-gray-500 font-normal ml-1">
                                    (OpenDART 데이터 활용)
                                </span>
                            </h3>
                            <FinancialGrid symbol={asset.symbol} />
                        </div>
                    )}

                    {/* ---- ROW 2: Holdings Info (left) + Goals (right) ---- */}
                    {!viewOnly && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Holdings Summary */}
                        <div className="bg-[#252525] rounded-2xl p-6 border border-[#333]">
                            <h3 className="text-sm font-bold text-white mb-4">💰 매입 정보</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 mb-1">매입금액</div>
                                    <div className="text-lg font-bold text-white">{formatPrice(totalPurchase)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 mb-1">매입단가</div>
                                    <div className="text-lg font-bold text-white">{formatPrice(asset.pricePerShare)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 mb-1">보유수량</div>
                                    <div className="text-lg font-bold text-white">{asset.quantity.toLocaleString()}주</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-[#333] flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-gray-500 mb-1">평가손익</div>
                                    <div className={`text-2xl font-bold ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
                                        {formatPrice(profitLoss)}
                                        <span className="text-sm ml-2 font-medium">{isPositive ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-2 mb-0.5">평가총액</div>
                                    <div className="text-lg font-bold text-white">{formatPrice(currentValuation)}</div>

                                    {totalDividend > 0 && (
                                        <>
                                            <div className="text-[10px] text-gray-500 mt-2 mb-0.5">배당금 합계</div>
                                            <div className="text-lg font-bold text-yellow-400">{formatPrice(totalDividend)}</div>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setShowIndexComparison(true)}
                                        className="bg-[#333] hover:bg-[#444] text-gray-300 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition text-xs"
                                    >
                                        📊 지수비교
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Goals */}
                        <div className="bg-[#252525] rounded-2xl p-6 border border-[#333]">
                            <h3 className="text-sm font-bold text-white mb-4">🎯 목표 및 분류</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">2차 카테고리 (분류/레벨)</label>
                                    <select
                                        value={secondaryCategory}
                                        onChange={(e) => setSecondaryCategory(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none"
                                    >
                                        <option value="">미분류 (Lv.0)</option>
                                        <option value="배당주(별1개)">배당주 (Lv.1)</option>
                                        <option value="ETF모음(별2개)">ETF모음 (Lv.2)</option>
                                        <option value="대형주(별3개)">대형주 (Lv.3)</option>
                                        <option value="기대주(별4개)">기대주 (Lv.4)</option>
                                    </select>
                                    <p className="text-[9px] text-gray-500 mt-1">* 선택한 카테고리에 따라 포트폴리오 카드의 랭크 색상이 변경됩니다.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">목표</label>
                                    <input
                                        type="text"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                        className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder-gray-600"
                                        placeholder="투자 목표 입력..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                                            {(() => {
                                                const tl = targetLower ? parseFloat(targetLower.replace(/,/g, '')) : 0;
                                                const dist = currentPrice > 0 && tl > 0 ? ((currentPrice - tl) / currentPrice) * 100 : null;
                                                const isDanger = dist !== null && dist <= 0;
                                                const isWarning = dist !== null && dist > 0 && dist <= 3;
                                                return (
                                                    <>
                                                        <span className={isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-500'}>
                                                            {isDanger ? '⚠️ 하한 목표 (SUPPORT)' : isWarning ? '⚡ 하한 목표 (SUPPORT)' : '하한 목표 (SUPPORT)'}
                                                        </span>
                                                        <span className="group/help relative inline-flex">
                                                            <HelpCircle size={10} className="text-blue-400/50 cursor-help" />
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] bg-[#333] text-gray-200 whitespace-nowrap opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-50">최고가 대비 비율</span>
                                                        </span>
                                                        {dist !== null && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDanger ? 'bg-red-900/30 text-red-400' : isWarning ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'
                                                                }`}>
                                                                ({dist > 0 ? '-' : '+'}{Math.abs(dist).toFixed(1)}%)
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </label>
                                        <input
                                            type="number"
                                            value={targetLower}
                                            onChange={(e) => setTargetLower(e.target.value)}
                                            className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 font-bold text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder-gray-600"
                                            placeholder="목표가"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1 justify-end">
                                            <span className="group/help relative inline-flex">
                                                <HelpCircle size={10} className="text-red-400/50 cursor-help" />
                                                <span className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded text-[10px] bg-[#333] text-gray-200 whitespace-nowrap opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-50">AVG대비 비율</span>
                                            </span>
                                            상한 목표 (RESIST)
                                            {upperRate !== null && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${upperRate >= 0 ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                    {upperRate > 0 ? '+' : ''}{upperRate.toFixed(1)}%
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="number"
                                            value={targetUpper}
                                            onChange={(e) => setTargetUpper(e.target.value)}
                                            className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 font-bold text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder-gray-600"
                                            placeholder="목표가"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}

                    {/* ---- ROW 3: Trade Log ---- */}
                    {!viewOnly && <div className="bg-[#252525] rounded-2xl p-6 border border-[#333] pb-8">
                        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                            <h3 className="text-sm font-bold text-white">📋 거래 내역</h3>
                            <button
                                onClick={() => setIsAddingLog(!isAddingLog)}
                                className="text-xs font-bold text-gray-400 hover:text-indigo-400 flex items-center gap-1 transition"
                            >
                                <Plus size={14} /> 기록 추가
                            </button>
                        </div>

                        {/* Add Form */}
                        {isAddingLog && (
                            <div className="bg-[#1E1E1E] rounded-xl p-4 mb-4 border border-[#333] grid grid-cols-6 gap-3 items-end">
                                <div className="col-span-1">
                                    <label className="text-[10px] text-gray-500 mb-1 block">날짜</label>
                                    <input type="date" value={newTrade.date} onChange={e => setNewTrade({ ...newTrade, date: e.target.value })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 mb-1 block">구분</label>
                                    <select value={newTrade.type} onChange={e => setNewTrade({ ...newTrade, type: e.target.value as 'BUY' | 'SELL' | 'DIVIDEND' })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs">
                                        <option value="BUY">매수</option>
                                        <option value="SELL">매도</option>
                                        <option value="DIVIDEND">배당금</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 mb-1 block">가격</label>
                                    <input type="number" placeholder="0" value={newTrade.price} onChange={e => setNewTrade({ ...newTrade, price: e.target.value })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 mb-1 block">수량</label>
                                    <input type="number" placeholder="0" value={newTrade.quantity} onChange={e => setNewTrade({ ...newTrade, quantity: e.target.value })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs" />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-500 mb-1 block">메모</label>
                                            <input type="text" placeholder="메모" value={newTrade.memo} onChange={e => setNewTrade({ ...newTrade, memo: e.target.value })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs" />
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[10px] text-gray-500 mb-1 block">지수</label>
                                            <input type="text" placeholder="지수" value={newTrade.kospiIndex} onChange={e => setNewTrade({ ...newTrade, kospiIndex: e.target.value })} className="w-full h-9 px-2 rounded-lg bg-[#121212] border border-[#333] text-white text-xs font-mono" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={handleSaveTrade} className="bg-indigo-600 text-white h-9 px-2 rounded-lg font-bold hover:bg-indigo-500 flex-1 text-xs">{editingTradeId ? '수정' : '추가'}</button>
                                    {editingTradeId && (
                                        <>
                                            <button onClick={() => handleDeleteTrade(editingTradeId)} className="bg-red-900/30 text-red-400 h-9 px-2 rounded-lg font-bold hover:bg-red-900/50 text-xs">삭제</button>
                                            <button onClick={() => { setIsAddingLog(false); setEditingTradeId(null); }} className="bg-[#333] text-gray-400 h-9 px-2 rounded-lg font-bold hover:bg-[#444] text-xs">취소</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Trade List */}
                        <div className="w-full text-xs">
                            {/* Header: Hidden on Mobile */}
                            <div className="hidden sm:grid grid-cols-7 text-gray-500 font-bold border-b border-[#333] pb-2 mb-2">
                                <div>날짜</div>
                                <div>구분</div>
                                <div>가격</div>
                                <div>{benchmarkName}</div>
                                <div className="text-center">수량</div>
                                <div>메모</div>
                                <div className="text-right">관리</div>
                            </div>

                            <div className="space-y-4 sm:space-y-2">
                                {asset.trades && asset.trades.length > 0 ? (
                                    asset.trades.map((trade) => (
                                        <div key={trade.id} className="group relative bg-[#1E1E1E] sm:bg-transparent p-4 sm:p-2 sm:py-3 rounded-xl sm:rounded-lg border border-[#333] sm:border-b sm:border-[#333] sm:border-t-0 sm:border-l-0 sm:border-r-0 sm:grid sm:grid-cols-7 sm:items-center sm:hover:bg-[#1E1E1E] transition">

                                            {/* Mobile Card View */}
                                            <div className="sm:hidden flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.type === 'BUY' ? 'bg-red-900/30 text-red-400' : trade.type === 'SELL' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                                            {trade.type === 'BUY' ? '매수' : trade.type === 'SELL' ? '매도' : '배당'}
                                                        </span>
                                                        <span className="font-mono text-gray-400 text-[10px]">{trade.date}</span>
                                                    </div>
                                                    <button onClick={() => handleEditTrade(trade)} className="text-gray-500 p-2 bg-[#333] rounded-lg active:scale-95 transition"><Edit3 size={14} /></button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-base">{formatPrice(trade.price)}</span>
                                                        <span className="text-gray-500 text-sm">x {trade.quantity}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono">
                                                        지수: {trade.kospiIndex ? Number(trade.kospiIndex).toLocaleString() : (kospiMap[trade.date] ? Number(kospiMap[trade.date]).toLocaleString() : '-')}
                                                    </div>
                                                </div>
                                                {trade.memo && (
                                                    <div className="text-[11px] text-gray-600 bg-[#151515] p-2 rounded truncate">
                                                        {trade.memo}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Desktop Grid View */}
                                            <div className="hidden sm:contents">
                                                <div className="font-mono text-gray-400">{trade.date}</div>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.type === 'BUY' ? 'bg-red-900/30 text-red-400' : trade.type === 'SELL' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                                        {trade.type === 'BUY' ? '매수' : trade.type === 'SELL' ? '매도' : '배당'}
                                                    </span>
                                                </div>
                                                <div className="font-medium text-white">{formatPrice(trade.price)}</div>
                                                <div className="text-gray-500 font-mono text-[10px]">
                                                    {trade.kospiIndex ? (
                                                        <span>{Number(trade.kospiIndex).toLocaleString()}</span>
                                                    ) : (kospiMap[trade.date] ? (
                                                        <span>{Number(kospiMap[trade.date]).toLocaleString()}</span>
                                                    ) : '-')}
                                                </div>
                                                <div className="text-center">{trade.quantity}</div>
                                                <div className="truncate text-gray-500 pr-2">{trade.memo || '-'}</div>
                                                <div className="text-right">
                                                    <button onClick={() => handleEditTrade(trade)} className="text-gray-500 hover:text-indigo-400 transition p-1 rounded hover:bg-[#333] inline-flex items-center justify-center"><Edit3 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-600 py-6">기록된 거래 내역이 없습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* Delete Asset */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleDeleteAsset}
                                className="text-gray-600 font-bold text-xs hover:text-red-500 transition flex items-center justify-center gap-1 mx-auto"
                            >
                                <Trash2 size={14} /> 종목 삭제
                            </button>
                        </div>
                    </div>}
                </div>
            </div>

            {/* ======= INDEX COMPARISON OVERLAY ======= */}
            {showIndexComparison && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl shadow-black/50 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-[#333]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center bg-[#252525]">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    📊 지수대비 수익률 비교
                                </h3>
                                <p className="text-gray-500 text-xs mt-1">
                                    매수 시점의 시장 지수와 현재 지수를 비교합니다. (현재 지수: <span className="font-bold text-white">{currentIndex ? currentIndex.toLocaleString() : '-'}</span>)
                                </p>
                            </div>
                            <button onClick={() => setShowIndexComparison(false)} className="p-2 hover:bg-[#333] text-gray-500 hover:text-white rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-[#252525] rounded-xl border border-[#333] overflow-hidden">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-[#1E1E1E] text-gray-500 font-medium">
                                        <tr className="border-b border-[#333]">
                                            <th className="px-3 py-2 text-left">거래일자</th>
                                            <th className="px-3 py-2">수량</th>
                                            <th className="px-3 py-2">매수가</th>
                                            <th className="px-3 py-2">합계금액</th>
                                            <th className="px-3 py-2">현재가</th>
                                            <th className="px-3 py-2 border-l border-[#333] text-indigo-400">지수(매수)</th>
                                            <th className="px-3 py-2 text-indigo-400">지수(현재)</th>
                                            <th className="px-3 py-2 border-l border-[#333]">주가수익률</th>
                                            <th className="px-3 py-2">지수수익률</th>
                                            <th className="px-3 py-2 bg-[#333]/50 text-white">초과성과</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#333]">
                                        {asset.trades?.filter((t: any) => t.type === 'BUY').map((trade: any, idx: number) => {
                                            const buyIndex = trade.kospiIndex ? Number(trade.kospiIndex) : (kospiMap[trade.date] ? Number(kospiMap[trade.date]) : null);
                                            const stockReturn = trade.price ? ((currentPrice - trade.price) / trade.price) * 100 : 0;
                                            const indexReturn = (buyIndex && currentIndex) ? ((currentIndex - buyIndex) / buyIndex) * 100 : null;
                                            const alpha = indexReturn !== null ? stockReturn - indexReturn : null;
                                            const totalAmount = trade.price * trade.quantity;

                                            return (
                                                <tr key={trade.id || idx} className="hover:bg-[#1E1E1E] transition text-gray-300">
                                                    <td className="px-3 py-2 text-left font-mono text-gray-400 whitespace-nowrap">{trade.date}</td>
                                                    <td className="px-3 py-2">{trade.quantity.toLocaleString()}</td>
                                                    <td className="px-3 py-2 font-medium text-white">{formatPrice(trade.price)}</td>
                                                    <td className="px-3 py-2">{formatPrice(totalAmount)}</td>
                                                    <td className="px-3 py-2 text-gray-400">{formatPrice(currentPrice)}</td>
                                                    <td className="px-3 py-2 border-l border-[#333] text-gray-400">{buyIndex ? buyIndex.toLocaleString() : '-'}</td>
                                                    <td className="px-3 py-2 text-gray-500">{currentIndex ? currentIndex.toLocaleString() : '-'}</td>
                                                    <td className={`px-3 py-2 border-l border-[#333] font-bold ${stockReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                        {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                                                    </td>
                                                    <td className={`px-3 py-2 font-bold ${indexReturn !== null ? (indexReturn >= 0 ? 'text-red-400' : 'text-blue-400') : 'text-gray-600'}`}>
                                                        {indexReturn !== null ? `${indexReturn > 0 ? '+' : ''}${indexReturn.toFixed(2)}%` : '-'}
                                                    </td>
                                                    <td className={`px-3 py-2 font-bold bg-[#333]/30 ${alpha !== null ? (alpha >= 0 ? 'text-red-400' : 'text-blue-400') : 'text-gray-600'}`}>
                                                        {alpha !== null ? `${alpha > 0 ? '+' : ''}${alpha.toFixed(2)}%p` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!asset.trades || asset.trades.filter((t: any) => t.type === 'BUY').length === 0) && (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-gray-600">
                                                    매수 기록이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 text-[10px] text-gray-600 text-right">
                                * 초과 성과 = 주가 수익률 - 지수 수익률
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
