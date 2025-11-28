import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STYLES } from "@/lib/styles";

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

        // 5. Captioning (Optional but good for context)
        let caption = "portrait of a person";
        try {
            const captionResult = await hf.imageToText({
                model: "Salesforce/blip-image-captioning-large",
                data: imageBlob,
            });
            if (captionResult && captionResult.generated_text) {
                caption = captionResult.generated_text;
            }
        } catch (error) {
            console.warn("Captioning failed, using default:", error);
        }

        const finalPrompt = `(${caption}), ${stylePrompt}, ${filterPrompts}, high quality, detailed, 8k`;
        const negativePrompt = "(lowres, low quality, worst quality:1.2), (text:1.2), watermark, (frame:1.2), deformed, ugly, deformed eyes, blur, out of focus, blurry, bad quality";

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
                        strength: 0.75,
                        guidance_scale: 7.5,
                    }
                });
                console.log(`✅ Success with ${model}`);
                break; // Stop if successful
            } catch (error: any) {
                console.warn(`❌ Failed with ${model}: ${error.message}`);
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
                console.log("✅ Success with Text-to-Image Fallback");
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

        // 8. Save to DB
        const { error: dbError } = await supabase
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
