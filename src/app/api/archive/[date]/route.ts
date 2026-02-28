import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from("intel_archive")
      .select("data")
      .eq("archive_date", date)
      .single();

    if (!error && data) {
      return NextResponse.json(data.data, {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
      });
    }
  } catch {
    // fall through
  }

  // Fallback to flat file
  try {
    const filePath = path.join(process.cwd(), "public", "data", "archive", `${date}.json`);
    const raw = await readFile(filePath, "utf8");
    return NextResponse.json(JSON.parse(raw), {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Archive not found" }, { status: 404 });
  }
}
