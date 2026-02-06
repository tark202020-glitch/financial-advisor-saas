"use client";

import { useWebSocketContext } from "@/context/WebSocketContext";
import { useState, useEffect } from "react";

export default function DebugPanel() {
    const { status, debugLogs } = useWebSocketContext();
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return <button onClick={() => setIsVisible(true)} className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded z-50">Show Debug</button>;

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-1/2 h-64 bg-black/90 text-green-400 font-mono text-xs p-4 overflow-auto z-50 border-t border-green-500">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-base">WebSocket Diagnostics</h3>
                <button onClick={() => setIsVisible(false)} className="text-white bg-red-600 px-2 rounded">Hide</button>
            </div>
            <div className="mb-2">
                Status: <span className={status === 'connected' ? 'text-green-300' : 'text-red-500'}>{status}</span>
            </div>
            <div className="space-y-1">
                {debugLogs.map((log, i) => (
                    <div key={i} className="border-b border-gray-700 pb-1 break-all">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
