"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Settings,
    User,
    LogOut,
    LineChart,
    StickyNote,
    GraduationCap,
    X,
    Bot,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useStudyNotification } from '@/hooks/useStudyNotification';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const { user, logout } = usePortfolio();
    const { hasNewStudy } = useStudyNotification();

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    const navItems = [
        { name: "일일체크", href: "/dashboard", icon: LayoutDashboard },
        { name: "내 주식일지", href: "/portfolio", icon: BookOpen },
        { name: "내 주식 인사이트", href: "/insights", icon: LineChart },
        { name: "주식 스터디", href: "/study", icon: GraduationCap },
        { name: "주식일지메모", href: "/memo", icon: StickyNote },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300
                    ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`
                    fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-[#1E1E1E] z-50 transform transition-transform duration-300 ease-in-out border-l border-[#333] flex flex-col shadow-2xl
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-[#333]">
                    <span className="font-bold text-gray-400">메뉴</span>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-4 border-b border-[#333] bg-[#252525]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-[#F7D047] shrink-0 border border-[#444]">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-white truncate">
                                {user?.user_metadata?.full_name || "Guest"}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                                {user?.email || ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                                    flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#F7D047] text-black shadow-lg shadow-yellow-900/20'
                                        : 'text-gray-400 hover:bg-[#333] hover:text-white'
                                    }
                                `}
                            >
                                <item.icon size={22} className={isActive ? 'text-black' : ''} />
                                <span>{item.name}</span>
                                {item.name === "주식 스터디" && hasNewStudy && (
                                    <span className="px-1.5 py-0.5 ml-auto text-xs font-black bg-red-500 text-white rounded-md animate-pulse">
                                        NEW
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#333]">
                    <button
                        onClick={() => { /* Settings impl later */ onClose(); }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-[#333] hover:text-white transition-all w-full text-sm font-bold mb-2 opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <Settings size={20} />
                        <span>설정</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-900/10 hover:text-red-400 transition-all w-full text-sm font-bold"
                    >
                        <LogOut size={20} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </div>
        </>
    );
}
