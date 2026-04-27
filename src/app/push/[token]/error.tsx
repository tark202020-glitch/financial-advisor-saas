"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function PushError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 text-center">
        <AlertCircle className="text-yellow-400 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">리포트 표시 오류</h2>
        <p className="text-gray-400 text-sm mb-4">
          리포트를 표시하는 중 문제가 발생했습니다.
        </p>
        <p className="text-gray-500 text-xs mb-6 bg-[#252525] p-3 rounded-lg break-all">
          {error?.message || '알 수 없는 오류'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-gradient-to-r from-[#F7D047] to-[#F59E0B] text-black font-bold rounded-xl transition-all hover:shadow-lg"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
