"use client";

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from "@/components/SidebarLayout";
import { createClient } from '@/utils/supabase/client';

// === Types ===
interface ConditionRange {
    min: string;
    max: string;
}

interface SimpleConditions {
    revenueGrowth: ConditionRange;
    opGrowth: ConditionRange;
    roe: ConditionRange;
    peg: ConditionRange;
    per: ConditionRange;
    pbr: ConditionRange;
    debt: ConditionRange;
    dividend: ConditionRange;
    marketCap: ConditionRange;
    volume: ConditionRange;
}

interface Preset {
    id: string;
    name: string;
    conditions: SimpleConditions;
    created_at: string;
    updated_at: string;
}

// === Default Conditions ===
const DEFAULT_CONDITIONS: SimpleConditions = {
    revenueGrowth: { min: '', max: '' },
    opGrowth: { min: '', max: '' },
    roe: { min: '', max: '' },
    peg: { min: '', max: '' },
    per: { min: '', max: '' },
    pbr: { min: '', max: '' },
    debt: { min: '', max: '' },
    dividend: { min: '', max: '' },
    marketCap: { min: '', max: '' },
    volume: { min: '', max: '' },
};

// === Condition Metadata ===
const CONDITION_FIELDS: {
    key: keyof SimpleConditions;
    label: string;
    unit: string;
    paramMin: string;
    paramMax: string;
}[] = [
        { key: 'revenueGrowth', label: '매출액 증가율', unit: '%', paramMin: 'minRevenueGrowth', paramMax: 'maxRevenueGrowth' },
        { key: 'opGrowth', label: '영업이익 증가율', unit: '%', paramMin: 'minOpGrowth', paramMax: 'maxOpGrowth' },
        { key: 'roe', label: 'ROE', unit: '%', paramMin: 'minROE', paramMax: 'maxROE' },
        { key: 'peg', label: 'PEG', unit: '배', paramMin: 'minPEG', paramMax: 'maxPEG' },
        { key: 'per', label: 'PER', unit: '배', paramMin: 'minPER', paramMax: 'maxPER' },
        { key: 'pbr', label: 'PBR', unit: '배', paramMin: 'minPBR', paramMax: 'maxPBR' },
        { key: 'debt', label: '부채비율', unit: '%', paramMin: 'minDebt', paramMax: 'maxDebt' },
        { key: 'dividend', label: '배당수익률', unit: '%', paramMin: 'minDividend', paramMax: 'maxDividend' },
        { key: 'marketCap', label: '시가총액', unit: '억원', paramMin: 'minMarketCap', paramMax: 'maxMarketCap' },
        { key: 'volume', label: '거래량 (최근5일)', unit: '주', paramMin: 'minVolume', paramMax: 'maxVolume' },
    ];

