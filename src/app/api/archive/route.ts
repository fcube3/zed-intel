import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

const ARCHIVE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatArchiveLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

export async function GET() {
  try {
    const archiveDir = path.join(process.cwd(), "public", "data", "archive");
    const files = await readdir(archiveDir);

    const archives = files
      .map((fileName) => fileName.replace(/\.json$/i, ""))
      .filter((date) => ARCHIVE_DATE_PATTERN.test(date))
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        label: formatArchiveLabel(date),
      }));

    return NextResponse.json(
      { archives },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Failed to build archive index", error);
    return NextResponse.json(
      { error: "Failed to load archive index", archives: [] },
      { status: 500 }
    );
  }
}
