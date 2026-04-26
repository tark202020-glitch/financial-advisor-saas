"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    BookOpen,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LineChart,
    StickyNote,
    Bot,
    HelpCircle,
    GraduationCap,
    PieChart,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useStudyNotification } from "@/hooks/useStudyNotification";
import AccountModal from "./modals/AccountModal";

interface SidebarProps {
    isCollapsed: boolean;
    toggle: () => void;
}

export default function Sidebar({ isCollapsed, toggle }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = usePortfolio();
    const { hasNewStudy } = useStudyNotification();
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { name: "일일체크", href: "/dashboard", icon: LayoutDashboard },
        { name: "내 주식일지", href: "/portfolio", icon: BookOpen },
        { name: "내 주식 인사이트", href: "/insights", icon: LineChart },
        { name: "내 투자리포트", href: "/report", icon: PieChart },
        { name: "주식 스터디", href: "/study", icon: GraduationCap },
        { name: "주식일지메모", href: "/memo", icon: StickyNote },
    ];

    return (
        <>
            <aside
                className={`
                h-screen bg-[#1E1E1E] border-r border-[#333] fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out flex flex-col
                ${isCollapsed ? "w-20" : "w-64"}
            `}
            >
                {/* Header / Toggle */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-[#333]">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 font-black text-xl text-[#F7D047] tracking-tight">
                            <Bot size={24} strokeWidth={2.5} />
                            <span>JUBOT</span>
                        </div>
                    )}
                    <button
                        onClick={toggle}
                        className="p-2 rounded-lg hover:bg-[#333] text-gray-400 hover:text-white transition-colors ml-auto"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group font-bold
                                ${isActive
                                        ? "bg-[#F7D047] text-black shadow-lg shadow-yellow-900/20"
                                        : "text-gray-400 hover:bg-[#333] hover:text-white"}
                                ${isCollapsed ? "justify-center" : ""}
                            `}
                            >
                                <item.icon size={20} className={isActive ? "text-black" : "group-hover:text-white transition-colors"} />
                                {!isCollapsed && (
                                    <div className="flex items-center gap-2">
                                        <span>{item.name}</span>
                                        {item.name === "주식 스터디" && hasNewStudy && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-md animate-pulse">
                                                NEW
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="h-[1px] bg-[#333] w-full"></div>

                {/* Footer Section (Fixed at bottom) */}
                <div className="p-3 space-y-2 bg-[#1E1E1E]">
                    {/* My Info - Clickable to open AccountModal */}
                    <button
                        onClick={() => setIsAccountModalOpen(true)}
                        className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer
                        ${isCollapsed ? "justify-center hover:bg-[#333]" : "bg-[#252525] hover:bg-[#2a2a2a]"}
                    `}
                    >
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-[#F7D047] shrink-0 border border-[#444]">
                            <User size={16} />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col text-left overflow-hidden w-full">
                                <span className="text-sm font-bold text-gray-300 truncate w-full" title={`${user?.user_metadata?.full_name || "Guest"} / ${user?.email || "No Email"}`}>
                                    {user?.user_metadata?.full_name || "Guest"}
                                </span>
                                <span className="text-xs text-gray-500 truncate w-full">
                                    {user?.email || ""}
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Help Button */}
                    <Link
                        href="/help"
                        className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-gray-400 hover:bg-[#333] hover:text-white
                        ${isCollapsed ? "justify-center" : ""}
                    `}
                    >
                        <HelpCircle size={20} className="group-hover:text-white transition-colors" />
                        {!isCollapsed && <span className="font-bold">도움말</span>}
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200 group
                        ${isCollapsed ? "justify-center" : ""}
                    `}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="font-bold">로그아웃</span>}
                    </button>
                </div>
            </aside>

            {/* Account Modal */}
            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
            />
        </>
    );
}
