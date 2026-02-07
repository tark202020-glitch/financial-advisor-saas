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


export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-sans">

            {/* 1. Macro Strip */}
            <div className="sticky top-0 z-50">
                <MacroStrip
                    indices={MACRO_INDICES}
                    exchangeRate={EXCHANGE_RATE}
                    interestRates={INTEREST_RATES}
                />
            </div>

            <div className="max-w-[1600px] mx-auto p-6">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Market Insight Advisor</h1>
                        <p className="text-slate-500 text-sm">Today&apos;s market context and investment opportunities.</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Login button removed as we are inside dashboard, maybe Logout or Profile? */}
                        <Link href="/portfolio" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2">
                            <BookOpen size={16} />
                            내 주식일지로
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Main Charts & Lists (8 cols) -> Expanded to 9 */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">

                        {/* 2. Market Flow (Investor Trends) */}
                        <div className="w-full">
                            <MarketFlowChart />
                        </div>

                        {/* 3. Watchlists (Client Component) */}
                        <DashboardWatchlists />

                    </div>

                    {/* RIGHT COLUMN: AI Analysis (4 cols) */}
                    <div className="col-span-12 lg:col-span-3">
                        {/* 4. News Feed */}
                        <div className="sticky top-[70px] h-[calc(100vh-100px)]">
                            <NewsFeedSidebar news={NEWS_FEED} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
