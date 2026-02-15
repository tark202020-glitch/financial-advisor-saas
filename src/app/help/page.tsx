"use client";

import SidebarLayout from "@/components/SidebarLayout";

export default function HelpPage() {
    return (
        <SidebarLayout>
            <div className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto">
                <header className="mb-6 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-black text-[#F7D047] tracking-tight mb-2">도움말</h1>
                    <p className="text-gray-400 text-sm md:text-base">주봇 사용법을 확인하세요.</p>
                </header>

                <div className="w-full flex-1 flex flex-col items-center justify-start">
                    <div className="w-full max-w-5xl">
                        <div style={{ position: "relative", boxSizing: "content-box", maxHeight: "80vh", width: "100%", aspectRatio: "1.23", padding: "40px 0 40px 0" }}>
                            <iframe
                                src="https://app.supademo.com/embed/cmln8x95h30cp5yi39c9jormn?embed_v=2&utm_source=embed"
                                loading="lazy"
                                title="Record Stocks and Set Target Selling Prices in Goraebang"
                                allow="clipboard-write"
                                frameBorder="0"
                                allowFullScreen
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
