import SidebarLayout from '@/components/SidebarLayout';
import ReportDashboard from '@/components/report/ReportDashboard';

export const metadata = {
    title: '내 투자리포트 | FinAdvisor',
    description: '기간별 투자 자산 변동 및 상세 매매 내역을 확인하세요.',
};

export default function ReportPage() {
    return (
        <SidebarLayout>
            <div className="flex-1 bg-[#121212] overflow-y-auto">
                <main className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
                    <header className="mb-8">
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                            내 투자리포트
                        </h1>
                        <p className="text-gray-400">
                            지정된 기간 동안의 수익금 상세 추이와 투자금/평가금 변동을 분석합니다.
                        </p>
                    </header>
                    
                    <ReportDashboard />
                </main>
            </div>
        </SidebarLayout>
    );
}
