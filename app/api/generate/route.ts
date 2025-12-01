import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STYLES } from "@/lib/styles";
import { supabaseAdmin } from "@/lib/supabase-admin";

const segmindApiKey = process.env.SEGMIND_API_KEY;

// Map filter names to specific prompt additions
const FILTER_PROMPTS: Record<string, string> = {
    "Smooth Skin": "smooth skin texture, beauty retouch",
    "Reduce Circles": "remove dark circles, fresh eyes",
    "Smooth Hair": "silky hair, neat hairstyle",
    "Enhance Contours": "defined facial features, sculpted look",
    "Whiten Teeth": "bright white teeth, perfect smile",
    "Remove Marks": "flawless skin, no blemishes",
    "Gentle Smile": "gentle smile, friendly expression",
    "Serious Expression": "serious emotion, closed mouth, intense stare",
    "Looking Sideways": "looking away, side profile",
    "Direct Gaze": "looking directly at camera, eye contact",
};

export async function POST(request: Request) {
    try {
        console.log("API Request received (Segmind InstantID Generation)");
        const body = await request.json();
        const { imageUrl, styleId, filters } = body;

        if (!imageUrl || !styleId) {
            return NextResponse.json(
                { error: "Image URL and style ID are required" },
                { status: 400 }
            );
        }

        if (!segmindApiKey) {
            return NextResponse.json(
                { error: "Segmind API key not configured" },
                { status: 500 }
            );
        }

        // 1. Setup Supabase Client (User Context)
        const cookieStore = await cookies();
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        // 2. Get User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("Auth error:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Daily Credits Reset Logic
        const DAILY_LIMIT = 24;
        const COST_PER_IMAGE = 4;

        // Fetch user profile with credits and last_reset_at
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits, last_reset_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
        }

        let currentCredits = profile?.credits || 0;
        const lastResetAt = profile?.last_reset_at ? new Date(profile.last_reset_at) : null;
        const now = new Date();

        // Check if 24 hours have passed since last reset
        if (lastResetAt) {
            const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);

            if (hoursSinceReset >= 24) {
                // Reset credits to daily limit
                console.log(`Resetting credits for user ${user.id} (${hoursSinceReset.toFixed(2)} hours since last reset)`);
                currentCredits = DAILY_LIMIT;

                const { error: resetError } = await supabase
                    .from('profiles')
                    .update({
                        credits: DAILY_LIMIT,
                        last_reset_at: now.toISOString()
                    })
                    .eq('id', user.id);

                if (resetError) {
                    console.error("Credit reset error:", resetError);
                    return NextResponse.json({ error: "Failed to reset credits" }, { status: 500 });
                }
            }
        } else {
            // First time user - initialize reset timestamp
            console.log(`Initializing credits for new user ${user.id}`);
            currentCredits = DAILY_LIMIT;

            const { error: initError } = await supabase
                .from('profiles')
                .update({
                    credits: DAILY_LIMIT,
                    last_reset_at: now.toISOString()
                })
                .eq('id', user.id);

            if (initError) {
                console.error("Credit initialization error:", initError);
                return NextResponse.json({ error: "Failed to initialize credits" }, { status: 500 });
            }
        }

        // 4. Check if user has enough credits
        if (currentCredits < COST_PER_IMAGE) {
            return NextResponse.json(
                { error: "Daily limit reached. Come back tomorrow!" },
                { status: 402 }
            );
        }

        // 5. Deduct credits
        const newCredits = currentCredits - COST_PER_IMAGE;
        const { error: deductError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', user.id);

        if (deductError) {
            console.error("Credit deduction error:", deductError);
            return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
        }

        console.log(`Credits deducted: ${currentCredits} -> ${newCredits} for user ${user.id}`);

        // 6. Construct Prompt
        const selectedStyle = STYLES.find((s) => s.id === styleId);
        const stylePrompt = selectedStyle?.prompt || STYLES[0].prompt;

        const filterPrompts = filters
            ? (filters as string[])
                .map((f) => FILTER_PROMPTS[f])
                .filter(Boolean)
                .join(", ")
            : "";

        const finalPrompt = `${stylePrompt}, ${filterPrompts}, highly detailed face, professional photography`;
        const negativePrompt = "ugly, deformed, blurry, low quality, distorted face, bad anatomy";

        console.log("Calling Segmind InstantID API...");

        // 7. Call Segmind InstantID API
        const segmindResponse = await fetch("https://api.segmind.com/v1/instantid", {
            method: "POST",
            headers: {
                "x-api-key": segmindApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image: imageUrl,
                tpose: imageUrl, // Use same image to preserve head pose
                prompt: finalPrompt,
                negative_prompt: negativePrompt,
                style: "Identity", // Preserves the face
                strength: 0.8,
                guidance_scale: 5,
                num_inference_steps: 30,
            }),
        });

        if (!segmindResponse.ok) {
            const errorText = await segmindResponse.text();
            console.error("Segmind API error:", errorText);
            throw new Error(`Segmind API failed: ${segmindResponse.status} - ${errorText}`);
        }

        // 8. Convert response to buffer
        const imageBuffer = await segmindResponse.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        // 9. Upload to Supabase Storage
        const fileName = `gen-${user.id}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from("user-uploads")
            .upload(fileName, buffer, {
                contentType: "image/jpeg",
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 10. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from("user-uploads")
            .getPublicUrl(fileName);

        // 11. Save to DB (Use Admin client to bypass RLS)
        const { error: dbError } = await supabaseAdmin
            .from("generations")
            .insert([
                {
                    image_url: publicUrl,
                    prompt_style: styleId,
                    user_id: user.id,
                },
            ]);

        if (dbError) {
            console.error("DB Insert Error:", dbError);
        }

        console.log("✅ Generation successful!");
        return NextResponse.json({ imageUrl: publicUrl });

    } catch (error: any) {
        console.error("Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
