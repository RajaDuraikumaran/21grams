import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STYLES } from "@/lib/styles";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Configure route to allow longer execution time (5 minutes for image generation)
export const maxDuration = 300;
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
    "Serious Expression": " emotion, closed mouth, intense stare",
    "Looking Sideways": "looking away, side profile",
    "Direct Gaze": "looking directly at camera, eye contact",
};

export async function POST(request: Request) {
    try {
        console.log("API Request received (KIE AI Generation)");
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
                console.error("Credit deduction error:", deductError);
                return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
            }

            console.log(`Credits deducted: ${currentCredits} -> ${newCredits} for user ${user.id}`);
        } else {
            console.log("Local Dev: Skipping credit deduction");
        }

        // 6. Get style and build prompt
        const selectedStyle = STYLES.find((s) => s.id === styleId);
        const stylePrompt = selectedStyle?.prompt || STYLES[0].prompt;

        const filterPrompts = filters
            ? (filters as string[])
                .map((f) => FILTER_PROMPTS[f])
                .filter(Boolean)
                .join(", ")
            : "";

        // Enhanced prompt for img2img with identity preservation
        const img2imgPrefix = "img2img, highly detailed portrait, exact facial features of input image";
        const finalPrompt = `${img2imgPrefix}, ${stylePrompt}, ${filterPrompts}, photorealistic portrait`;
        const negativePrompt = "cartoon, painting, illustration, (worst quality, low quality, normal quality:2)";

        // 7. Call Nano Banana API (Task Submission)
        const kieApiKey = process.env.KIE_API_KEY;
        // Hardcode base URL to avoid configuration errors with double paths
        const kieBaseUrl = "https://api.nanobananaapi.ai";
        const generateEndpoint = `${kieBaseUrl}/api/v1/nanobanana/generate-pro`;
        const taskDetailsEndpoint = `${kieBaseUrl}/api/v1/nanobanana/get-task-details`;

        console.log("--- DEBUG START ---");
        console.log("Using API Key:", kieApiKey ? `${kieApiKey.slice(0, 5)}...` : "MISSING");
        console.log("Target URL:", generateEndpoint);
        console.log("Image URL:", imageUrl);

        if (!imageUrl) {
            throw new Error("Image URL is missing from request body");
        }

        if (!kieApiKey) {
            throw new Error("Nano Banana API key is not configured. Please set KIE_API_KEY in .env");
        }

        const payload = {
            prompt: finalPrompt,
            imageUrls: [imageUrl], // API expects array of strings
            resolution: "2K",
            aspectRatio: "1:1",
            callBackUrl: "https://example.com/callback", // Dummy callback for localhost
        };

        console.log("Sending Payload:", JSON.stringify(payload, null, 2));

        // Submit generation task
        console.log("Submitting task to Nano Banana API...");
        const submissionResponse = await fetch(generateEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${kieApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        console.log("Submission Response Status:", submissionResponse.status);

        if (!submissionResponse.ok) {
            const errorText = await submissionResponse.text();
            console.error("Submission Error Body:", errorText);
            throw new Error(`Task submission failed (${submissionResponse.status}): ${errorText}`);
        }

        const submissionData = await submissionResponse.json();
        console.log("Submission Data:", JSON.stringify(submissionData, null, 2));

        // Try multiple possible locations for taskId in the response
        const taskId = submissionData.data?.taskId ||
            submissionData.taskId ||
            submissionData.data?.task_id ||
            submissionData.task_id;

        if (!taskId) {
            console.error("Full submission response:", submissionData);
            throw new Error(`Failed to get taskId from submission response. Response structure: ${JSON.stringify(submissionData)}`);
        }

        console.log(`Task submitted successfully. Task ID: ${taskId}`);

        // 8. Poll for results
        let generatedImageBuffer: Buffer | null = null;
        // In dev: poll indefinitely, In prod: 5 minute timeout
        const maxAttempts = isDev ? Infinity : 150; // 150 attempts = 5 minutes in production
        const pollInterval = 2000; // 2 seconds

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            console.log(`Polling task status (Attempt ${i + 1}${isDev ? '' : `/${maxAttempts}`})...`);
            const statusResponse = await fetch(`${taskDetailsEndpoint}?taskId=${taskId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${kieApiKey}`,
                },
            });

            if (!statusResponse.ok) {
                console.warn(`Poll request failed: ${statusResponse.status}`);
                continue;
            }

            let statusData;
            try {
                statusData = await statusResponse.json();
            } catch (e) {
                console.error("Failed to parse polling response as JSON:", e);
                continue;
            }

            const successFlag = statusData.data?.successFlag; // 0: Generating, 1: Success, 2/3: Failed

            if (successFlag === 1) {
                // Success!
                const resultUrl = statusData.data?.resultImageUrl;
                if (!resultUrl) {
                    throw new Error("Task succeeded but resultImageUrl is missing");
                }

                console.log("Generation successful! Fetching result image...");
                const imageResponse = await fetch(resultUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch result image: ${imageResponse.status}`);
                }
                generatedImageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                break;

            } else if (successFlag === 2 || successFlag === 3) {
                // Failed
                throw new Error(`Generation failed. Error code: ${statusData.data?.errorCode}, Message: ${statusData.data?.errorMessage}`);
            }
            // If 0, continue polling
        }

        if (!generatedImageBuffer) {
            throw new Error(isDev
                ? "Generation failed - check NanoBanana API status"
                : "Generation timed out after 5 minutes");
        }

        console.log("Image buffer ready, size:", generatedImageBuffer.length, "bytes");

        // 9. Upload to Supabase
        const fileName = `gen-${user.id}-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from("user-uploads")
            .upload(fileName, generatedImageBuffer, {
                contentType: "image/png",
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

        return NextResponse.json({ imageUrl: publicUrl });

    } catch (error: any) {
        console.error("Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
