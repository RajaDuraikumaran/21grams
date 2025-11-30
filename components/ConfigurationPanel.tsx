"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { StepIndicator } from "@/components/StepIndicator";

import { STYLES } from "@/lib/styles";

const FILTERS = [
    "Smooth Skin",
    "Reduce Circles",
    "Smooth Hair",
    "Enhance Contours",
    "Whiten Teeth",
    "Remove Marks",
    "Gentle Smile",
    "Serious Expression",
    "Looking Sideways",
    "Direct Gaze",
];

interface ConfigurationPanelProps {
    onGenerate: () => void;
}

export function ConfigurationPanel({ onGenerate }: ConfigurationPanelProps) {
    const {
        preview,
        selectedStyles,
        setSelectedStyles,
        selectedFilters,
        setSelectedFilters,
        credits,
        setCredits
    } = useAppStore();

    const handleGenerateClick = () => {
        const cost = 4;
        if (credits >= cost) {
            setCredits(credits - cost);
            toast.info("Sending to AI...");
            onGenerate();
        } else {
            alert("Insufficient Credits! Please purchase more to continue.");
        }
    };

    const toggleStyle = (id: string) => {
        setSelectedStyles(
            selectedStyles.includes(id)
                ? selectedStyles.filter((s) => s !== id)
                : [...selectedStyles, id]
        );
    };

    const toggleFilter = (filter: string) => {
        setSelectedFilters(
            selectedFilters.includes(filter)
                ? selectedFilters.filter((f) => f !== filter)
                : [...selectedFilters, filter]
        );
    };

    return (
        <div className="flex min-h-[80vh] w-full flex-col items-center justify-start gap-12">
            {/* Step Indicator */}
            <div className="mb-2">
                <StepIndicator currentStep="configure" />
            </div>

            <div className="flex w-full flex-col items-start gap-8 lg:flex-row lg:gap-12">
                {/* Left Column: Sticky User Photo */}
                <div className="w-full lg:sticky lg:top-32 lg:w-1/3 lg:h-fit z-10">
                    <motion.div
                        layoutId="user-image"
                        className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl"
                    >
                        {preview && (
                            <Image
                                src={preview!}
                                alt="User Upload"
                                fill
                                className="object-cover"
                            />
                        )}
                        {/* Overlay Gradient for cinematic feel */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </motion.div>
                </div>

                {/* Right Column: Configuration Controls (Glass Overlay) */}
                <div className="glass-panel flex w-full flex-col gap-8 rounded-3xl p-8 lg:w-2/3 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Configure Generation</h2>
                            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                                Credits: {credits}
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                            Customize your professional headshots.
                        </p>
                    </div>

                    {/* Style Grid (Compact 3-Column) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
                                Select Styles <span className="text-zinc-500 normal-case tracking-normal ml-2">* Select at least one</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                            {STYLES.map((style) => {
                                const isSelected = selectedStyles.includes(style.id);
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => toggleStyle(style.id)}
                                        className={cn(
                                            "group relative aspect-square w-full overflow-hidden rounded-xl border transition-all duration-200",
                                            isSelected
                                                ? "border-indigo-500 ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-[1.02]"
                                                : "border-white/10 hover:border-white/30 hover:scale-[1.02]"
                                        )}
                                    >
                                        <Image
                                            src={style.src}
                                            alt={style.label}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        />

                                        {isSelected && (
                                            <div className="absolute top-1.5 right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[2px] py-1.5 px-2">
                                            <p className="text-[10px] font-medium text-white text-center truncate leading-tight">
                                                {style.label}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enhancement Filters (Wrap Layout) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
                                Enhancement Filters <span className="text-zinc-500 normal-case tracking-normal ml-2">Optional</span>
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {FILTERS.map((filter) => {
                                const isActive = selectedFilters.includes(filter);
                                return (
                                    <button
                                        key={filter}
                                        onClick={() => toggleFilter(filter)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all border h-8",
                                            isActive
                                                ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20"
                                        )}
                                    >
                                        {isActive && <Check className="h-3 w-3" />}
                                        {filter}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate Button (Shimmer) */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <button
                            onClick={handleGenerateClick}
                            disabled={selectedStyles.length === 0}
                            className={cn(
                                "group relative w-full overflow-hidden rounded-xl px-6 py-3 text-sm font-bold transition-all",
                                selectedStyles.length === 0
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-[0.99]"
                            )}
                        >
                            {selectedStyles.length > 0 && (
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
                            )}
                            <span className="relative z-20 flex items-center justify-center gap-2">
                                {selectedStyles.length === 0 ? (
                                    "Select a Style to Continue"
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 fill-black" />
                                        Generate Headshots
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="mt-3 text-center text-[10px] font-medium text-zinc-500">
                            Cost: 4 Credits (Daily Balance) • Estimated time: ~15s
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
