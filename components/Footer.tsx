import { cn } from "@/lib/utils";

export function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-black py-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
                <p className="text-xs text-zinc-500">
                    &copy; 2024 21Grams Studio. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
