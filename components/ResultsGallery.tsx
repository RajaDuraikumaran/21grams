"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronLeft, ChevronRight, X, RotateCcw, Share2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, forceDownload } from "@/lib/utils";
import confetti from "canvas-confetti";

import { StepIndicator } from "@/components/StepIndicator";

interface ResultsGalleryProps {
    images?: string[];
    title?: string;
    onReset?: () => void;
}

export function ResultsGallery({ images, title = "Your AI Selfies", onReset }: ResultsGalleryProps) {
    const { generatedImages: storeImages } = useAppStore();
    const displayImages = images || storeImages;
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    const handleDownload = async (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();

        // Confetti Explosion
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22d3ee', '#ffffff', '#818cf8']
        });

        await forceDownload(imageUrl, `ai-headshot-${Date.now()}.png`);
    };

    const navigateImage = (e: React.MouseEvent, direction: "prev" | "next") => {
        e.stopPropagation();
        if (selectedImageIndex === null) return;

        if (direction === "prev") {
            setSelectedImageIndex((prev) =>
                prev === 0 ? displayImages.length - 1 : (prev as number) - 1
            );
        } else {
            setSelectedImageIndex((prev) =>
                prev === displayImages.length - 1 ? 0 : (prev as number) + 1
            );
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col gap-8 px-4 pt-20">
            {/* Step Indicator */}
            <div className="flex justify-center mb-4">
                <StepIndicator currentStep="results" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                    <p className="mt-2 text-zinc-400">Select your favorites to download.</p>
                </div>
                {onReset && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                    >
                        <RotateCcw className="h-4 w-4" />
                        New Generation
                    </button>
                )}
            </div>

            {/* Mosaic Grid */}
            {displayImages.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="group/gallery grid grid-cols-2 md:grid-cols-3 gap-0.5 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
                >
                    {displayImages.map((image, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            layoutId={`image-${index}`}
                            onClick={() => setSelectedImageIndex(index)}
                            className="group relative aspect-square cursor-pointer overflow-hidden bg-zinc-900 transition-all duration-500 hover:z-10 hover:scale-105 hover:shadow-2xl group-hover/gallery:opacity-50 hover:!opacity-100"
                        >
                            <Image
                                src={image}
                                alt={`Generated headshot ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                                <button
                                    onClick={(e) => handleDownload(e, image)}
                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 transition-transform hover:scale-110 hover:bg-white hover:text-black active:scale-95"
                                >
                                    <Download className="h-5 w-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-zinc-900 p-4 mb-4">
                        <RotateCcw className="h-8 w-8 text-zinc-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">No images generated</h3>
                    <p className="mt-2 text-zinc-400 max-w-sm">
                        It seems something went wrong or no images were generated. Try generating again.
                    </p>
                </div>
            )}

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImageIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
                        onClick={() => setSelectedImageIndex(null)}
                    >
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-6 right-6 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="relative flex h-full w-full max-w-7xl items-center justify-center gap-8">
                            {/* Prev Button */}
                            <button
                                onClick={(e) => navigateImage(e, "prev")}
                                className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-all"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>

                            {/* Main Image */}
                            <motion.div
                                layoutId={`image-${selectedImageIndex}`}
                                className="relative aspect-square max-h-[85vh] w-full max-w-[85vh] overflow-hidden rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Image
                                    src={displayImages[selectedImageIndex]}
                                    alt="Selected headshot"
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>

                            {/* Next Button */}
                            <button
                                onClick={(e) => navigateImage(e, "next")}
                                className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-all"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>

                            {/* Modal Actions */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                                <button
                                    onClick={(e) => handleDownload(e, displayImages[selectedImageIndex])}
                                    className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Download className="h-4 w-4" />
                                    Download HD
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
