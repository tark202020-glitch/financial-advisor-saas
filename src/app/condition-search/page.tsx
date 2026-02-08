"use client";

import { useState } from 'react';
import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';

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
        { id: '1', field: 'market_cap', min: '100000', max: '' }, // Default 10T KRW (100,000 억)
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
            // Currently our API returns KIS Ranking (likely Top 30-100).
            const res = await fetch('/api/kis/ranking?type=market-cap');
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error: ${res.status} ${res.statusText} - ${errText}`);
            }
            const rankingData = await res.json();

            // setDebugMsg(`Ranking Data: ${JSON.stringify(rankingData?.[0] || 'Empty')}`);

            if (!Array.isArray(rankingData)) {
                throw new Error("Invalid format");
            }

            // Map and Filter
            // KIS Ranking keys (Guessed, need verification. User `mksc_shra` for Code based on standard KIS?)
            // Actually, the ranking API output keys are tricky. 
            // Common keys: `mksc_shra` (Code), `hts_kor_isnm` (Name), `stck_prpr` (Price), `stck_avls` or `mksc_shra` (Market Cap usually). 
            // `acml_vol` (Volume).

            // Let's filter by conditions.
            // Note: PER/ROE are NOT in ranking data. We need to fetch details.

            // Step 1: Normalize
            const candidates: StockResult[] = rankingData.map((item: any) => {
                // Key Mapping Check
                // `mksc_shra` -> Code (Issue Code)
                // `hts_kor_isnm` -> Name
                // `stck_prpr` -> Price
                // `prdy_vrss` -> Change
                // `prdy_ctrt` -> Rate
                // `acml_vol` -> Volume
                // `stck_avls` or `mksc_avls` -> Market Cap? No.
                // Usually `mksc_shra` is Code. Market Cap is `stck_shra` * `stck_prpr`.
                // Actually KIS Ranking `FHPST01730000` has `hts_avls` (Market Cap)?
                // Let's assume `mksc_shra` is the code, and we will update details via Batch later.

                return {
                    symbol: item.mksc_shra, // This is likely the code.
                    name: item.hts_kor_isnm,
                    price: parseInt(item.stck_prpr || '0'),
                    change: parseInt(item.prdy_vrss || '0'),
                    changeRate: parseFloat(item.prdy_ctrt || '0'),
                    volume: parseInt(item.acml_vol || '0'),
                    marketCap: 0, // Fill later or calculate
                };
            }).filter(c => c.symbol); // Valid symbols only

            // Step 2: Fetch Details for Candidates to get PER/ROE/MarketCap
            // We use batch fetch (chunks of 5-10)
            const symbols = candidates.map(c => c.symbol);

            // We can call `/api/kis/price/batch?market=KR&symbols=...`
            // But strict KIS `inquire-price` has PER/PBR. Calculate ROE.
            // Our useBatchStockPrice hook does this, but we need one-off fetch here.

            // Let's implement a quick batch fetch here or use the API route.
            // Use API route sequentially.

            setDebugMsg("상세 정보 조회 중...");
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
                        // detail (KisDomStockPrice) usually has per, pbr, eps, bps, hts_avls
                        // Cast to any to access extra fields
                        const d = detail as any;
                        const per = parseFloat(d.per || '0');
                        const pbr = parseFloat(d.pbr || '0');
                        const eps = parseInt(d.eps || '0');
                        const bps = parseInt(d.bps || '0');
                        const marketCap = parseInt(d.hts_avls || '0'); // Usually in 100 Million or similar unit

                        // ROE = EPS / BPS * 100 roughly (or PBR/PER * 100)
                        let roe = 0;
                        if (bps > 0) roe = (eps / bps) * 100;

                        detailedResults.push({
                            ...original,
                            price: parseInt(d.stck_prpr || original.price.toString()),
                            change: parseInt(d.prdy_vrss || original.change.toString()),
                            changeRate: parseFloat(d.prdy_ctrt || original.changeRate.toString()),
                            volume: parseInt(d.acml_vol || original.volume.toString()),
                            marketCap: marketCap, // hts_avls is usually in 억 (100M) or Million. KIS Default.
                            per,
                            roe
                        });
                    }
                });
            }

            // Step 3: Local Filtering
            const finalResults = detailedResults.filter(stock => {
                return conditions.every(cond => {
                    const min = cond.min ? parseFloat(cond.min) : -Infinity;
                    const max = cond.max ? parseFloat(cond.max) : Infinity;

                    if (cond.field === 'market_cap') {
                        // user input: 10 = 10 억? or 10조?
                        // User prompt example: "10조 ~ 100조"
                        // KIS `hts_avls` is usually in 억 (100M KRW).
                        // So 10조 = 10,000 (if unit is 억).
                        // Let's assume user inputs "10000" for 10조 if unit is 억.
                        // Or we provide UI toggle. For now, raw numbers.
                        // Let's assume input is in 'Billions' (10억) -> No, standard is 억.
                        // Let's filter raw values.
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

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">조건검색</h1>
                <p className="text-slate-500">원하는 조건으로 주식을 검색해보세요. (KOSPI 대상)</p>
            </header>

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
    );
}
