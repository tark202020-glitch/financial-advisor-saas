"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import MemoOverlay from "./memo/MemoOverlay";
import { StickyNote } from "lucide-react";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMemoOpen, setIsMemoOpen] = useState(false);

    const toggle = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar isCollapsed={isCollapsed} toggle={toggle} />
            <main
                className={`transition-all duration-300 ease-in-out ${isCollapsed ? "pl-20" : "pl-64"}`}
            >
                {children}
            </main>

            {/* Layer 2: Memo Overlay */}
            <MemoOverlay
                isOpen={isMemoOpen}
                onClose={() => setIsMemoOpen(false)}
                onMinimize={() => setIsMemoOpen(false)}
            />

            {/* FAB Button for Memo */}
            {!isMemoOpen && (
                <button
                    onClick={() => setIsMemoOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center z-[9998] group"
                    title="메모 열기"
                >
                    <StickyNote size={22} className="group-hover:rotate-12 transition-transform" />
                </button>
            )}
        </div>
    );
}
