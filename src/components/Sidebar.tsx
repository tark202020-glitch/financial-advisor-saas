"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Settings,
    User,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Wallet
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
    isCollapsed: boolean;
    toggle: () => void;
}

export default function Sidebar({ isCollapsed, toggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // 1. Try fetching session first (faster)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }

            // 2. Validate with server
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            }

            setLoading(false);
        };
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                router.push('/login');
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const navItems = [
        { name: "일일체크", href: "/dashboard", icon: LayoutDashboard },
        { name: "내 주식일지", href: "/portfolio", icon: BookOpen },
        { name: "설정", href: "#", icon: Settings, disabled: true }, // Placeholder
    ];

    return (
        <aside
            className={`
                h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out flex flex-col
                ${isCollapsed ? "w-20" : "w-64"}
            `}
        >
            {/* Header / Toggle */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                {!isCollapsed && (
                    <span className="font-bold text-xl text-slate-800 tracking-tight">FinAdvisor</span>
                )}
                <button
                    onClick={toggle}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors ml-auto"
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
                                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                                ${item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                                ${isCollapsed ? "justify-center" : ""}
                            `}
                        >
                            <item.icon size={20} className={isActive ? "text-indigo-600" : "group-hover:text-slate-700"} />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-slate-100 mx-2"></div>

                {/* My Info & Logout */}
                {/* My Info & Logout */}
                <div
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        ${isCollapsed ? "justify-center" : "bg-slate-50"}
                    `}
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <User size={16} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col text-left overflow-hidden">
                            {loading ? (
                                <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
                            ) : (
                                <>
                                    <span className="text-sm font-bold text-slate-800 truncate" title={user?.email}>
                                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest"}
                                    </span>
                                    <span className="text-xs text-slate-500 truncate max-w-[140px]" title={user?.email}>
                                        {user?.email || "No Email"}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group mt-auto
                        ${isCollapsed ? "justify-center" : ""}
                    `}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-medium">로그아웃</span>}
                </button>
            </nav>
        </aside>
    );
}
