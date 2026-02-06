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
    Line
} from 'recharts';
import { useStockPrice } from '@/hooks/useStockPrice';
import { usePortfolio, Asset } from '@/context/PortfolioContext';

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
    const { updateAsset, removeAsset, addTradeLog, removeTradeLog } = usePortfolio();
    const stockLive = useStockPrice(asset.symbol, 0, 'KR');

    // Local State for Chart
    const [history, setHistory] = useState<CandleData[]>([]);
    const [chartLoading, setChartLoading] = useState(true);

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

    // --- Effects ---

    // 1. Fetch Chart Data
    useEffect(() => {
        if (isOpen && asset.symbol) {
            setChartLoading(true);
            fetch(`/api/kis/chart/daily/${asset.symbol}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const sorted = [...data].reverse().map(d => ({
                            date: d.stck_bsop_date,
                            open: parseInt(d.stck_oprc),
                            high: parseInt(d.stck_hgpr),
                            low: parseInt(d.stck_lwpr),
                            close: parseInt(d.stck_clpr),
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
                        setHistory(withMA);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setChartLoading(false));

            // Sync local state with asset prop changes
            setMemo(asset.memo || '');
            setTargetLower(asset.targetPriceLower?.toString() || '');
            setTargetUpper(asset.targetPriceUpper?.toString() || '');
        }
    }, [isOpen, asset]);

    // --- Handlers ---

    const handleSaveGoals = () => {
        updateAsset(asset.id, {
            memo,
            targetPriceLower: targetLower ? parseInt(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseInt(targetUpper.replace(/,/g, '')) : undefined,
        });
    };

    const handleAddTrade = async () => {
        if (!newTrade.price || !newTrade.quantity) return;

        await addTradeLog(asset.id, {
            date: newTrade.date,
            type: newTrade.type,
            price: Number(newTrade.price),
            quantity: Number(newTrade.quantity),
            kospiIndex: newTrade.kospiIndex ? Number(newTrade.kospiIndex) : undefined,
            memo: newTrade.memo
        });

        setNewTrade({
            date: new Date().toISOString().split('T')[0],
            type: 'BUY',
            price: '',
            quantity: '',
            kospiIndex: '',
            memo: ''
        });
        setIsAddingLog(false);
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
    const displayData = history.slice(-60); // Zoom to last 60

    // Valuation
    const totalPurchase = asset.pricePerShare * asset.quantity;
    const currentValuation = currentPrice * asset.quantity;
    const profitLoss = currentValuation - totalPurchase;
    const returnRate = (profitLoss / totalPurchase) * 100;
    const isPositive = profitLoss >= 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-start bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <span>{asset.symbol}</span>
                            <span>{asset.category}</span>
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
                                            <span className="text-orange-500">■ 5</span>
                                            <span className="text-violet-500">■ 20</span>
                                            <span className="text-blue-500">■ 60</span>
                                            <span className="text-green-500">■ 120</span>
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
                                    60일
                                </div>
                            </div>

                            {/* Chart Body */}
                            <div className="h-[300px] w-full">
                                {chartLoading ? (
                                    <div className="h-full flex items-center justify-center text-slate-300">Loading Chart...</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                                            <Line type="monotone" dataKey="ma5" stroke="#f97316" strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma20" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma60" stroke="#3b82f6" strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="ma120" stroke="#22c55e" strokeWidth={1} dot={false} />
                                            <Line type="monotone" dataKey="close" stroke={changePercent >= 0 ? '#ef4444' : '#3b82f6'} strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Volume */}
                            <div className="h-16 mt-2 border-t border-slate-50 relative">
                                <span className="absolute top-1 left-0 text-[10px] text-slate-400 font-bold">거래량</span>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={displayData}>
                                        <Bar dataKey="volume" fill="#cbd5e1" />
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">매도 하한 목표</label>
                                    <input
                                        type="number"
                                        value={targetLower}
                                        onChange={(e) => setTargetLower(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">매도 상한 목표</label>
                                    <input
                                        type="number"
                                        value={targetUpper}
                                        onChange={(e) => setTargetUpper(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
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
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">메모</label>
                                    <input type="text" placeholder="메모" value={newTrade.memo} onChange={e => setNewTrade({ ...newTrade, memo: e.target.value })} className="w-full p-2 rounded border" />
                                </div>
                                <button onClick={handleAddTrade} className="bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700">저장</button>
                            </div>
                        )}

                        {/* Trade List Table */}
                        <div className="w-full text-sm text-left">
                            <div className="grid grid-cols-6 text-slate-500 font-bold border-b border-slate-200 pb-2 mb-2">
                                <div>날짜</div>
                                <div>구분</div>
                                <div>가격</div>
                                <div className="text-center">수량</div>
                                <div>메모</div>
                                <div className="text-right">관리</div>
                            </div>
                            <div className="space-y-3">
                                {asset.trades && asset.trades.length > 0 ? (
                                    asset.trades.map((trade) => (
                                        <div key={trade.id} className="grid grid-cols-6 items-center text-slate-700 py-1 hover:bg-slate-50 rounded">
                                            <div className="font-mono">{trade.date}</div>
                                            <div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {trade.type === 'BUY' ? '매수' : '매도'}
                                                </span>
                                            </div>
                                            <div className="font-medium">{trade.price.toLocaleString()}</div>
                                            <div className="text-center">{trade.quantity}</div>
                                            <div className="truncate text-slate-500">{trade.memo || '-'}</div>
                                            <div className="text-right">
                                                <button onClick={() => handleDeleteTrade(trade.id)} className="text-slate-400 hover:text-red-500 text-xs">삭제</button>
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
        </div>
    );
}
