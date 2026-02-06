"use client";

import { NewsItem } from '@/lib/mockData';
import { Clock, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface NewsFeedSidebarProps {
    news: NewsItem[];
}

export default function NewsFeedSidebar({ news }: NewsFeedSidebarProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-6">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <TrendingUp size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">AI Analyst Insight</h3>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {news.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer group ${expandedId === item.id ? 'ring-2 ring-indigo-500/20' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${item.sentiment === 'positive' ? 'bg-red-100 text-red-600' :
                                item.sentiment === 'negative' ? 'bg-blue-100 text-blue-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {item.sentiment === 'positive' && <TrendingUp size={10} />}
                                {item.sentiment === 'negative' && <TrendingDown size={10} />}
                                {item.sentiment === 'neutral' && <Minus size={10} />}
                                {item.sentiment.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center">
                                <Clock size={10} className="mr-1" />
                                {item.time}
                            </span>
                        </div>

                        <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                        </h4>

                        {/* Expanded Content */}
                        {expandedId === item.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 animate-in fade-in slide-in-from-top-1 duration-200">
                                <p className="mb-2">
                                    이 뉴스는 <strong>{item.relatedStocks.join(', ')}</strong> 주가에 {item.sentiment === 'positive' ? '긍정적' : item.sentiment === 'negative' ? '부정적' : '중립적'} 영향을 미칠 것으로 분석됩니다.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs mt-2">
                            <span className="text-slate-500 font-medium">{item.source}</span>
                            <div className="flex gap-1 items-center">
                                {item.relatedStocks.map(stock => (
                                    <span key={stock} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                        {stock}
                                    </span>
                                ))}
                                {expandedId === item.id ? <ChevronUp size={14} className="ml-1 text-slate-400" /> : <ChevronDown size={14} className="ml-1 text-slate-400" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-3 text-sm text-slate-500 font-medium hover:text-slate-800 border-t border-slate-200 transition-colors">
                전체 뉴스 보기
            </button>
        </div>
    );
}
