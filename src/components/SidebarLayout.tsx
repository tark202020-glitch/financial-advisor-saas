"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import MemoOverlay from "./memo/MemoOverlay";
import { StickyNote } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import MobileHeader from "./mobile/MobileHeader";
import MobileDrawer from "./mobile/MobileDrawer";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMemoOpen, setIsMemoOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Detect mobile
    const isMobile = useMobile();

    const toggle = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="min-h-screen bg-[#121212] font-sans text-gray-200">
            {/* Desktop Sidebar (Hide on mobile) */}
            {!isMobile && (
                <Sidebar isCollapsed={isCollapsed} toggle={toggle} />
            )}

            {/* Mobile Header (Show on mobile) */}
            {isMobile && (
                <>
                    <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
                    <MobileDrawer
                        isOpen={isMobileDrawerOpen}
                        onClose={() => setIsMobileDrawerOpen(false)}
                    />
                </>
            )}

            <main
                className={`
                    transition-all duration-300 ease-in-out
                    ${isMobile ? "pt-14 p-4" : (isCollapsed ? "pl-20" : "pl-64")}
                `}
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
                    className="fixed bottom-6 right-6 w-14 h-14 bg-[#F7D047] text-black rounded-full shadow-lg shadow-yellow-900/20 hover:shadow-xl hover:shadow-yellow-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center z-[9998] group"
                    title="메모 열기"
                >
                    <StickyNote size={24} className="group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}
