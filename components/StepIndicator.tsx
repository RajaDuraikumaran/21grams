"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface StepIndicatorProps {
    currentStep: 'upload' | 'configure' | 'results';
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    const { setStep } = useAppStore();

    const steps = [
        { id: 'upload', label: 'Upload', number: 1 },
        { id: 'configure', label: 'Configure', number: 2 },
        { id: 'results', label: 'Results', number: 3 },
    ] as const;

    const getStepStatus = (stepId: string, index: number) => {
        const stepOrder = ['upload', 'configure', 'results'];
        const currentIndex = stepOrder.indexOf(currentStep);

        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    const handleStepClick = (stepId: 'upload' | 'configure' | 'results', index: number) => {
        const stepOrder = ['upload', 'configure', 'results'];
        const currentIndex = stepOrder.indexOf(currentStep);

        // Only allow going back to previous steps
        if (index < currentIndex) {
            setStep(stepId);
        }
    };

    return (
        <div className="flex items-center gap-4 text-sm">
            {steps.map((step, index) => {
                const status = getStepStatus(step.id, index);
                const isLast = index === steps.length - 1;
                const isClickable = status === 'completed';

                return (
                    <div key={step.id} className="flex items-center gap-4">
                        <div
                            onClick={() => handleStepClick(step.id, index)}
                            className={cn(
                                "flex items-center gap-2 transition-colors",
                                status === 'current' ? "text-white" : "text-zinc-500",
                                isClickable && "cursor-pointer hover:text-zinc-300"
                            )}
                        >
                            <span className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                                status === 'current' || status === 'completed'
                                    ? "bg-white text-zinc-950"
                                    : "border border-zinc-800 font-medium"
                            )}>
                                {step.number}
                            </span>
                            <span className="font-medium">{step.label}</span>
                        </div>
                        {!isLast && <div className="h-[1px] w-8 bg-zinc-800" />}
                    </div>
                );
            })}
        </div>
    );
}
