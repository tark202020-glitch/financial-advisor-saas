"use client";

import { Bot, Menu } from "lucide-react";

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-[#1E1E1E] border-b border-[#333] flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-2 font-black text-lg text-[#F7D047] tracking-tight">
                <Bot size={24} strokeWidth={2.5} />
                <span>JUBOT</span>
            </div>
            <button
                onClick={onMenuClick}
                className="p-2 -mr-2 text-gray-300 hover:text-white transition-colors"
            >
                <Menu size={24} />
            </button>
        </header>
    );
}
