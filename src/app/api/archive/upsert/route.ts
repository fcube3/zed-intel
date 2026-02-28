import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // Simple auth via service key header
  const authKey = request.headers.get("x-service-key")?.trim();
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!expected || authKey !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, data } = body;

    if (!date || !data) {
      return NextResponse.json({ error: "Missing date or data" }, { status: 400 });
    }

    const { error } = await supabase
      .from("intel_archive")
      .upsert(
        { archive_date: date, data, updated_at: new Date().toISOString() },
        { onConflict: "archive_date" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, date });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
