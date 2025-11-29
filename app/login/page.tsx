"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Placeholder images for the masonry grid
const MASONRY_IMAGES = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=800&auto=format&fit=crop&q=60",
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        // Fix for production: use protocol + hostname + port instead of origin
        const origin = typeof window !== 'undefined'
            ? `${window.location.protocol}//${window.location.host}`
            : '';
        const redirectTo = `${origin}/auth/callback`;

        console.log("Starting Google Login...");
        console.log("Redirect URL:", redirectTo);
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
            },
        });

        if (error) {
            if (error.message.includes("provider is not enabled")) {
                toast.error("Google Login is not enabled in your Supabase project.");
            } else {
                toast.error(error.message);
            }
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Enforce Hardcoded Credentials
        if (email !== "21grams@gmail.com" || password !== "kxi97*QKQe4ctup") {
            toast.error("Access Denied: Invalid credentials.");
            setIsLoading(false);
            return;
        }

        // Try to sign in
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // If user doesn't exist, try to auto-create (since we validated credentials above)
            if (error.message.includes("Invalid login credentials")) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`,
                    },
                });

                if (signUpError) {
                    toast.error(signUpError.message);
                } else {
                    toast.success("Welcome! Account created.");
                    router.push('/dashboard');
                }
            } else {
                toast.error(error.message);
            }
        } else {
            toast.success("Logged in successfully!");
            router.refresh(); // Sync server state
            router.push('/dashboard');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full bg-zinc-950">
            {/* Left Column - Masonry Grid */}
            <div className="relative hidden w-1/2 overflow-hidden bg-zinc-900 lg:block">
                {/* Scrolling Grid */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="animate-masonry-scroll flex flex-col gap-4 p-4 opacity-50 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0">
                        <div className="columns-2 gap-4 space-y-4 md:columns-3">
                            {/* Duplicate array to ensure infinite scroll feel */}
                            {[...MASONRY_IMAGES, ...MASONRY_IMAGES, ...MASONRY_IMAGES].map((src, i) => (
                                <div key={i} className="break-inside-avoid">
                                    <img
                                        src={src}
                                        alt="Portrait"
                                        className="h-auto w-full rounded-lg object-cover shadow-lg"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overlay & Quote */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent">
                    <div className="absolute bottom-0 left-0 p-12">
                        <blockquote className="max-w-md space-y-4">
                            <p className="text-2xl font-medium leading-relaxed text-white">
                                "The camera is an instrument that teaches people how to see without a camera."
                            </p>
                            <footer className="text-sm font-medium text-zinc-400">
                                — Dorothea Lange
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-sm space-y-8"
                >
                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-black tracking-tighter text-white">21Grams.</span>
                        </Link>
                        <h1 className="text-lg font-medium text-zinc-400">Private Access Only.</h1>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            Login with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02] hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                Enter Studio
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-zinc-500">
                        Restricted area. Authorized personnel only.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