export default function ConditionSearchPage() {
    // === State ===
    const [conditions, setConditions] = useState<SimpleConditions>({ ...DEFAULT_CONDITIONS });
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Preset State
    const [presets, setPresets] = useState<Preset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPresets, setIsLoadingPresets] = useState(false);

    // Opinion State
    const [opinionData, setOpinionData] = useState<any[]>([]);
    const [opinionSymbol, setOpinionSymbol] = useState('005930');
    const [isOpinionLoading, setIsOpinionLoading] = useState(false);

    // === Load Presets ===
    const loadPresets = useCallback(async () => {
        setIsLoadingPresets(true);
        try {
            const res = await fetch('/api/condition-presets');
            if (res.ok) {
                const data = await res.json();
                setPresets(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to load presets:', e);
        } finally {
            setIsLoadingPresets(false);
        }
    }, []);

    useEffect(() => {
        loadPresets();
        fetchOpinion();
    }, [loadPresets]);

    // === Search Handler ===
    const handleSearch = async () => {
        setIsSearching(true);
        setResults([]);
        setStatusMsg('KOSPI 전체 종목 대상 조건 검색 중...');

        try {
            const params = new URLSearchParams();

            CONDITION_FIELDS.forEach(field => {
                const range = conditions[field.key];
                if (range.min !== '') params.set(field.paramMin, range.min);
                if (range.max !== '') params.set(field.paramMax, range.max);
            });

            const res = await fetch(`/api/kis/ranking/simple?${params.toString()}`);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();

            // Handle new response format: { results, meta }
            const list = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            const meta = data.meta;
            setResults(list);

            if (meta) {
                setStatusMsg(
                    `검색 완료: ${meta.matched}건 (전체 ${meta.totalCandidates}개 → 1차필터 ${meta.afterStage1}개 → 재무분석 ${meta.processed}개)`
                );
            } else {
                setStatusMsg(`검색 완료: ${list.length}건`);
            }
        } catch (e: any) {
            console.error(e);
            setStatusMsg(`오류 발생: ${e.message}`);
        } finally {
            setIsSearching(false);
        }
    };

    // === Preset Handlers ===
    const handleSavePreset = async () => {
        if (!presetName.trim()) {
            alert('프리셋 이름을 입력해주세요.');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/condition-presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: presetName.trim(), conditions }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }
            setPresetName('');
            loadPresets();
            setStatusMsg(`"${presetName.trim()}" 프리셋이 저장되었습니다.`);
        } catch (e: any) {
            alert(`저장 실패: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setConditions(preset.conditions);
            setSelectedPresetId(presetId);
            setStatusMsg(`"${preset.name}" 프리셋을 불러왔습니다.`);
        }
    };

    const handleDeletePreset = async (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (!confirm(`"${preset?.name}" 프리셋을 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/condition-presets?id=${presetId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setSelectedPresetId('');
            loadPresets();
            setStatusMsg('프리셋이 삭제되었습니다.');
        } catch (e) {
            alert('삭제 실패');
        }
    };

    const handleResetConditions = () => {
        setConditions({ ...DEFAULT_CONDITIONS });
        setSelectedPresetId('');
        setStatusMsg('조건이 초기화되었습니다.');
    };

    // === Opinion Handler ===
    const fetchOpinion = async () => {
        setIsOpinionLoading(true);
        try {
            const today = new Date();
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");
            const yearAgoStr = yearAgo.toISOString().slice(0, 10).replace(/-/g, "");

            const res = await fetch(`/api/kis/invest-opinion?symbol=${opinionSymbol}&startDate=${yearAgoStr}&endDate=${todayStr}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setOpinionData(Array.isArray(data) ? data : (data ? [data] : []));
        } catch (e) {
            console.error(e);
            setOpinionData([]);
        } finally {
            setIsOpinionLoading(false);
        }
    };

    // === Condition Change Handler ===
    const updateCondition = (key: keyof SimpleConditions, field: 'min' | 'max', value: string) => {
        setConditions(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    // === Render ===
    return (
        <SidebarLayout>
            <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">조건검색</h1>
                    <p className="text-slate-500">원하는 조건으로 주식을 검색해보세요. (KOSPI 대상)</p>
                </header>

                {/* === HTS 0330 조건검색 === */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">HTS 0330</div>
                            <h2 className="text-xl font-bold text-slate-800">사용자 조건검색</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetConditions}
                                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                            >
                                초기화
                            </button>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-100"
                            >
                                {isSearching ? '검색 중...' : '조건검색 실행'}
                            </button>
                        </div>
                    </div>

                    {/* === Preset Section === */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            조건 프리셋
                        </h3>

                        {/* Load Preset */}
                        {presets.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {presets.map(preset => (
                                    <div key={preset.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleLoadPreset(preset.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedPresetId === preset.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                                                }`}
                                        >
                                            {preset.name}
                                        </button>
                                        <button
                                            onClick={() => handleDeletePreset(preset.id)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                            title="삭제"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Save Preset */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="프리셋 이름 (예: 저평가가치주)"
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                            />
                            <button
                                onClick={handleSavePreset}
                                disabled={isSaving || !presetName.trim()}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {isSaving ? '저장 중...' : '현재 조건 저장'}
                            </button>
                        </div>
                    </div>

                    {/* === 10 Condition Inputs === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {CONDITION_FIELDS.map(field => (
                            <div key={field.key} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-700">{field.label}</label>
                                    <span className="text-xs text-slate-400">{field.unit}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        value={conditions[field.key].min}
                                        onChange={(e) => updateCondition(field.key, 'min', e.target.value)}
                                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-white"
                                        placeholder="최소"
                                    />
                                    <span className="text-slate-300 text-xs flex-shrink-0">~</span>
                                    <input
                                        type="number"
                                        value={conditions[field.key].max}
                                        onChange={(e) => updateCondition(field.key, 'max', e.target.value)}
                                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-white"
                                        placeholder="최대"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Status Message */}
                    {statusMsg && (
                        <div className="text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
                            {statusMsg}
                        </div>
                    )}

                    {/* === Results Table === */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-3 sticky left-0 bg-slate-50 z-10">종목명</th>
                                    <th className="px-3 py-3 text-right">현재가</th>
                                    <th className="px-3 py-3 text-right">매출증가율</th>
                                    <th className="px-3 py-3 text-right">영업이익증가율</th>
                                    <th className="px-3 py-3 text-right">ROE</th>
                                    <th className="px-3 py-3 text-right">PEG</th>
                                    <th className="px-3 py-3 text-right">PER</th>
                                    <th className="px-3 py-3 text-right">PBR</th>
                                    <th className="px-3 py-3 text-right">부채비율</th>
                                    <th className="px-3 py-3 text-right">시가총액</th>
                                    <th className="px-3 py-3 text-right">거래량</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                                            {isSearching ? '조건 만족 종목을 검색하고 있습니다...' : '검색 결과가 없습니다. 조건을 설정하고 검색을 실행해주세요.'}
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-3 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10">
                                                {item.name}
                                                <span className="text-slate-400 text-xs ml-1">{item.symbol}</span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold text-slate-900">
                                                {item.price?.toLocaleString()}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-medium ${item.revenue_growth > 0 ? 'text-red-500' : item.revenue_growth < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                                                {item.revenue_growth?.toFixed(1)}%
                                            </td>
                                            <td className={`px-3 py-3 text-right font-medium ${item.operating_profit_growth > 0 ? 'text-red-500' : item.operating_profit_growth < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                                                {item.operating_profit_growth?.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-3 text-right text-emerald-600 font-medium">
                                                {item.roe?.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {item.peg > 0 ? item.peg?.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {item.per?.toFixed(1)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {item.pbr?.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {item.debt_ratio?.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {(item.market_cap || 0).toLocaleString()}억
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-600">
                                                {(item.volume || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400 text-right">* KOSPI 상장 종목 대상 검색 (장중: 랭킹 API 전체, 장외: 주요 200개 종목). 1차 필터(PER/PBR/시가총액/거래량) 통과 후 최대 100개 종목에 대해 재무 분석을 수행합니다.</p>
                </div>

                {/* === HTS 0640 투자의견 === */}
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
            </div>
        </SidebarLayout>
    );
}
