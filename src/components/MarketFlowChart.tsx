"use client";

import { useMemo, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketIndex } from '@/hooks/useMarketIndex';
import SectorBarChart from './SectorBarChart';

// --- Types ---
interface InvestorData {
    individual: number;
    foreign: number;
    institution: number;
}

// --- Components ---

function DomesticIndexCard({ name, symbol, marketCode }: { name: string, symbol: string, marketCode: string }) {
    // 1. Price Data
    const indexData = useMarketIndex(symbol, 0, 'KR');

    // 2. Investor Data (RealTime)
    const [investor, setInvestor] = useState<InvestorData>({ individual: 0, foreign: 0, institution: 0 });

    useEffect(() => {
        const fetchInvestor = async () => {
            try {
                // Determine Code mapping (KOSPI=0001, KOSDAQ=1001) for route
                const res = await fetch(`/api/kis/market/investor?symbol=${marketCode}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data && data.realtime && data.realtime.length > 0) {
                    const latest = data.realtime[0];
                    setInvestor({
                        individual: parseInt(latest.prsn_ntby_tr_pbmn || '0'),
                        foreign: parseInt(latest.frgn_ntby_tr_pbmn || '0'),
                        institution: parseInt(latest.orgn_ntby_tr_pbmn || '0'),
                    });
                }
            } catch (e) {
                // console.error(e);
            }
        };

        fetchInvestor();
        const interval = setInterval(fetchInvestor, 60000); // 1 min update
        return () => clearInterval(interval);
    }, [marketCode]);

    const isUp = indexData.change >= 0;
    const fmt = (n: number) => Math.abs(n / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }); // 억 unit, No decimal

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex-1">
            <div className="flex items-center gap-2 mb-2 border-l-4 border-blue-600 pl-3">
                <h3 className="text-lg font-bold text-slate-800">{name}</h3>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-slate-900 tracking-tight">
                    {indexData.value > 0 ? indexData.value.toLocaleString() : 'Loading...'}
                </span>
                {indexData.value > 0 && (
                    <div className={`flex items-center text-lg font-medium ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                        {isUp ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                        <span className="ml-1">{Math.round(Math.abs(indexData.change)).toLocaleString()}</span>
                        <span className="ml-2 text-base opacity-90">{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                    </div>
                )}
            </div>

            <div className="flex items-center text-sm text-slate-600 gap-4 pt-4 border-t border-slate-100">
                <div className="flex gap-1">
                    <span className="text-slate-500">개인</span>
                    <span className={`font-semibold ${investor.individual > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {fmt(investor.individual)}억
                    </span>
                </div>
                <div className="w-px h-3 bg-slate-300"></div>
                <div className="flex gap-1">
                    <span className="text-slate-500">외국인</span>
                    <span className={`font-semibold ${investor.foreign > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {fmt(investor.foreign)}억
                    </span>
                </div>
                <div className="w-px h-3 bg-slate-300"></div>
                <div className="flex gap-1">
                    <span className="text-slate-500">기관</span>
                    <span className={`font-semibold ${investor.institution > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {fmt(investor.institution)}억
                    </span>
                </div>
            </div>
        </div>
    );
}

function OverseasRow({ name, symbol }: { name: string, symbol: string }) {
    // Uses getOverseasIndex (.SPX etc)
    const indexData = useMarketIndex(symbol, 0, 'US');
    const hasData = indexData.value > 0;
    const isUp = indexData.change >= 0;

    // Build Time String
    // Format: "MM/DD HH:mm 지연" or "종가"
    let timeStr = "";
    if (indexData.date && indexData.time) {
        // ymd: YYYYMMDD, time: HHMMSS
        const mm = indexData.date.slice(4, 6);
        const dd = indexData.date.slice(6, 8);
        const HH = indexData.time.slice(0, 2);
        const Min = indexData.time.slice(2, 4);
        const status = indexData.isDelay ? "지연" : "종가"; // Or Check time?
        timeStr = `${mm}/${dd} ${HH}:${Min} ${status}`;
    }

    return (
        <div className="grid grid-cols-3 items-center py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 transition-colors">
            {/* Col 1: Name & Time */}
            <div className="flex flex-col">
                <div className="font-bold text-slate-700">{name}</div>
                {timeStr && <div className="text-[10px] text-slate-400">{timeStr}</div>}
            </div>

            {/* Col 2: Change & Rate */}
            <div className={`flex items-center justify-center gap-2 font-medium ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                {hasData ? (
                    <>
                        <span>{isUp ? '+' : ''}{Math.round(indexData.change).toLocaleString()}</span>
                        <span className="text-sm opacity-90">{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                    </>
                ) : '-'}
            </div>

            {/* Col 3: Index Value (Right Aligned) */}
            <div className="text-right">
                <div className="font-bold text-slate-900 text-lg">
                    {hasData ? indexData.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                </div>
            </div>
        </div>
    );
}

function MarketTrendRow({ name, marketCode }: { name: string, marketCode: string }) {
    const [investor, setInvestor] = useState<InvestorData>({ individual: 0, foreign: 0, institution: 0 });

    useEffect(() => {
        const fetchInvestor = async () => {
            try {
                const res = await fetch(`/api/kis/market/investor?symbol=${marketCode}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data && data.realtime && data.realtime.length > 0) {
                    const latest = data.realtime[0];
                    setInvestor({
                        individual: parseInt(latest.prsn_ntby_tr_pbmn || '0'),
                        foreign: parseInt(latest.frgn_ntby_tr_pbmn || '0'),
                        institution: parseInt(latest.orgn_ntby_tr_pbmn || '0'),
                    });
                }
            } catch (e) { }
        };
        fetchInvestor();
    }, [marketCode]);

    const fmt = (n: number) => (n / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const col = (n: number) => n > 0 ? 'text-red-500' : 'text-blue-500';

    return (
        <div className="grid grid-cols-4 py-4 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50 px-2">
            <div className="font-bold text-lg text-slate-800">{name}</div>
            <div className={`text-right font-medium ${col(investor.foreign)}`}>{fmt(investor.foreign)}</div>
            <div className={`text-right font-medium ${col(investor.individual)}`}>{fmt(investor.individual)}</div>
            <div className={`text-right font-medium ${col(investor.institution)}`}>{fmt(investor.institution)}</div>
        </div>
    );
}

export default function MarketFlowChart() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} 최근 업데이트`;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800">지수종합</h2>
                <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
            </div>

            {/* Top Row: Domestic Indices */}
            <div className="flex flex-col lg:flex-row gap-6">
                <DomesticIndexCard name="KOSPI" symbol="0001" marketCode="0001" />
                <DomesticIndexCard name="KOSDAQ" symbol="1001" marketCode="1001" />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Overseas List */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">해외</h3>
                    <div>
                        <OverseasRow name="DOW" symbol=".DJI" />
                        <OverseasRow name="NASDAQ" symbol="COMP" />
                        <OverseasRow name="S&P500" symbol="SPX" />
                        {/* <OverseasRow name="Hong Kong H" symbol="HSCEI" /> */}
                        {/* <OverseasRow name="Nikkei" symbol="N225" /> */}
                    </div>
                </div>

                {/* Market Trend Table */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-lg text-slate-800">마켓트렌드</h3>
                        <span className="text-xs text-slate-400">단위/억원</span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-4 text-xs text-slate-500 pb-2 border-b border-slate-100 px-2">
                        <div>종목명</div>
                        <div className="text-right">외국인</div>
                        <div className="text-right">개인</div>
                        <div className="text-right">기관</div>
                    </div>

                    {/* Table Body */}
                    <div>
                        <MarketTrendRow name="코스피" marketCode="0001" />
                        <MarketTrendRow name="코스닥" marketCode="1001" />
                        <MarketTrendRow name="ETF" marketCode="ETF" />
                    </div>
                </div>
            </div>

            {/* Sector Bar Chart (HTS 0218) */}
            <SectorBarChart />
        </div>
    );
}
