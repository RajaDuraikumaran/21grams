"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ResultsGallery } from "@/components/ResultsGallery";
import { supabase } from "@/lib/supabase";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGenerations = async () => {
            try {
                const response = await fetch("/api/generations");
                if (!response.ok) throw new Error("Failed to fetch generations");

                const data = await response.json();
                if (data.images) {
                    setImages(data.images.map((item: any) => item.image_url));
                }
            } catch (error) {
                console.error("Error fetching generations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGenerations();
    }, []);

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-white/20">
            <Navbar />

            {loading ? (
                <div className="flex h-[80vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
            ) : images.length > 0 ? (
                <ResultsGallery images={images} title="Your Gallery" />
            ) : (
                <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-white/10">
                        <ImageIcon className="h-8 w-8 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-white">No generations yet</h2>
                        <p className="text-zinc-400">
                            Create your first professional headshot to see it here.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="mt-4 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
                    >
                        Create Headshots
                    </Link>
                </div>
            )}
        </main>
    );
}
