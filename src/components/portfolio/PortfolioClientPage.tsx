"use client";

import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import SidebarLayout from '@/components/SidebarLayout';

interface Props {
    serverDebugInfo?: {
        userEmail: string | null;
        portfolioCount: number | null;
        error: string | null;
    }
}

export default function PortfolioClientPage({ serverDebugInfo }: Props) {
    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6">

                {/* Debug Info */}
                {serverDebugInfo && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                        <p className="font-bold">🔍 Server-Side Verification:</p>
                        <ul className="list-disc pl-5 mt-1">
                            <li>User: {serverDebugInfo.userEmail || "No User (Server)"}</li>
                            <li>DB Portfolio Count: {serverDebugInfo.portfolioCount !== null ? serverDebugInfo.portfolioCount : "N/A"}</li>
                            {serverDebugInfo.error && <li className="text-red-600">Error: {serverDebugInfo.error}</li>}
                        </ul>
                        <p className="mt-2 text-xs text-yellow-600">
                            만약 DB Count가 0보다 큰데 아래 목록이 비어있다면, 클라이언트 상태(Context) 문제입니다.<br />
                            만약 DB Count가 0이라면, 데이터가 실제로 없거나 계정이 다를 수 있습니다.
                        </p>
                    </div>
                )}

                {/* Add Asset Section */}
                <section>
                    <AddAssetForm />
                </section>

                {/* Asset List Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">내 주식에 메모하기</h2>
                    <PortfolioTable />
                </section>
            </div>
        </SidebarLayout>
    );
}
