import MacroStrip from '@/components/MacroStrip';
import MarketFlowChart from '@/components/MarketFlowChart';
import NewsFeedSidebar from '@/components/NewsFeedSidebar';
import DashboardWatchlists from '@/components/DashboardWatchlists';
import {
    NEWS_FEED,
    MACRO_INDICES,
    EXCHANGE_RATE,
    INTEREST_RATES
} from '@/lib/mockData';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import UserMenu from '@/components/UserMenu';


export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-sans">
            <div className="max-w-[1600px] mx-auto p-6">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">일일 체크</h1>
                        <p className="text-slate-500 text-sm">매일 확인해야할 주식 정보를 보여줍니다.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <UserMenu />
                        <Link href="/portfolio" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2">
                            <BookOpen size={16} />
                            내 주식일지로
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    {/* Main Content (Full Width) */}
                    <div className="col-span-12 space-y-6">

                        {/* 1. Market Info & Trends (Merged) */}
                        <div className="w-full">
                            <MarketFlowChart />
                        </div>

                        {/* 2. Watchlists */}
                        <DashboardWatchlists />

                    </div>
                </div>
            </div>
        </main>
    );
}
