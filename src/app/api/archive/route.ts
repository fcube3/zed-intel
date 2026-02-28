import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

const ARCHIVE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatArchiveLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

export async function GET() {
  try {
    // Collect dates from both Supabase and flat files
    const dates = new Set<string>();

    // Supabase
    try {
      const { data } = await supabase
        .from("intel_archive")
        .select("archive_date")
        .order("archive_date", { ascending: false });
      if (data) {
        for (const row of data) {
          dates.add(row.archive_date);
        }
      }
    } catch {
      // fall through to file-based
    }

    // Flat files fallback/supplement
    try {
      const archiveDir = path.join(process.cwd(), "public", "data", "archive");
      const files = await readdir(archiveDir);
      for (const f of files) {
        const d = f.replace(/\.json$/i, "");
        if (ARCHIVE_DATE_PATTERN.test(d)) dates.add(d);
      }
    } catch {
      // no archive dir
    }

    const archives = [...dates]
      .filter((d) => ARCHIVE_DATE_PATTERN.test(d))
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date, label: formatArchiveLabel(date) }));

    return NextResponse.json(
      { archives },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to build archive index", error);
    return NextResponse.json({ error: "Failed to load archive index", archives: [] }, { status: 500 });
  }
}
