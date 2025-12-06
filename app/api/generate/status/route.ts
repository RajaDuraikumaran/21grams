import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 10; // Fast response
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get("taskId");
        const styleId = searchParams.get("styleId");

        if (!taskId) {
            return NextResponse.json({ error: "taskId is required" }, { status: 400 });
        }

        // 1. Auth
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                        } catch { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Poll NanoBanana
        const kieApiKey = process.env.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
        const taskDetailsEndpoint = "https://api.nanobananaapi.ai/api/v1/nanobanana/get-task-details";

        console.log(`[STATUS] Polling for taskId: ${taskId}`);
        const statusResponse = await fetch(`${taskDetailsEndpoint}?taskId=${taskId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${kieApiKey}` },
        });

        console.log(`[STATUS] NanoBanana Response: ${statusResponse.status}`);

        if (!statusResponse.ok) {
            const errorText = await statusResponse.text();
            console.error(`[STATUS] Polling failed (${statusResponse.status}):`, errorText);
            return NextResponse.json({ status: "failed", error: `API Error: ${statusResponse.status} - ${errorText}` });
        }

        let statusData;
        try {
            statusData = await statusResponse.json();
        } catch (e) {
            console.error("Failed to parse status JSON", e);
            return NextResponse.json({ status: "processing" }); // Assume processing if JSON fails temporarily
        }

        const successFlag = statusData.data?.successFlag; // 0: Generating, 1: Success, 2/3: Failed

        if (successFlag === 0 || successFlag === undefined) {
            return NextResponse.json({ status: "processing" });
        }

        if (successFlag === 2 || successFlag === 3) {
            return NextResponse.json({
                status: "failed",
                error: statusData.data?.errorMessage || "Generation failed"
            });
        }

        if (successFlag === 1) {
            // Success
            // Success
            console.log("DEBUG: Full Status API Response:", JSON.stringify(statusData, null, 2));

            let resultUrl = null;

            // Defensive Parsing Strategy: Try all known patterns
            if (statusData.data?.resultImageUrl) resultUrl = statusData.data.resultImageUrl;
            else if (statusData.resultImageUrl) resultUrl = statusData.resultImageUrl;
            else if (statusData.data?.result_image_url) resultUrl = statusData.data.result_image_url;
            else if (statusData.result_image_url) resultUrl = statusData.result_image_url;
            else if (statusData.data?.imageUrl) resultUrl = statusData.data.imageUrl;
            else if (statusData.imageUrl) resultUrl = statusData.imageUrl;
            // Fallback: Check for 'output' or 'images' array often used in other AI APIs
            else if (statusData.data?.output?.[0]) resultUrl = statusData.data.output[0];
            else if (statusData.output?.[0]) resultUrl = statusData.output[0];

            if (!resultUrl) {
                console.error("CRITICAL: Task succeeded but no image URL found in known paths.");
                console.error("Available keys in data:", statusData.data ? Object.keys(statusData.data) : "No data object");
                return NextResponse.json({ status: "failed", error: "Result URL missing from API response" });
            }

            console.log(`[STATUS] Found Result URL: ${resultUrl}`);

            // Fetch Image
            const imageResponse = await fetch(resultUrl);
            if (!imageResponse.ok) {
                return NextResponse.json({ status: "failed", error: "Failed to download image" });
            }
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            // Upload to Supabase
            const fileName = `gen-${user.id}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from("user-uploads")
                .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

            if (uploadError) {
                return NextResponse.json({ status: "failed", error: `Upload failed: ${uploadError.message}` });
            }

            const { data: { publicUrl } } = supabase.storage
                .from("user-uploads")
                .getPublicUrl(fileName);

            // Save to DB
            if (styleId) {
                const { error: dbError } = await supabaseAdmin
                    .from("generations")
                    .insert([{
                        image_url: publicUrl,
                        prompt_style: styleId,
                        user_id: user.id,
                    }]);
                if (dbError) console.error("DB Insert Error", dbError);
            }

            return NextResponse.json({ status: "complete", imageUrl: publicUrl });
        }

        return NextResponse.json({ status: "processing" });

    } catch (error: any) {
        console.error("Status Check Error:", error);
        return NextResponse.json({ status: "failed", error: error.message }, { status: 500 });
    }
}
