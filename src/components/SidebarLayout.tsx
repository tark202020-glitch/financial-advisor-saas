"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggle = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar isCollapsed={isCollapsed} toggle={toggle} />
            <main
                className={`transition-all duration-300 ease-in-out ${isCollapsed ? "pl-20" : "pl-64"}`}
            >
                {children}
            </main>
        </div>
    );
}
