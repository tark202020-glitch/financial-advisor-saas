"use client";

import { useTutorial } from "@/context/TutorialContext";
import { Bot, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function JubotGuideOverlay() {
    const { currentStep, nextStep, skipTutorial, isVisible } = useTutorial();
    const pathname = usePathname();
    const [message, setMessage] = useState("");
    const [highlightClass, setHighlightClass] = useState("");

    // --- Content Logic ---
    useEffect(() => {
        if (!isVisible) return;

        // Step definitions
        switch (currentStep) {
            case 1:
                // Dashboard Welcome
                setMessage("안녕하세요! 주식 아가방에서 매일 아침마다 확인해보라고 하는 정보들을 모아놨어요.\n여러 사이트들을 돌아다니면서 봤어야 했는데 내가 한곳에 모아뒀어요. 고마운 마음으로 매일 아침 여기서 시장 브리핑을 확인하세요.");
                break;
            case 2:
                // Memo Intro
                setMessage("생각없이 보지 말고! 이버튼을 눌러서 생각난것들을 메모해둬요.");
                break;
            case 3:
                // Portfolio Input
                setMessage("여기가 핵심입니다!! 주식을 산 목표가 뭔지! 언제 팔 생각인지! 목표를 정해야 한다는것이 이 사이트의 핵심!!!\n내 주식에 대한 메모는 매일 매일 생각이 바뀔수도 있으니 볼때 마다 적어봐요");
                break;
            case 4:
                // Insights
                setMessage("입력한 주식들을 제가 분석해드려요. 분석 내용 감탄만 하지말고 ~ 느낀점, 내가 실제 해야 하는 행동들을 메모해두세요!");
                break;
            default:
                setMessage("");
                break;
        }
    }, [currentStep, isVisible]);

    // Safety check: ensure we are on the right page for the step
    // If user navigates away manually, we might want to pause or redirect back, 
    // but for simplicity, we just show the message if state matches.
    // However, specific steps usually expect specific routes.

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-end pb-12 sm:pb-24 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 animate-in fade-in">
            {/* Guide Container */}
            <div className="pointer-events-auto max-w-[90%] w-[400px] bg-white text-black p-6 rounded-3xl shadow-2xl relative animate-in slide-in-from-bottom-10 fade-in duration-500 border-4 border-[#F7D047]">

                {/* Close Button */}
                <button
                    onClick={skipTutorial}
                    className="absolute top-2 right-2 text-gray-400 hover:text-black p-2"
                    title="튜토리얼 종료"
                >
                    <X size={20} />
                </button>

                {/* Jubot Character Icon */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#F7D047] rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <Bot size={40} className="text-black" strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="pt-8 text-center space-y-4">
                    <p className="text-lg font-bold leading-relaxed whitespace-pre-line break-keep">
                        {message}
                    </p>

                    <div className="flex gap-2 justify-center pt-2">
                        <button
                            onClick={nextStep}
                            className="px-6 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base flex items-center gap-2"
                        >
                            {currentStep === 4 ? "시작하기" : "다음으로 ▶"}
                        </button>
                    </div>

                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-[#F7D047]" : "w-2 bg-gray-200"}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
