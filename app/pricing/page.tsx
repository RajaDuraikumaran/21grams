"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

const PRICING_PLANS = [
    {
        id: "polaroid",
        name: "Polaroid",
        price: 9,
        credits: 5,
        description: "Perfect for a quick profile update.",
        features: [
            "5 Professional Headshots",
            "High Resolution",
            "Commercial Rights",
            "No Watermark"
        ],
        highlight: false
    },
    {
        id: "studio",
        name: "Studio",
        price: 19,
        credits: 20,
        description: "The Creator's choice. Experiment with multiple styles.",
        features: [
            "20 Professional Headshots",
            "High Resolution",
            "Commercial Rights",
            "No Watermark",
            "Priority Processing"
        ],
        highlight: true,
        badge: "Most Popular"
    },
    {
        id: "exhibition",
        name: "Exhibition",
        price: 39,
        credits: 50,
        description: "For agencies and power users.",
        features: [
            "50 Professional Headshots",
            "High Resolution",
            "Commercial Rights",
            "No Watermark",
            "Priority Processing",
            "Dedicated Support"
        ],
        highlight: false
    }
];

const FAQS = [
    {
        question: "Do credits expire?",
        answer: "No, your credits never expire. You can use them whenever you're ready to generate new photos."
    },
    {
        question: "What if I don't like the photo?",
        answer: "Our AI generates multiple variations. If you're not satisfied with the technical quality, reach out to support for a credit refund."
    },
    {
        question: "Is payment secure?",
        answer: "Yes, we use Stripe for secure payment processing. We never store your credit card information."
    }
];

function PricingCard({ plan, index }: { plan: typeof PRICING_PLANS[0], index: number }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={cn(
                "glass-panel relative flex flex-col rounded-3xl p-8 transition-transform duration-300 hover:scale-[1.02]",
                plan.highlight
                    ? "border-zinc-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] z-10 md:-mt-4 md:mb-4"
                    : "border-white/10 bg-white/5"
            )}
        >
            {/* Spotlight Effect */}
            <div
                className="pointer-events-none absolute -inset-px transition duration-300 rounded-3xl"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)`,
                }}
            />

            {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold text-black shadow-lg z-20">
                    {plan.badge}
                </div>
            )}

            <div className="mb-8 relative z-10">
                <h3 className="text-lg font-medium text-zinc-300">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-sm text-zinc-500">/ one-time</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
            </div>

            <div className="mb-8 flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-white">{plan.credits} Credits</span>
                </div>
                <ul className="space-y-3">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                className={cn(
                    "w-full rounded-xl py-3 text-sm font-bold transition-all relative z-10",
                    plan.highlight
                        ? "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        : "bg-white/10 text-white hover:bg-white/20"
                )}
            >
                Purchase Credits
            </button>
        </motion.div>
    );
}

export default function PricingPage() {
    return (
        <main className="min-h-screen w-full max-w-7xl mx-auto pt-24 pb-24 px-6 md:px-12 text-zinc-50 selection:bg-white/20">
            <Navbar />

            {/* Header */}
            <div className="mb-16 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl"
                >
                    Invest in your <span className="bg-gradient-to-r from-zinc-200 via-white to-zinc-400 bg-clip-text text-transparent">Image.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4 text-lg text-zinc-400"
                >
                    Simple credit packs. No monthly subscriptions. Credits never expire.
                </motion.p>
            </div>

            {/* Pricing Grid */}
            <div className="grid gap-8 md:grid-cols-3 lg:gap-12 items-start">
                {PRICING_PLANS.map((plan, index) => (
                    <PricingCard key={plan.id} plan={plan} index={index} />
                ))}
            </div>

            {/* FAQ Section */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-24 max-w-2xl mx-auto"
            >
                <h2 className="mb-8 text-center text-2xl font-bold text-white">Frequently Asked Questions</h2>
                <div className="space-y-8">
                    {FAQS.map((faq, index) => (
                        <div key={index} className="border-b border-white/10 pb-6 last:border-0">
                            <h3 className="text-lg font-medium text-zinc-200">{faq.question}</h3>
                            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </main>
    );
}
