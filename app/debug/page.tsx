"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
    const [status, setStatus] = useState<string>("Checking...");
    const [envVars, setEnvVars] = useState<any>({});

    useEffect(() => {
        const checkSupabase = async () => {
            const vars = {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present (Starts with " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + ")" : "Missing",
            };
            setEnvVars(vars);

            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    setStatus("Error connecting to Supabase: " + error.message);
                } else {
                    setStatus("Success! Connected to Supabase. Session: " + (data.session ? "Active" : "None"));
                }
            } catch (e: any) {
                setStatus("Exception: " + e.message);
            }
        };

        checkSupabase();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4">Debug Console</h1>

            <div className="space-y-4">
                <div className="p-4 border border-zinc-800 rounded">
                    <h2 className="text-xl mb-2 text-blue-400">Environment Variables</h2>
                    <pre className="text-sm text-zinc-300">
                        URL: {envVars.url || "MISSING"}{"\n"}
                        Key: {envVars.key || "MISSING"}
                    </pre>
                </div>

                <div className="p-4 border border-zinc-800 rounded">
                    <h2 className="text-xl mb-2 text-green-400">Connection Status</h2>
                    <p className="text-zinc-300">{status}</p>
                </div>

                <div className="p-4 border border-zinc-800 rounded">
                    <h2 className="text-xl mb-2 text-yellow-400">Redirect URL</h2>
                    <p className="text-zinc-300">{typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'Server Side'}</p>
                </div>
            </div>
        </div>
    );
}
