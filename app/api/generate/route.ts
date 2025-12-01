import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STYLES } from "@/lib/styles";
import { supabaseAdmin } from "@/lib/supabase-admin";

const apiKey = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(apiKey);

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
        console.log("API Request received (HF Generation)");
        const body = await request.json();
        const { imageUrl, styleId, filters } = body;

        if (!imageUrl || !styleId) {
            return NextResponse.json(
                { error: "Image URL and style ID are required" },
                { status: 400 }
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

        const selectedStyle = STYLES.find((s) => s.id === styleId);
        const stylePrompt = selectedStyle?.prompt || STYLES[0].prompt;

        // 3. Construct Prompt
        const filterPrompts = filters
            ? (filters as string[])
                .map((f) => FILTER_PROMPTS[f])
                .filter(Boolean)
                .join(", ")
            : "";

        // 4. Fetch Image Blob (Required for both captioning and generation)
        const imageRes = await fetch(imageUrl);
        const imageBlob = await imageRes.blob();

        // 5. Enhanced Image Analysis - Detect Gender, Age, and Features
        let caption = "portrait of a person";
        let detectedGender = "";
        let detectedAge = "";
        let facialFeatures = "";

        try {
            // Use a more detailed captioning model
            const captionResult = await hf.imageToText({
                model: "nlpconnect/vit-gpt2-image-captioning",
                data: imageBlob,
            });
            if (captionResult && captionResult.generated_text) {
                caption = captionResult.generated_text.toLowerCase();
                console.log("Generated caption:", caption);

                // Detect gender from caption
                if (caption.includes("man") || caption.includes("male") || caption.includes("boy") || caption.includes("gentleman")) {
                    detectedGender = "man, male";
                } else if (caption.includes("woman") || caption.includes("female") || caption.includes("girl") || caption.includes("lady")) {
                    detectedGender = "woman, female";
                }

                // Detect age indicators
                if (caption.includes("young") || caption.includes("boy") || caption.includes("girl")) {
                    detectedAge = "young";
                } else if (caption.includes("old") || caption.includes("elderly") || caption.includes("senior")) {
                    detectedAge = "mature";
                }

                // Extract facial features
                const featureKeywords = ["beard", "mustache", "glasses", "bald", "curly hair", "straight hair", "short hair", "long hair"];
                const foundFeatures = featureKeywords.filter(keyword => caption.includes(keyword));
                if (foundFeatures.length > 0) {
                    facialFeatures = foundFeatures.join(", ");
                }
            }
        } catch (error) {
            console.warn("Advanced captioning failed, trying fallback:", error);
            try {
                // Fallback to BLIP
                const fallbackResult = await hf.imageToText({
                    model: "Salesforce/blip-image-captioning-large",
                    data: imageBlob,
                });
                if (fallbackResult && fallbackResult.generated_text) {
                    caption = fallbackResult.generated_text.toLowerCase();
                    console.log("Fallback caption:", caption);

                    // Same detection logic for fallback
                    if (caption.includes("man") || caption.includes("male") || caption.includes("boy")) {
                        detectedGender = "man, male";
                    } else if (caption.includes("woman") || caption.includes("female") || caption.includes("girl")) {
                        detectedGender = "woman, female";
                    }
                }
            } catch (fallbackError) {
                console.warn("All captioning failed, using defaults:", fallbackError);
            }
        }

        // Build identity preservation prompt
        const identityPrompt = [
            detectedGender,
            detectedAge,
            facialFeatures,
            "same person",
            "preserve facial structure",
            "preserve identity",
            "maintain original appearance"
        ].filter(Boolean).join(", ");

        console.log("Identity preservation prompt:", identityPrompt);

        const finalPrompt = `${identityPrompt}, ${stylePrompt}, ${filterPrompts}, high quality, detailed, 8k, photorealistic`;
        const negativePrompt = "(lowres, low quality, worst quality:1.2), (text:1.2), watermark, (frame:1.2), deformed, ugly, deformed eyes, blur, out of focus, blurry, bad quality, gender change, different person, wrong gender, face swap, different identity";

        // List of models to try in order
        const MODELS = [
            "runwayml/stable-diffusion-v1-5",
            "stabilityai/stable-diffusion-2-1",
            "prompthero/openjourney",
            "CompVis/stable-diffusion-v1-4",
            "stabilityai/stable-diffusion-xl-refiner-1.0"
        ];

        let generatedBlob: Blob | null = null;
        let lastError: any = null;

        console.log("Starting generation with fallback logic...");

        // Try each model until one works
        for (const model of MODELS) {
            try {
                console.log(`Attempting generation with model: ${model}`);
                generatedBlob = await hf.imageToImage({
                    model: model,
                    inputs: imageBlob,
                    parameters: {
                        prompt: finalPrompt,
                        negative_prompt: negativePrompt,
                        strength: 0.35, // Lower strength to preserve original features better
                        guidance_scale: 8.0, // Slightly higher for better prompt adherence
                    }
                });
                console.log(`Γ£à Success with ${model}`);
                break; // Stop if successful
            } catch (error: any) {
                console.warn(`Γ¥î Failed with ${model}: ${error.message}`);
                lastError = error;
                // Continue to next model
            }
        }

        if (!generatedBlob) {
            console.warn("All Img2Img models failed. Falling back to Text-to-Image...");
            try {
                // Fallback to Text-to-Image using the caption
                generatedBlob = (await hf.textToImage({
                    model: "stabilityai/stable-diffusion-xl-base-1.0",
                    inputs: finalPrompt,
                    parameters: {
                        negative_prompt: negativePrompt,
                        guidance_scale: 7.5,
                    }
                })) as unknown as Blob;
                console.log("Γ£à Success with Text-to-Image Fallback");
            } catch (fallbackError: any) {
                throw new Error(`All generation attempts failed. Last error: ${fallbackError.message}`);
            }
        }

        // 6. Upload to Supabase
        const fileName = `gen-${user.id}-${Date.now()}.png`;
        const arrayBuffer = await generatedBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from("user-uploads")
            .upload(fileName, buffer, {
                contentType: "image/png",
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 7. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from("user-uploads")
            .getPublicUrl(fileName);

        // 8. Save to DB (Use Admin client to bypass RLS)
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

        return NextResponse.json({ imageUrl: publicUrl });

    } catch (error: any) {
        console.error("Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
