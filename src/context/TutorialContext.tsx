"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface TutorialContextType {
    currentStep: number;
    nextStep: () => void;
    skipTutorial: () => void;
    isVisible: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if tutorial has been seen
        const hasSeen = localStorage.getItem("hasSeenTutorialV1");
        if (!hasSeen) {
            // Slight delay to show tutorial after initial load
            setTimeout(() => {
                setIsVisible(true);
                setCurrentStep(1);
            }, 1000);
        }
    }, []);

    const nextStep = () => {
        const next = currentStep + 1;

        // Define flow logic purely based on steps
        // Step 1: Dashboard (stays)
        // Step 2: Memo (stays)
        // Step 3: Portfolio (navigate)
        // Step 4: Insights (navigate)
        // Step 5: End

        if (next === 3) {
            router.push("/portfolio");
        } else if (next === 4) {
            router.push("/insights");
        } else if (next > 4) {
            // Finish
            skipTutorial();
            return;
        }

        setCurrentStep(next);
    };

    const skipTutorial = () => {
        setIsVisible(false);
        setCurrentStep(-1);
        localStorage.setItem("hasSeenTutorialV1", "true");
    };

    return (
        <TutorialContext.Provider value={{ currentStep, nextStep, skipTutorial, isVisible }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error("useTutorial must be used within a TutorialProvider");
    }
    return context;
}
