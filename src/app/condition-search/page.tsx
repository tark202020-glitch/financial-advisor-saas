"use client";

import { useState, useEffect } from 'react';
import SidebarLayout from "@/components/SidebarLayout";

interface Condition {
    id: string;
    field: 'market_cap' | 'per' | 'roe';
    min: string;
    max: string;
}

interface StockResult {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changeRate: number;
    volume: number;
    marketCap: number; // 억 원 단위
    per?: number;
    roe?: number;
}

export default function ConditionSearchPage() {
    const [conditions, setConditions] = useState<Condition[]>([
        { id: '1', field: 'market_cap', min: '1000', max: '' }, // Default 1T KRW (1000 억) -> 100 Billion
    ]);
    const [results, setResults] = useState<StockResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [debugMsg, setDebugMsg] = useState('');

    const addCondition = () => {
        setConditions([...conditions, { id: Date.now().toString(), field: 'per', min: '', max: '' }]);
    };

    const removeCondition = (id: string) => {
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id: string, key: keyof Condition, value: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [key]: value } : c));
    };

    const handleSearch = async () => {
        setIsSearching(true);
        setResults([]);
        setDebugMsg("검색 중...");

        try {
            // 1. Fetch Candidates (Market Cap Ranking - Top N)
            const res = await fetch('/api/kis/ranking?type=market-cap');
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error: ${res.status} ${res.statusText} - ${errText}`);
            }
            const rankingData = await res.json();

            console.log('[DEBUG] Ranking Data Sample:', rankingData?.[0]);

            if (!Array.isArray(rankingData)) {
                throw new Error("Invalid format");
            }

            // Step 1: Normalize
            const candidates: StockResult[] = rankingData.map((item: any) => {
                // Key Check for KIS Ranking API (FHPST01730000)
                // mksc_shra: Code
                // hts_kor_isnm: Name
                // stck_prpr: Price
                // prdy_vrss: Change
                // prdy_ctrt: Rate
                // acml_vol: Volume
                // stck_avls: Market Cap (Listed Shares?) -> Actually avls_scal usually?
                // Use detailed fetch for PER/ROE/MarketCap anyway.

                return {
                    symbol: item.mksc_shra,
                    name: item.hts_kor_isnm,
                    price: parseInt(item.stck_prpr || '0'),
                    change: parseInt(item.prdy_vrss || '0'),
                    changeRate: parseFloat(item.prdy_ctrt || '0'),
                    volume: parseInt(item.acml_vol || '0'),
                    marketCap: 0, // Fill later or calculate
                };
            }).filter(c => c.symbol);

            // Step 2: Fetch Details for Candidates to get PER/ROE/MarketCap
            const symbols = candidates.map(c => c.symbol);

            setDebugMsg(`상세 정보 조회 중... (${symbols.length}건)`);
            const chunkSize = 10;
            const detailedResults: StockResult[] = [];

            for (let i = 0; i < symbols.length; i += chunkSize) {
                const chunk = symbols.slice(i, i + chunkSize);
                const query = chunk.join(',');
                const batchRes = await fetch(`/api/kis/price/batch?market=KR&symbols=${query}`);
                const batchData = await batchRes.json();

                chunk.forEach(sym => {
                    const detail = batchData[sym];
                    const original = candidates.find(c => c.symbol === sym);

                    if (original && detail) {
                        try {
                            const d = detail as any;
                            // Debug logs for the first stock processed in each chunk
                            if (detailedResults.length === 0) {
                                console.log('[DEBUG] Detail for', sym, d);
                            }

                            const per = parseFloat(d.per || '0');
                            const eps = parseInt(d.eps || '0');
                            const bps = parseInt(d.bps || '0');
                            // hts_avls unit is expected to be 100 Million KRW (억)
                            const marketCap = parseInt(d.hts_avls || '0');

                            let roe = 0;
                            if (bps > 0) {
                                roe = (eps / bps) * 100;
                            }

                            detailedResults.push({
                                ...original,
                                symbol: original.symbol,
                                name: original.name,
                                price: parseInt(d.stck_prpr || original.price.toString()),
                                change: parseInt(d.prdy_vrss || original.change.toString()),
                                changeRate: parseFloat(d.prdy_ctrt || original.changeRate.toString()),
                                volume: parseInt(d.acml_vol || original.volume.toString()),
                                marketCap: marketCap,
                                per,
                                roe
                            });
                        } catch (err) {
                            console.error(`Error processing details for ${sym}:`, err);
                        }
                    }
                });
            }

            // Step 3: Local Filtering
            const finalResults = detailedResults.filter(stock => {
                return conditions.every(cond => {
                    const min = cond.min ? parseFloat(cond.min) : -Infinity;
                    const max = cond.max ? parseFloat(cond.max) : Infinity;

                    if (cond.field === 'market_cap') {
                        // KIS `hts_avls` is typically in 억 (100M KRW).
                        return stock.marketCap >= min && stock.marketCap <= max;
                    }
                    if (cond.field === 'per') {
                        return (stock.per || 0) >= min && (stock.per || 0) <= max;
                    }
                    if (cond.field === 'roe') {
                        return (stock.roe || 0) >= min && (stock.roe || 0) <= max;
                    }
                    return true;
                });
            });

            setResults(finalResults);
            setDebugMsg(`검색 완료: ${finalResults.length}건 (전체 ${detailedResults.length}건 중)`);

        } catch (e: any) {
            console.error(e);
            setDebugMsg(`오류 발생: ${e.message}`);
        } finally {
            setIsSearching(false);
        }
    };

    const [opinionData, setOpinionData] = useState<any[]>([]);
    const [opinionSymbol, setOpinionSymbol] = useState('005930'); // Default Samsung
    const [isOpinionLoading, setIsOpinionLoading] = useState(false);

    const fetchOpinion = async () => {
        setIsOpinionLoading(true);
        try {
            // Last 1 year
            const today = new Date();
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);

            const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");
            const yearAgoStr = yearAgo.toISOString().slice(0, 10).replace(/-/g, "");

            const res = await fetch(`/api/kis/invest-opinion?symbol=${opinionSymbol}&startDate=${yearAgoStr}&endDate=${todayStr}`);
            if (!res.ok) throw new Error("Failed to fetch opinion");
            const data = await res.json();

            // KIS API returns single object if 1 row, array if multiple. Ensure array.
            const list = Array.isArray(data) ? data : (data ? [data] : []);
            setOpinionData(list);
        } catch (e) {
            console.error(e);
            setOpinionData([]);
        } finally {
            setIsOpinionLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchOpinion();
    }, []);

    return (
        <SidebarLayout>
            <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">조건검색</h1>
                    <p className="text-slate-500">원하는 조건으로 주식을 검색해보세요. (KOSPI 대상)</p>
                </header>

                {/* HTS 0640 Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">투자의견 (HTS 0640)</h2>
                        <div className="flex gap-2">
                            <input
                                value={opinionSymbol}
                                onChange={(e) => setOpinionSymbol(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 outline-none"
                                placeholder="종목코드"
                            />
                            <button
                                onClick={fetchOpinion}
                                disabled={isOpinionLoading}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition disabled:opacity-50"
                            >
                                {isOpinionLoading ? '조회 중...' : '조회'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-2 rounded-l-lg">일자</th>
                                    <th className="px-4 py-2">증권사</th>
                                    <th className="px-4 py-2">투자의견</th>
                                    <th className="px-4 py-2">목표가</th>
                                    <th className="px-4 py-2 rounded-r-lg">작성자</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {opinionData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                            데이터가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    opinionData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-2">{item.stck_bsop_date}</td>
                                            <td className="px-4 py-2">{item.mbcr_name}</td>
                                            <td className="px-4 py-2 font-medium text-slate-700">{item.invt_opnn}</td>
                                            <td className="px-4 py-2 font-bold text-slate-900">{parseInt(item.htgt_prce || '0').toLocaleString()}</td>
                                            <td className="px-4 py-2 text-slate-500">{item.wrtg_nm}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Conditions Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    {conditions.map((cond, idx) => (
                        <div key={cond.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-400 w-16">조건 {idx + 1}</span>
                            <select
                                value={cond.field}
                                onChange={(e) => updateCondition(cond.id, 'field', e.target.value as any)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-40"
                            >
                                <option value="market_cap">시가총액 (억)</option>
                                <option value="per">PER (배)</option>
                                <option value="roe">ROE (%)</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={cond.min}
                                    onChange={(e) => updateCondition(cond.id, 'min', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 outline-none"
                                />
                                <span className="text-slate-400">~</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={cond.max}
                                    onChange={(e) => updateCondition(cond.id, 'max', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 outline-none"
                                />
                            </div>
                            <button onClick={() => removeCondition(cond.id)} className="text-slate-400 hover:text-red-500 ml-auto">
                                삭제
                            </button>
                        </div>
                    ))}

                    <div className="flex gap-4 pt-4">
                        <button onClick={addCondition} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition">
                            + 조건 추가
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 ml-auto"
                        >
                            {isSearching ? '검색 중...' : '검색하기'}
                        </button>
                    </div>
                    {debugMsg && <p className="text-xs text-slate-400 mt-2 text-right">{debugMsg}</p>}
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">종목</th>
                                <th className="px-6 py-4">현재가</th>
                                <th className="px-6 py-4">등락률</th>
                                <th className="px-6 py-4">시가총액 (억)</th>
                                <th className="px-6 py-4">PER</th>
                                <th className="px-6 py-4">ROE</th>
                                <th className="px-6 py-4">거래량</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        {isSearching ? '데이터를 불러오는 중입니다...' : '검색 결과가 없습니다.'}
                                    </td>
                                </tr>
                            ) : (
                                results.map((stock) => (
                                    <tr key={stock.symbol} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {stock.name} <span className="text-xs text-slate-400 ml-1">{stock.symbol}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {stock.price.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 font-medium ${stock.change > 0 ? 'text-red-500' : stock.change < 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                                            {stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {stock.marketCap.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {stock.per?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {stock.roe?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {stock.volume.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SidebarLayout>
    );
}
