import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    console.log("Auth Callback started");
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/create'

    console.log("Code received: ", code ? "Yes" : "No");
    console.log("Supabase URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Anon Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        try {
            console.log("Auth Callback: Exchanging code for session...");
            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error("Exchange Error:", error);
                return NextResponse.redirect(`${origin}/login?error=exchange_failed&details=${encodeURIComponent(error.message)}`)
            }

            console.log("Session created");
            return NextResponse.redirect(`${origin}${next}`)

        } catch (err: any) {
            console.error("Unexpected Exchange Error:", err);
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&details=${encodeURIComponent(err.message || "Unknown error")}`)
        }
    } else {
        console.warn("Auth Callback: No code found in URL.");
        return NextResponse.redirect(`${origin}/login?error=no_code_provided`)
    }
}
