import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STYLES } from "@/lib/styles";

//Configure route for fast response
export const maxDuration = 10; // 10 seconds max
export const dynamic = 'force-dynamic';

// Map filter names to specific prompt additions
const FILTER_PROMPTS: Record<string, string> = {
    "Smooth Skin": "smooth skin texture, beauty retouch",
    "Reduce Circles": "remove dark circles, fresh eyes",
    "Smooth Hair": "silky hair, neat hairstyle",
    "Enhance Contours": "defined facial features, sculpted look",
    "Whiten Teeth": "bright white teeth, perfect smile",
    "Remove Marks": "flawless skin, no blemishes",
    "Gentle Smile": "gentle smile, friendly expression",
    "Serious Expression": "no emotion, closed mouth, intense stare",
    "Looking Sideways": "looking away, side profile",
    "Direct Gaze": "looking directly at camera, eye contact",
};

export async function POST(request: Request) {
    try {
        console.log("[SUBMIT] API Request received");
        const body = await request.json();
        const { imageUrl, styleId, filters } = body;

        if (!imageUrl || !styleId) {
            return NextResponse.json(
                { error: "Image URL and style ID are required" },
                { status: 400 }
            );
        }

        // 1. Setup Supabase Client (User Context)
        const cookie Store = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignore
                        }
                    },
                },
            }
        );

        // 2. Get User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("[SUBMIT] Auth error:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Daily Credits Reset Logic
        const DAILY_LIMIT = 50;
        const COST_PER_IMAGE = 1;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits, last_reset_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("[SUBMIT] Profile fetch error:", profileError);
            return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
        }

        let currentCredits = profile?.credits || 0;
        const lastResetAt = profile?.last_reset_at ? new Date(profile.last_reset_at) : null;
        const now = new Date();

        // Check if 24 hours have passed since last reset
        if (lastResetAt) {
            const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);

            if (hoursSinceReset >= 24) {
                console.log(`[SUBMIT] Resetting credits for user ${user.id}`);
                currentCredits = DAILY_LIMIT;

                const { error: resetError } = await supabase
                    .from('profiles')
                    .update({
                        credits: DAILY_LIMIT,
                        last_reset_at: now.toISOString()
                    })
                    .eq('id', user.id);

                if (resetError) {
                    console.error("[SUBMIT] Credit reset error:", resetError);
                    return NextResponse.json({ error: "Failed to reset credits" }, { status: 500 });
                }
            }
        } else {
            // First time user
            console.log(`[SUBMIT] Initializing credits for new user ${user.id}`);
            currentCredits = DAILY_LIMIT;

            await supabase
                .from('profiles')
                .update({
                    credits: DAILY_LIMIT,
                    last_reset_at: now.toISOString()
                })
                .eq('id', user.id);
        }

        // 4. Check if user has enough credits
        const isDev = process.env.NODE_ENV === 'development';

        if (!isDev && currentCredits < COST_PER_IMAGE) {
            return NextResponse.json(
                { error: "Daily limit reached. Come back tomorrow!" },
                { status: 402 }
            );
        }

        // 5. Deduct credits
        if (!isDev) {
            const newCredits = currentCredits - COST_PER_IMAGE;
            const { error: deductError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', user.id);

            if (deductError) {
                console.error("[SUBMIT] Credit deduction error:", deductError);
                return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
            }

            console.log(`[SUBMIT] Credits deducted: ${currentCredits} -> ${newCredits}`);
        } else {
            console.log("[SUBMIT] Dev mode: Skipping credit deduction");
        }

        // 6. Build prompt
        const selectedStyle = STYLES.find((s) => s.id === styleId);
        const stylePrompt = selectedStyle?.prompt || STYLES[0].prompt;

        const filterPrompts = filters
            ? (filters as string[])
                .map((f) => FILTER_PROMPTS[f])
                .filter(Boolean)
                .join(", ")
            : "";

        const img2imgPrefix = "img2img, highly detailed portrait, exact facial features of input image";
        const finalPrompt = `${img2imgPrefix}, ${stylePrompt}, ${filterPrompts}, photorealistic portrait`;

        // 7. Submit to NanoBanana API
        const kieApiKey = process.env.KIE_API_KEY;
        const generateEndpoint = "https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro";

        if (!kieApiKey) {
            throw new Error("NanoBanana API key not configured");
        }

        const payload = {
            prompt: finalPrompt,
            imageUrls: [imageUrl],
            resolution: "2K",
            aspectRatio: "1:1",
            callBackUrl: "https://example.com/callback",
        };

        console.log("[SUBMIT] Submitting to NanoBanana...");
        const submissionResponse = await fetch(generateEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${kieApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!submissionResponse.ok) {
            const errorText = await submissionResponse.text();
            console.error("[SUBMIT] Submission failed:", errorText);
            throw new Error(`Task submission failed: ${submissionResponse.status}`);
        }

        const submissionData = await submissionResponse.json();
        const taskId = submissionData.data?.taskId ||
            submissionData.taskId ||
            submissionData.data?.task_id ||
            submissionData.task_id;

        if (!taskId) {
            console.error("[SUBMIT] No taskId in response:", submissionData);
            throw new Error("Failed to get taskId from NanoBanana");
        }

        console.log(`[SUBMIT] Task submitted successfully. taskId: ${taskId}`);

        // Return taskId and userId for status polling
        return NextResponse.json({
            taskId,
            userId: user.id
        });

    } catch (error: any) {
        console.error("[SUBMIT] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to submit task" },
            { status: 500 }
        );
    }
}
