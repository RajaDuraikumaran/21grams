import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { STYLES } from "@/lib/styles";

const apiKey = process.env.HUGGINGFACE_API_KEY;
console.log("HF Key loaded:", apiKey ? `Yes (starts with ${apiKey.substring(0, 4)}...)` : "No");
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
        console.log("API Request received");
        const body = await request.json();
        console.log("Request body parsed:", {
            imageUrl: body.imageUrl ? "Present" : "Missing",
            styleId: body.styleId,
            filters: body.filters
        });

        const { imageUrl, styleId, filters } = body;

        if (!imageUrl || !styleId) {
            console.log("Missing required fields");
            return NextResponse.json(
                { error: "Image URL and style ID are required" },
                { status: 400 }
            );
        }

        const selectedStyle = STYLES.find((s) => s.id === styleId);
        const stylePrompt = selectedStyle?.prompt || STYLES[0].prompt;

        // Construct final prompt with mapped filters
        // Construct final prompt with mapped filters
        const filterPrompts = filters
            ? (filters as string[])
                .map((f) => FILTER_PROMPTS[f])
                .filter(Boolean)
                .join(", ")
            : "";

        // Automatic Image Captioning
        console.log("Generating caption for image...");
        let caption = "portrait of a person";
        try {
            const captionResult = await hf.imageToText({
                model: "Salesforce/blip-image-captioning-large",
                data: await (await fetch(imageUrl)).blob(),
            });
            if (captionResult && captionResult.generated_text) {
                caption = captionResult.generated_text;
                console.log("Generated caption:", caption);
            }
        } catch (error) {
            console.warn("Captioning failed (likely HF limit), using default:", error);
        }

        const prompt = filterPrompts
            ? `${stylePrompt}, ${filterPrompts}`
            : stylePrompt;

        console.log("Starting generation with prompt:", prompt);
        console.log("Using model: ModelsLab Flux.2 Dev Img2Img (v6)");

        const modelsLabResponse = await fetch("https://modelslab.com/api/v6/realtime/img2img", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: process.env.MODELSLAB_API_KEY,
                model_id: "flux-dev",
                prompt: `(${caption}), ${prompt}, high quality, detailed, 8k`,
                negative_prompt: "(lowres, low quality, worst quality:1.2), (text:1.2), watermark, (frame:1.2), deformed, ugly, deformed eyes, blur, out of focus, blurry, bad quality",
                init_image: imageUrl,
                width: 1024,
                height: 1024,
                samples: 1,
                num_inference_steps: 30,
                safety_checker: false,
                enhance_prompt: true,
                seed: null,
                guidance_scale: 7.5,
                strength: 0.75,
                webhook: null,
                track_id: null,
            }),
        });

        if (!modelsLabResponse.ok) {
            const errorText = await modelsLabResponse.text();
            throw new Error(`ModelsLab API Error: ${modelsLabResponse.status} - ${errorText}`);
        }

        const data = await modelsLabResponse.json();
        console.log("ModelsLab Response:", data);

        if (data.status === "error" || !data.output || data.output.length === 0) {
            throw new Error(data.message || "ModelsLab generation failed");
        }

        const generatedImageUrl = data.output[0];

        // Persist to Supabase
        const { error: dbError } = await supabaseAdmin
            .from("generations")
            .insert([
                {
                    image_url: generatedImageUrl,
                    prompt_style: styleId,
                    user_id: "00000000-0000-0000-0000-000000000000", // Valid UUID for anon user
                },
            ]);

        if (dbError) {
            console.error("Supabase insert error:", dbError);
        }

        return NextResponse.json({ imageUrl: generatedImageUrl });

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate image" },
            { status: 500 }
        );
    }
}
