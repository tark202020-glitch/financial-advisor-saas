"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Edit3, Trash2, Save, Plus } from 'lucide-react';
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

// Color Constants for Consistency
const COLORS = {
    ma5: '#f97316',   // orange-500
    ma20: '#8b5cf6',  // violet-500
    ma60: '#3b82f6',  // blue-500
    ma120: '#22c55e', // green-500
    up: '#ef4444',    // red-500
    down: '#3b82f6',  // blue-500
    buyPrice: '#ef4444' // red-500
};

interface StockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
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

export default function StockDetailModal({ isOpen, onClose, asset }: StockDetailModalProps) {
    const { updateAsset, removeAsset, addTradeLog, updateTradeLog, removeTradeLog } = usePortfolio();
    const stockLive = useStockPrice(asset.symbol, 0, asset.category);

    // Local State for Chart
    const [history, setHistory] = useState<CandleData[]>([]);
    const [chartLoading, setChartLoading] = useState(true);

    // Local State for KOSPI Index Map
    const [kospiMap, setKospiMap] = useState<Record<string, string>>({});

    // Local State for Index Comparison
    const [showIndexComparison, setShowIndexComparison] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [benchmarkName, setBenchmarkName] = useState<string>('KOSPI'); // Default

    // Logic for Benchmark
    const getBenchmarkInfo = (category: string) => {
        if (category === 'US') return { symbol: 'SPX', name: 'S&P 500', api: '/api/kis/index/overseas/SPX' };
        return { symbol: '0001', name: 'KOSPI', api: '/api/kis/index/domestic/0001' };
    };

    // Local State for Inputs (Goals)
    const [memo, setMemo] = useState(asset.memo || '');
    const [targetLower, setTargetLower] = useState(asset.targetPriceLower?.toString() || '');
    const [targetUpper, setTargetUpper] = useState(asset.targetPriceUpper?.toString() || '');

    // Local State for New Trade Log
    const [newTrade, setNewTrade] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'BUY' as 'BUY' | 'SELL',
        price: '',
        quantity: '',
        kospiIndex: '',
        memo: ''
    });
    const [isAddingLog, setIsAddingLog] = useState(false);
    const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
    // --- Effects ---

    // 1. Fetch Chart Data
    // 1. Fetch Chart Data (Depend only on symbol/category/isOpen)
    useEffect(() => {
        if (isOpen && asset.symbol) {
            setChartLoading(true);
            // Append market query param
            fetch(`/api/kis/chart/daily/${asset.symbol}?market=${asset.category}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const sorted = [...data].reverse().map(d => ({
                            date: d.stck_bsop_date,
                            open: parseFloat(d.stck_oprc),
                            high: parseFloat(d.stck_hgpr),
                            low: parseFloat(d.stck_lwpr),
                            close: parseFloat(d.stck_clpr),
                            volume: parseInt(d.acml_vol),
                        }));

                        // Calculate MAs
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
                        // Limit to last 100 or so for performance if needed, but displayData slices it anyway.
                        // Actually displayData slices -30.
                        setHistory(withMA);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setChartLoading(false));

            // Sync local state with asset prop changes (Only when modal opens or asset changes essentially)
            setMemo(asset.memo || '');
            setTargetLower(asset.targetPriceLower?.toString() || '');
            setTargetUpper(asset.targetPriceUpper?.toString() || '');

            // Determine Benchmark
            const benchmark = getBenchmarkInfo(asset.category);
            setBenchmarkName(benchmark.name);
        }
    }, [isOpen, asset.symbol, asset.category]); // Removed 'asset' dependence to avoid reload on trade updates

    // 1.5 Fetch Benchmark History (Depends on asset.trades)
    useEffect(() => {
        if (isOpen && asset.symbol) {
            const benchmark = getBenchmarkInfo(asset.category);

            // Fetch Benchmark History for Trades
            if (asset.trades && asset.trades.length > 0) {
                const dates = asset.trades.map(t => new Date(t.date).getTime());
                const minTime = Math.min(...dates);

                const minDate = new Date(minTime).toISOString().slice(0, 10).replace(/-/g, "");
                const now = new Date();
                const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
                const maxDate = kstDate.toISOString().slice(0, 10).replace(/-/g, "");

                const fetchUrl = `${benchmark.api}?startDate=${minDate}&endDate=${maxDate}`;

                fetch(fetchUrl)
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
    }, [isOpen, asset.symbol, asset.category, asset.trades]); // Re-run when trades change


    // 2. Auto-fetch Index for New Trade Date (Manual Entry)
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

    const handleSaveGoals = () => {
        updateAsset(asset.id, {
            memo,
            targetPriceLower: targetLower ? parseFloat(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseFloat(targetUpper.replace(/,/g, '')) : undefined,
        });
    };

    const handleSaveTrade = async () => {
        if (!newTrade.price || !newTrade.quantity) return;

        const tradeData = {
            date: newTrade.date,
            type: newTrade.type,
            price: Number(newTrade.price),
            quantity: Number(newTrade.quantity),
            kospiIndex: newTrade.kospiIndex ? Number(newTrade.kospiIndex) : undefined,
            memo: newTrade.memo
        };

        if (editingTradeId) {
            await updateTradeLog(editingTradeId, asset.id, tradeData);
        } else {
            await addTradeLog(asset.id, tradeData);
        }

        setNewTrade({
            date: new Date().toISOString().split('T')[0],
            type: 'BUY',
            price: '',
            quantity: '',
            kospiIndex: '',
            memo: ''
        });
        setIsAddingLog(false);
        setEditingTradeId(null);
    };

    const handleEditTrade = (trade: any) => {
        setNewTrade({
            date: trade.date,
            type: trade.type,
            price: trade.price.toString(),
            quantity: trade.quantity.toString(),
            kospiIndex: trade.kospiIndex || trade.kospi_index || '', // Handle different prop names
            memo: trade.memo || ''
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

    // Change: 60 -> 30 days
    const displayData = history.slice(-30);

    // Valuation
    const totalPurchase = asset.pricePerShare * asset.quantity;
    const currentValuation = currentPrice * asset.quantity;
    const profitLoss = currentValuation - totalPurchase;
    const returnRate = (profitLoss / totalPurchase) * 100;
    const isPositive = profitLoss >= 0;

    // Out of bounds Logic for ReferenceLine
    const chartMax = displayData.length > 0 ? Math.max(...displayData.map(d => d.high)) : 0;
    const chartMin = displayData.length > 0 ? Math.min(...displayData.map(d => d.low)) : 0;

    // Safety buffer for auto domain (approx 5-10%)
    const domainMax = chartMax * 1.05;
    const domainMin = chartMin * 0.95;

    let purchaseLineY = asset.pricePerShare;
    let purchaseLineLabel = `매입단가 ${asset.pricePerShare.toLocaleString()}`;
    let isOutOfBounds = false;

    if (asset.pricePerShare > domainMax) {
        purchaseLineY = chartMax; // Pin to top
        purchaseLineLabel = `매입단가 ${asset.pricePerShare.toLocaleString()} (▲)`;
        isOutOfBounds = true;
    } else if (asset.pricePerShare < domainMin) {
        purchaseLineY = chartMin; // Pin to bottom
        purchaseLineLabel = `매입단가 ${asset.pricePerShare.toLocaleString()} (▼)`;
        isOutOfBounds = true;
    }

    // Goal Return Rates
    const getGoalRate = (target: string) => {
        if (!target || !asset.pricePerShare) return null;
        const t = parseFloat(target.replace(/,/g, ''));
        if (isNaN(t)) return null;
        const r = ((t - asset.pricePerShare) / asset.pricePerShare) * 100;
        return r;
    };
    const lowerRate = getGoalRate(targetLower);
    const upperRate = getGoalRate(targetUpper);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-start bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <span>{asset.symbol}</span>
                            <span className="text-slate-300">|</span>
                            <span>{asset.category === 'KR' ? 'KOSPI' : 'US'}</span>
                            {asset.sector && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <span>{asset.sector}</span>
                                </>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{asset.name || asset.symbol}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSaveGoals} className="text-slate-500 hover:text-indigo-600 font-bold transition">저장</button>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold transition">닫기</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">

                    {/* Top Section: Chart & Holdings Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Chart (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative">
                            {/* Chart Header (Price & Legend) */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1">
                                        가격(수정)
                                        <div className="flex gap-2 text-[10px] ml-2">
                                            <span style={{ color: COLORS.ma5 }}>■ 5</span>
                                            <span style={{ color: COLORS.ma20 }}>■ 20</span>
                                            <span style={{ color: COLORS.ma60 }}>■ 60</span>
                                            <span style={{ color: COLORS.ma120 }}>■ 120</span>
                                        </div>
                                    </div>
                                    <div className={`text-4xl font-bold ${changePercent >= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {currentPrice.toLocaleString()}
                                    </div>
                                    <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${changePercent >= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {changePercent >= 0 ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                                        <span className="text-slate-400 font-normal ml-1">{currentPrice - (stockLive?.change || 0)}</span>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                                    30일
                                </div>
                            </div>

                            {/* Chart Body */}
                            <div className="h-[300px] w-full">
                                {chartLoading ? (
                                    <div className="h-full flex items-center justify-center text-slate-300">Loading Chart...</div>
                                ) : history.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span className="text-sm">차트 데이터를 불러올 수 없습니다</span>
                                        <span className="text-xs text-slate-300">현재가 및 포트폴리오 정보는 정상 표시됩니다</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} syncId="stockDetail">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                orientation="right"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Line type="monotone" dataKey="ma5" stroke={COLORS.ma5} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma20" stroke={COLORS.ma20} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma60" stroke={COLORS.ma60} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma120" stroke={COLORS.ma120} strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="close" stroke={changePercent >= 0 ? COLORS.up : COLORS.down} strokeWidth={2} dot={false} />

                                            {/* Avg Purchase Price Line */}
                                            {asset.pricePerShare > 0 && (
                                                <ReferenceLine
                                                    y={purchaseLineY}
                                                    stroke={COLORS.buyPrice}
                                                    strokeDasharray="3 3"
                                                    label={{
                                                        value: purchaseLineLabel,
                                                        fill: COLORS.buyPrice,
                                                        fontSize: 11,
                                                        fontWeight: 'bold',
                                                        position: isOutOfBounds ? 'insideBottomRight' : 'insideRight',
                                                        dy: isOutOfBounds && purchaseLineY === chartMax ? 10 : (isOutOfBounds && purchaseLineY === chartMin ? -10 : -10)
                                                    }}
                                                />
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Volume */}
                            <div className="h-16 mt-2 border-t border-slate-50 relative">
                                <span className="absolute top-1 left-0 text-[10px] text-slate-400 font-bold">거래량</span>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={displayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} syncId="stockDetail">
                                        <Bar dataKey="volume" fill="#cbd5e1" />
                                        {/* Hidden YAxis to match Price Chart margin/width */}
                                        <YAxis
                                            orientation="right"
                                            tick={false}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Holdings Summary (1 col) */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center space-y-8">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">매입금액</div>
                                <div className="text-2xl font-medium text-slate-900">{totalPurchase.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">매입단가</div>
                                <div className="text-2xl font-medium text-slate-900">{asset.pricePerShare.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">보유 수량</div>
                                <div className="text-2xl font-medium text-slate-900">{asset.quantity.toLocaleString()}주</div>
                            </div>
                            <div className="pt-6 border-t border-slate-100">
                                <div className="text-xs text-slate-500 mb-1">평가손익</div>
                                <div className={`text-3xl font-bold ${isPositive ? 'text-red-500' : 'text-blue-600'}`}>
                                    {profitLoss.toLocaleString()}
                                    <span className="text-lg ml-2 font-medium">{isPositive ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%</span>
                                </div>
                                <button
                                    onClick={() => setShowIndexComparison(true)}
                                    className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                                >
                                    📊 지수대비 수익률 비교
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Goals */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-slate-800 font-bold mb-6">목표 설정</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">메모</label>
                                <input
                                    type="text"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        하한 목표
                                        {lowerRate !== null && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lowerRate >= 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {lowerRate > 0 ? '+' : ''}{lowerRate.toFixed(2)}%
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={targetLower}
                                        onChange={(e) => setTargetLower(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        placeholder="목표가 입력"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        상한 목표
                                        {upperRate !== null && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${upperRate >= 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {upperRate > 0 ? '+' : ''}{upperRate.toFixed(2)}%
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={targetUpper}
                                        onChange={(e) => setTargetUpper(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        placeholder="목표가 입력"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Trade Log */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm pb-12">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-slate-800 font-bold">거래 내역</h3>
                            <button
                                onClick={() => setIsAddingLog(!isAddingLog)}
                                className="text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition"
                            >
                                <Plus size={16} /> 기록 추가
                            </button>
                        </div>

                        {/* Add Form */}
                        {isAddingLog && (
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 grid grid-cols-6 gap-3 items-end">
                                <div className="col-span-1">
                                    <label className="text-xs text-slate-500 mb-1 block">날짜</label>
                                    <input type="date" value={newTrade.date} onChange={e => setNewTrade({ ...newTrade, date: e.target.value })} className="w-full p-2 rounded border" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">구분</label>
                                    <select value={newTrade.type} onChange={e => setNewTrade({ ...newTrade, type: e.target.value as 'BUY' | 'SELL' })} className="w-full p-2 rounded border">
                                        <option value="BUY">매수</option>
                                        <option value="SELL">매도</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">가격</label>
                                    <input type="number" placeholder="0" value={newTrade.price} onChange={e => setNewTrade({ ...newTrade, price: e.target.value })} className="w-full p-2 rounded border" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">수량</label>
                                    <input type="number" placeholder="0" value={newTrade.quantity} onChange={e => setNewTrade({ ...newTrade, quantity: e.target.value })} className="w-full p-2 rounded border" />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-500 mb-1 block">메모</label>
                                            <input type="text" placeholder="메모 입력" value={newTrade.memo} onChange={e => setNewTrade({ ...newTrade, memo: e.target.value })} className="w-full p-2 rounded border" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-slate-500 mb-1 block">KOSPI (수동)</label>
                                            <input type="text" placeholder="지수" value={newTrade.kospiIndex} onChange={e => setNewTrade({ ...newTrade, kospiIndex: e.target.value })} className="w-full p-2 rounded border text-xs font-mono" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={handleSaveTrade} className="bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 flex-1">{editingTradeId ? '수정 저장' : '기록 추가'}</button>
                                    {editingTradeId && (
                                        <>
                                            <button onClick={() => handleDeleteTrade(editingTradeId)} className="bg-red-50 text-red-600 p-2 rounded font-bold hover:bg-red-100 flex-1">삭제</button>
                                            <button onClick={() => { setIsAddingLog(false); setEditingTradeId(null); }} className="bg-slate-300 text-slate-700 p-2 rounded font-bold hover:bg-slate-400">취소</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Trade List Table */}
                        <div className="w-full text-sm text-left">
                            <div className="grid grid-cols-7 text-slate-500 font-bold border-b border-slate-200 pb-2 mb-2">
                                <div>날짜</div>
                                <div>구분</div>
                                <div>가격</div>
                                <div>KOSPI</div> {/* New Column */}
                                <div className="text-center">수량</div>
                                <div>메모</div>
                                <div className="text-right">관리</div>
                            </div>
                            <div className="space-y-3">
                                {asset.trades && asset.trades.length > 0 ? (
                                    asset.trades.map((trade) => (
                                        <div key={trade.id} className="grid grid-cols-7 items-center text-slate-700 py-1 hover:bg-slate-50 rounded">
                                            <div className="font-mono">{trade.date}</div>
                                            <div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {trade.type === 'BUY' ? '매수' : '매도'}
                                                </span>
                                            </div>
                                            <div className="font-medium">{trade.price.toLocaleString()}</div>
                                            <div className="text-xs text-slate-400 font-mono">
                                                {trade.kospiIndex ? (
                                                    <span>{Number(trade.kospiIndex).toLocaleString()}</span>
                                                ) : (kospiMap[trade.date] ? (
                                                    <span>{Number(kospiMap[trade.date]).toLocaleString()}</span>
                                                ) : '-')}
                                            </div>
                                            <div className="text-center">{trade.quantity}</div>
                                            <div className="truncate text-slate-500">{trade.memo || '-'}</div>
                                            <div className="text-right flex gap-2 justify-end">
                                                <button onClick={() => handleEditTrade(trade)} className="text-slate-400 hover:text-indigo-600 text-xs"><Edit3 size={12} /></button>
                                                <button onClick={() => handleDeleteTrade(trade.id)} className="hidden text-slate-400 hover:text-red-500 text-xs"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-4">기록된 거래 내역이 없습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* Delete Asset */}
                        <div className="mt-12 text-center">
                            <button
                                onClick={handleDeleteAsset}
                                className="text-slate-400 font-bold text-lg hover:text-red-600 transition flex items-center justify-center gap-2 mx-auto"
                            >
                                <Trash2 size={20} /> 종목 삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Index Comparison Overlay Modal */}
            {showIndexComparison && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-indigo-600">📊</span> 지수대비 수익률 비교
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    매수 시점의 시장 지수와 현재 지수를 비교하여 성과를 분석합니다. (현재 지수: <span className="font-bold text-slate-800">{currentIndex ? currentIndex.toLocaleString() : '-'}</span>)
                                </p>
                            </div>
                            <button onClick={() => setShowIndexComparison(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto bg-slate-50">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr className="border-b border-slate-200">
                                            <th className="px-4 py-3 text-left">거래일자</th>
                                            <th className="px-4 py-3">수량</th>
                                            <th className="px-4 py-3">매수가</th>
                                            <th className="px-4 py-3">합계금액</th>
                                            <th className="px-4 py-3">현재가</th>
                                            <th className="px-4 py-3 border-l border-slate-100 bg-indigo-50/30 text-indigo-900">지수(매수당시)</th>
                                            <th className="px-4 py-3 bg-indigo-50/30 text-indigo-900">지수(현재)</th>
                                            <th className="px-4 py-3 border-l border-slate-100">주가 수익률</th>
                                            <th className="px-4 py-3">지수 수익률</th>
                                            <th className="px-4 py-3 bg-slate-100 text-slate-700">초과 성과</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {asset.trades?.filter((t: any) => t.type === 'BUY').map((trade: any, idx: number) => {
                                            const buyIndex = trade.kospiIndex ? Number(trade.kospiIndex) : (kospiMap[trade.date] ? Number(kospiMap[trade.date]) : null);
                                            const stockReturn = trade.price ? ((currentPrice - trade.price) / trade.price) * 100 : 0;
                                            const indexReturn = (buyIndex && currentIndex) ? ((currentIndex - buyIndex) / buyIndex) * 100 : null;
                                            const alpha = indexReturn !== null ? stockReturn - indexReturn : null;
                                            const totalAmount = trade.price * trade.quantity;

                                            return (
                                                <tr key={trade.id || idx} className="hover:bg-slate-50 transition group">
                                                    <td className="px-4 py-3 text-left font-mono text-slate-600 whitespace-nowrap">{trade.date}</td>
                                                    <td className="px-4 py-3 text-slate-700">{trade.quantity.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-700">{trade.price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">{totalAmount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-slate-500">{currentPrice.toLocaleString()}</td>
                                                    <td className="px-4 py-3 border-l border-slate-100 bg-indigo-50/10 text-slate-800 font-medium">{buyIndex ? buyIndex.toLocaleString() : '-'}</td>
                                                    <td className="px-4 py-3 bg-indigo-50/10 text-slate-500">{currentIndex ? currentIndex.toLocaleString() : '-'}</td>

                                                    <td className={`px-4 py-3 border-l border-slate-100 font-bold ${stockReturn >= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                                        {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                                                    </td>
                                                    <td className={`px-4 py-3 font-bold ${indexReturn !== null ? (indexReturn >= 0 ? 'text-red-500' : 'text-blue-600') : 'text-slate-400'}`}>
                                                        {indexReturn !== null ? `${indexReturn > 0 ? '+' : ''}${indexReturn.toFixed(2)}%` : '-'}
                                                    </td>
                                                    <td className={`px-4 py-3 font-bold bg-slate-50 ${alpha !== null ? (alpha >= 0 ? 'text-red-600' : 'text-blue-600') : 'text-slate-400'}`}>
                                                        {alpha !== null ? `${alpha > 0 ? '+' : ''}${alpha.toFixed(2)}%p` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!asset.trades || asset.trades.filter((t: any) => t.type === 'BUY').length === 0) && (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                                                    매수 기록이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 text-xs text-slate-400 text-right">
                                * 초과 성과 = 주가 수익률 - 지수 수익률 (시장을 얼마나 이겼는지 보여줍니다)
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
