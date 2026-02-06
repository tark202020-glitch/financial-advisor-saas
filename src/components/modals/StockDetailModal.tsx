"use client";

import { useEffect, useState } from 'react';
import { X, TrendingUp, DollarSign, Activity, FileText, Star } from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';

interface StockDetailModalProps {
    symbol: string;
    marketType: 'KR' | 'US';
    name: string;
    onClose: () => void;
}

interface FinancialStats {
    per: string;
    pbr: string;
    eps: string;
    market_cap: string;
    sector_name: string;
}

interface CompanyData {
    stats: FinancialStats;
    financials: {
        revenue: string;
        operating_profit: string;
        net_income: string;
        assets: string;
        debt: string;
        // Expanded Fields
        total_equity?: string;
        growth_revenue?: string;
        growth_profit?: string;
        consensus_score?: string;
        consensus_price?: string;
    };
}

export default function StockDetailModal({ symbol, marketType, name, onClose }: StockDetailModalProps) {
    const { isInWatchlist, addStock, removeStock } = useWatchlist();
    const isAdded = isInWatchlist(symbol);

    const [data, setData] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'financial' | 'fs' | 'balance' | 'growth' | 'consensus'>('financial');

    useEffect(() => {
        let isMounted = true;
        const fetchInfo = async () => {
            if (marketType === 'US') {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/kis/company/${symbol}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                if (isMounted) setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchInfo();
        return () => { isMounted = false; };
    }, [symbol, marketType]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleToggleWatchlist = () => {
        if (isAdded) {
            removeStock(symbol, marketType);
        } else {
            // Add with minimal info (Mock Price will be updated by list)
            addStock({
                symbol,
                name,
                price: 0,
                change: 0,
                changePercent: 0,
                sector: marketType === 'KR' ? 'KOSPI' : 'US'
            }, marketType);
        }
    };

    if (!symbol) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded">
                                {symbol}
                            </span>
                            {marketType === 'US' && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">US</span>}

                            <button
                                onClick={handleToggleWatchlist}
                                className={`ml-2 p-1.5 rounded-full transition-colors ${isAdded ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                title={isAdded ? "관심종목 해제" : "관심종목 추가"}
                            >
                                <Star fill={isAdded ? "currentColor" : "none"} size={18} />
                            </button>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                            {marketType === 'KR' ? 'Korea Stock Exchange' : 'NASDAQ / NYSE'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                    {['financial', 'fs', 'balance', 'growth', 'consensus'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab === 'financial' && '투자지표'}
                            {tab === 'fs' && '손익계산서'}
                            {tab === 'balance' && '재무상태표'}
                            {tab === 'growth' && '성장성'}
                            {tab === 'consensus' && '투자의견'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
                            데이터를 불러오는 중...
                        </div>
                    ) : marketType === 'US' ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <Activity className="w-10 h-10 opacity-20" />
                            <p>미국 주식 상세 정보는 준비 중입니다.</p>
                        </div>
                    ) : !data ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <p>정보를 불러올 수 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

                            {/* 1. Investment Stats (Default Tab) */}
                            {activeTab === 'financial' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        기본 투자 지표
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">PER</div>
                                            <div className="text-lg font-bold text-slate-800">{data.stats.per}배</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">PBR</div>
                                            <div className="text-lg font-bold text-slate-800">{data.stats.pbr}배</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">EPS</div>
                                            <div className="text-lg font-bold text-slate-800">{parseInt(data.stats.eps).toLocaleString()}원</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">시가총액</div>
                                            <div className="text-lg font-bold text-slate-800 text-xs text-nowrap overflow-hidden text-ellipsis">
                                                {data.stats.market_cap} 억
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Income Statement (FHKST66430200) */}
                            {activeTab === 'fs' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        손익계산서 (포괄)
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-3">항목</th>
                                                    <th className="p-3 text-right">금액 (억 원)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[
                                                    { label: '매출액', val: data.financials.revenue },
                                                    { label: '영업이익', val: data.financials.operating_profit },
                                                    { label: '당기순이익', val: data.financials.net_income }
                                                ].map((row) => (
                                                    <tr key={row.label}>
                                                        <td className="p-3">{row.label}</td>
                                                        <td className="p-3 text-right font-medium text-slate-700">
                                                            {row.val && row.val !== '-' ? row.val : <span className="text-slate-300">-</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 text-right">* 최근 결산 기준</p>
                                </div>
                            )}

                            {/* 3. Balance Sheet (FHKST66430300) */}
                            {activeTab === 'balance' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-green-500" />
                                        재무상태표
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-3">항목</th>
                                                    <th className="p-3 text-right">금액 (억 원)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr><td className="p-3">자산총계</td><td className="p-3 text-right text-slate-700">{data.financials.assets || '-'}</td></tr>
                                                <tr><td className="p-3">부채총계</td><td className="p-3 text-right text-slate-700">{data.financials.debt || '-'}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 4. Growth (FHKST66430800) */}
                            {activeTab === 'growth' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                        성장성 지표
                                    </h3>
                                    {data.financials.growth_revenue ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="text-xs text-slate-500 mb-1">매출액 증가율</div>
                                                <div className="text-lg font-bold text-slate-800">{data.financials.growth_revenue}%</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="text-xs text-slate-500 mb-1">영업이익 증가율</div>
                                                <div className="text-lg font-bold text-slate-800">{data.financials.growth_profit}%</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
                                            데이터 준비 중입니다. (API 연동 대기)
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 5. Consensus (FHKST663300C0) */}
                            {activeTab === 'consensus' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-orange-500" />
                                        투자의견 (컨센서스)
                                    </h3>
                                    {data.financials.consensus_score ? (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">투자의견 (4.0 만점)</div>
                                                <div className="text-2xl font-bold text-slate-800">{data.financials.consensus_score}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500 mb-1">목표주가</div>
                                                <div className="text-lg font-bold text-slate-800">{data.financials.consensus_price}원</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
                                            투자의견 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
