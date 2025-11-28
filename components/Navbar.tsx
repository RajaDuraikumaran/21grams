"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, User, CreditCard, Mail, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

import { ContactModal } from "@/components/ContactModal";

export function Navbar() {
    const { credits, setStep, setFile, setPreview, setSelectedStyles, setGeneratedImages } = useAppStore();
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleCreateClick = () => {
        setFile(null);
        setPreview(null);
        setSelectedStyles([]);
        setGeneratedImages([]);
        setStep('upload');
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        toast.success("Logged out successfully");
        router.refresh();
        setTimeout(() => {
            router.push('/login');
        }, 500);
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    {/* Left Side: Mobile Menu & Logo */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-zinc-400 hover:text-white transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tighter text-white">21Grams.</span>
                        </div>
                    </div>

                    {/* Center Links (Desktop) */}
                    <div className="hidden items-center gap-8 md:flex">
                        <Link
                            href="/dashboard"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-white",
                                pathname === "/dashboard" ? "text-white" : "text-zinc-400"
                            )}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/"
                            onClick={handleCreateClick}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-white",
                                pathname === "/" ? "text-white" : "text-zinc-400"
                            )}
                        >
                            Create
                        </Link>
                        <Link
                            href="/pricing"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-white",
                                pathname === "/pricing" ? "text-white" : "text-zinc-400"
                            )}
                        >
                            Pricing
                        </Link>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Credits Badge (Desktop) */}
                        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 border border-white/10">
                            <Zap className="h-3.5 w-3.5 text-white fill-white" />
                            <span className="text-xs font-medium text-white">{credits} credits</span>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-medium text-white ring-2 ring-zinc-950 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                            >
                                R
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-black/5 focus:outline-none"
                                    >
                                        <div className="p-4">
                                            <p className="text-xs font-semibold text-zinc-100">Account</p>
                                            <p className="text-xs text-zinc-500 truncate">rduraikumaran@gmail.com</p>
                                        </div>
                                        <div className="border-t border-zinc-800" />
                                        <div className="p-2">
                                            <Link
                                                href="/pricing"
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Billing
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setIsContactOpen(true);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                                            >
                                                <Mail className="h-4 w-4" />
                                                Contact Us
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-900 hover:text-red-300"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Log out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xl font-black tracking-tighter text-white">21Grams.</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "text-lg font-medium transition-colors hover:text-white",
                                        pathname === "/dashboard" ? "text-white" : "text-zinc-400"
                                    )}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/"
                                    onClick={handleCreateClick}
                                    className={cn(
                                        "text-lg font-medium transition-colors hover:text-white",
                                        pathname === "/" ? "text-white" : "text-zinc-400"
                                    )}
                                >
                                    Create
                                </Link>
                                <Link
                                    href="/pricing"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "text-lg font-medium transition-colors hover:text-white",
                                        pathname === "/pricing" ? "text-white" : "text-zinc-400"
                                    )}
                                >
                                    Pricing
                                </Link>

                                <div className="mt-4 pt-6 border-t border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Zap className="h-4 w-4 fill-zinc-400" />
                                        <span className="font-medium">{credits} Credits Available</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </>
    );
}
