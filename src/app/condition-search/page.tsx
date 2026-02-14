"use client";

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from "@/components/SidebarLayout";
import JubotPageGuide from '@/components/common/JubotPageGuide';

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
    const [progress, setProgress] = useState<{ total: number; current: number; matched: number } | null>(null);

    // Preset State
    const [presets, setPresets] = useState<Preset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState('');
    const [isSaving, setIsSaving] = useState(false);



    // === Load Presets ===
    const loadPresets = useCallback(async () => {
        try {
            const res = await fetch('/api/condition-presets');
            if (res.ok) {
                const data = await res.json();
                setPresets(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to load presets:', e);
        }
    }, []);

    useEffect(() => {
        loadPresets();
    }, [loadPresets]);

    // === Search Handler with SSE streaming ===
    const handleSearch = async () => {
        setIsSearching(true);
        setResults([]);
        setProgress(null);
        setStatusMsg('KOSPI 종목 수집 중...');

        try {
            const params = new URLSearchParams();
            CONDITION_FIELDS.forEach(field => {
                const range = conditions[field.key];
                if (range.min !== '') params.set(field.paramMin, range.min);
                if (range.max !== '') params.set(field.paramMax, range.max);
            });

            const response = await fetch(`/api/kis/ranking/simple?${params.toString()}`);

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'status') {
                                setStatusMsg(data.message);
                                if (data.progress) setProgress(data.progress);
                            } else if (data.type === 'progress') {
                                setStatusMsg(data.message);
                                if (data.progress) setProgress(data.progress);
                            } else if (data.type === 'done') {
                                setResults(data.results || []);
                                const m = data.meta;
                                setStatusMsg(
                                    `✅ 검색 완료: ${m.matched}건 발견 (전체 ${m.totalCandidates}개 → 1차필터 ${m.afterStage1}개 → 재무분석 ${m.processed}개)`
                                );
                                setProgress(null);
                            } else if (data.type === 'error') {
                                setStatusMsg(`❌ 오류: ${data.message}`);
                                setProgress(null);
                            }
                        } catch {
                            // skip invalid JSON
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error(e);
            setStatusMsg(`❌ 오류 발생: ${e.message}`);
        } finally {
            setIsSearching(false);
            setProgress(null);
        }
    };

    // === Preset Handlers ===
    const handleSavePreset = async () => {
        if (!presetName.trim()) { alert('프리셋 이름을 입력해주세요.'); return; }
        setIsSaving(true);
        try {
            const res = await fetch('/api/condition-presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: presetName.trim(), conditions }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
            setPresetName('');
            loadPresets();
            setStatusMsg(`"${presetName.trim()}" 프리셋이 저장되었습니다.`);
        } catch (e: any) { alert(`저장 실패: ${e.message}`); }
        finally { setIsSaving(false); }
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
        } catch { alert('삭제 실패'); }
    };

    const handleResetConditions = () => {
        setConditions({ ...DEFAULT_CONDITIONS });
        setSelectedPresetId('');
        setStatusMsg('조건이 초기화되었습니다.');
    };



    // === Condition Change Handler ===
    const updateCondition = (key: keyof SimpleConditions, field: 'min' | 'max', value: string) => {
        setConditions(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };

    // Progress percentage
    const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

    // === Render ===
    return (
        <SidebarLayout>
            <div className="p-1 pb-32 sm:p-8 sm:pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-white">조건검색</h1>
                        <JubotPageGuide guideText={`내가 원하는 재무 조건(매출증가율, 영업이익률 등)에 맞는\n우량주를 발굴하는 공간입니다.`} />
                    </div>
                    <p className="text-gray-400">원하는 조건으로 KOSPI 전체 종목을 분석합니다.</p>
                </header>

                {/* === 조건검색 === */}
                <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-6 shadow-lg shadow-black/20 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#333] pb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#F7D047]/20 text-[#F7D047] text-xs font-bold px-2 py-1 rounded border border-[#F7D047]/50">HTS 0330</div>
                            <h2 className="text-xl font-bold text-white">사용자 조건검색</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetConditions}
                                disabled={isSearching}
                                className="px-4 py-2.5 bg-[#252525] text-gray-400 rounded-lg text-sm font-medium hover:bg-[#333] transition disabled:opacity-50 border border-[#333]"
                            >
                                초기화
                            </button>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-900/30"
                            >
                                {isSearching ? '검색 중...' : '🔍 조건검색 실행'}
                            </button>
                        </div>
                    </div>

                    {/* === Preset Section === */}
                    <div className="bg-[#252525] rounded-xl p-4 space-y-3 border border-[#333]">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            조건 프리셋
                        </h3>
                        {presets.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {presets.map(preset => (
                                    <div key={preset.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleLoadPreset(preset.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedPresetId === preset.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-[#1E1E1E] text-gray-400 border border-[#333] hover:bg-[#333] hover:text-white'
                                                }`}
                                        >
                                            {preset.name}
                                        </button>
                                        <button onClick={() => handleDeletePreset(preset.id)} className="text-gray-500 hover:text-red-400 transition p-1" title="삭제">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                                placeholder="프리셋 이름 (예: 저평가가치주)"
                                className="flex-1 px-3 py-2 border border-[#333] rounded-lg text-sm outline-none focus:border-blue-500 bg-[#1E1E1E] text-white placeholder-gray-600"
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()} />
                            <button onClick={handleSavePreset} disabled={isSaving || !presetName.trim()}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
                                {isSaving ? '저장 중...' : '현재 조건 저장'}
                            </button>
                        </div>
                    </div>

                    {/* === 10 Condition Inputs === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {CONDITION_FIELDS.map(field => (
                            <div key={field.key} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-300">{field.label}</label>
                                    <span className="text-xs text-gray-500">{field.unit}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input type="number" value={conditions[field.key].min}
                                        onChange={(e) => updateCondition(field.key, 'min', e.target.value)}
                                        className="w-full px-2.5 py-2 border border-[#333] rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-[#121212] text-white placeholder-gray-700"
                                        placeholder="최소" disabled={isSearching} />
                                    <span className="text-gray-600 text-xs flex-shrink-0">~</span>
                                    <input type="number" value={conditions[field.key].max}
                                        onChange={(e) => updateCondition(field.key, 'max', e.target.value)}
                                        className="w-full px-2.5 py-2 border border-[#333] rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-[#121212] text-white placeholder-gray-700"
                                        placeholder="최대" disabled={isSearching} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* === Loading / Progress Section === */}
                    {isSearching && (
                        <div className="bg-[#1e293b] rounded-xl p-6 border border-blue-900/50 space-y-4">
                            {/* Animated Header */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-100">종목 분석 진행 중</h3>
                                    <p className="text-xs text-blue-300">KOSPI 전체 종목의 재무 데이터를 분석하고 있습니다</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {progress && (
                                <div className="space-y-2">
                                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-200">
                                        <span>{progress.current} / {progress.total} 종목 분석</span>
                                        <span className="font-bold">{progressPercent}%</span>
                                    </div>
                                    {progress.matched !== undefined && progress.matched > 0 && (
                                        <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg px-3 py-2 mt-2">
                                            <span className="text-sm text-emerald-400 font-medium">
                                                🎯 현재까지 <span className="font-bold">{progress.matched}건</span> 조건 만족
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Status Message */}
                            <p className="text-sm text-blue-200">{statusMsg}</p>
                        </div>
                    )}

                    {/* Status (non-searching) */}
                    {!isSearching && statusMsg && (
                        <div className="text-sm text-gray-300 bg-[#252525] px-4 py-3 rounded-lg border border-[#333]">
                            {statusMsg}
                        </div>
                    )}

                    {/* === Results Table === */}
                    {!isSearching && results.length > 0 && (
                        <div className="overflow-x-auto border border-[#333] rounded-xl">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-[#252525] text-gray-400 font-medium border-b border-[#333]">
                                    <tr>
                                        <th className="px-3 py-3 sticky left-0 bg-[#252525] z-10">종목명</th>
                                        <th className="px-3 py-3 text-right">현재가</th>
                                        <th className="px-3 py-3 text-right">매출증가율</th>
                                        <th className="px-3 py-3 text-right">영업이익증가율</th>
                                        <th className="px-3 py-3 text-right">ROE</th>
                                        <th className="px-3 py-3 text-right">PEG</th>
                                        <th className="px-3 py-3 text-right">PER</th>
                                        <th className="px-3 py-3 text-right">PBR</th>
                                        <th className="px-3 py-3 text-right">배당률</th>
                                        <th className="px-3 py-3 text-right">부채비율</th>
                                        <th className="px-3 py-3 text-right">시가총액</th>
                                        <th className="px-3 py-3 text-right">거래량</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#333] bg-[#1E1E1E]">
                                    {results.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-[#252525] transition-colors">
                                            <td className="px-3 py-3 font-medium text-white sticky left-0 bg-[#1E1E1E] z-10">
                                                {item.name}
                                                <span className="text-gray-500 text-xs ml-1">{item.symbol}</span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold text-white">{item.price?.toLocaleString()}</td>
                                            <td className={`px-3 py-3 text-right font-medium ${item.revenue_growth > 0 ? 'text-red-400' : item.revenue_growth < 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                                {item.revenue_growth?.toFixed(1)}%
                                            </td>
                                            <td className={`px-3 py-3 text-right font-medium ${item.operating_profit_growth > 0 ? 'text-red-400' : item.operating_profit_growth < 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                                {item.operating_profit_growth?.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-3 text-right text-emerald-400 font-medium">{item.roe?.toFixed(1)}%</td>
                                            <td className="px-3 py-3 text-right text-gray-400">{item.peg > 0 ? item.peg?.toFixed(2) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-gray-400">{item.per?.toFixed(1)}</td>
                                            <td className="px-3 py-3 text-right text-gray-400">{item.pbr?.toFixed(2)}</td>
                                            <td className={`px-3 py-3 text-right font-medium ${item.dividend_yield > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                                {item.dividend_yield > 0 ? `${item.dividend_yield?.toFixed(2)}%` : '-'}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-400">{item.debt_ratio?.toFixed(1)}%</td>
                                            <td className="px-3 py-3 text-right text-gray-400">{(item.market_cap || 0).toLocaleString()}억</td>
                                            <td className="px-3 py-3 text-right text-gray-400">{(item.volume || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}

                    {!isSearching && results.length === 0 && !statusMsg.includes('검색 완료') && (
                        <div className="text-center py-12 text-gray-500">
                            조건을 설정하고 검색을 실행해주세요.
                        </div>
                    )}

                    <p className="text-xs text-gray-600 text-right">
                        * KOSPI 상장 종목 전체 대상 분석 (장중: 랭킹 API + 추가 종목 보충, 장외: 주요 200개 종목). 1차 필터 통과 종목 전체에 대해 재무 분석을 수행합니다.
                    </p>
                </div>


            </div>
        </SidebarLayout>
    );
}
