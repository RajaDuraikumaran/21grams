import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("generations")
            .select("image_url")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching generations:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ images: data || [] });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
