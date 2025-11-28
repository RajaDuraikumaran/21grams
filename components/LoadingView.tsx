"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface LoadingViewProps {
    onComplete: () => void;
    onCancel?: () => void;
}

export function LoadingView({ onComplete, onCancel }: LoadingViewProps) {
    const { selectedStyles, setGeneratedImages, preview } = useAppStore();
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("Initializing neural network...");
    const [isCancelled, setIsCancelled] = useState(false);

    // Rotating text messages
    useEffect(() => {
        const messages = [
            "Analyzing facial geometry...",
            "Mapping 3D contours...",
            "Calculating lighting angles...",
            "Synthesizing textures...",
            "Refining details...",
            "Polishing final output..."
        ];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setLoadingText(messages[index]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        const signal = abortController.signal;

        const generateImages = async () => {
            const { uploadedUrl } = useAppStore.getState();

            if (!uploadedUrl) {
                console.error("No uploaded URL found");
                onComplete();
                return;
            }

            const total = selectedStyles.length;
            const results: string[] = [];
            let completed = 0;

            try {
                for (const style of selectedStyles) {
                    if (signal.aborted) break;

                    try {
                        const response = await fetch("/api/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                imageUrl: uploadedUrl,
                                styleId: style,
                                filters: useAppStore.getState().selectedFilters,
                            }),
                            signal,
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || "Generation failed");
                        }

                        const data = await response.json();
                        if (data.imageUrl) results.push(data.imageUrl);

                        if (selectedStyles.indexOf(style) < selectedStyles.length - 1) {
                            await new Promise((resolve) => {
                                const timeout = setTimeout(resolve, 10000);
                                signal.addEventListener('abort', () => clearTimeout(timeout));
                            });
                        }
                    } catch (error: any) {
                        if (error.name === 'AbortError') {
                            console.log('Generation cancelled');
                            return;
                        }
                        console.error(`Failed to generate style ${style}:`, error);
                        toast.error(`Failed to generate ${style}: ${error.message}`);
                    } finally {
                        if (!signal.aborted) {
                            completed++;
                            setProgress(Math.round((completed / total) * 100));
                        }
                    }
                }

                if (!signal.aborted) {
                    setGeneratedImages(results);
                    setProgress(100);
                    setTimeout(() => onComplete(), 500);
                }
            } catch (error) {
                console.error("Generation process failed:", error);
            }
        };

        generateImages();

        return () => {
            abortController.abort();
        };
    }, [selectedStyles, setGeneratedImages, onComplete]);

    // Circular Progress Calculation
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4">
            <div className="relative flex flex-col items-center justify-center">

                {/* Central Avatar Container */}
                <div className="relative h-64 w-64">
                    {/* Circular Progress Ring */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            className="stroke-zinc-800"
                            strokeWidth="4"
                            fill="transparent"
                        />
                        <motion.circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            className="stroke-cyan-400"
                            strokeWidth="4"
                            fill="transparent"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            style={{ strokeDasharray: circumference }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </svg>

                    {/* Avatar with Scanner Overlay */}
                    <div className="absolute inset-4 overflow-hidden rounded-full border-4 border-zinc-900 bg-zinc-950">
                        {preview && (
                            <motion.div
                                className="relative h-full w-full opacity-50 grayscale"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Image
                                    src={preview}
                                    alt="Processing"
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        )}

                        {/* Scanning Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(circle,black,transparent_80%)]" />

                        {/* Scanning Beam */}
                        <motion.div
                            className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </div>

                {/* Text Rotator */}
                <div className="mt-12 h-20 text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={loadingText}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <h2 className="text-2xl font-bold text-white md:text-3xl">
                                {loadingText}
                            </h2>
                            <p className="text-sm font-medium text-cyan-400">
                                {progress}% Complete
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Cancel Button */}
                {onCancel && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        onClick={onCancel}
                        className="mt-8 text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
                    >
                        Cancel Generation
                    </motion.button>
                )}
            </div>
        </div>
    );
}
