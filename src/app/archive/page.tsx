"use client";
import React from "react";
import Link from "next/link";

interface ArchiveEntry {
  date: string;
  label: string;
}

export default function ArchiveIndex() {
  const [archives, setArchives] = React.useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/archive")
      .then((res) => res.json())
      .then((json) => {
        setArchives(json.archives ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12">
        <Link href="/" className="text-[10px] text-amber-400 hover:text-amber-300 uppercase font-black tracking-widest mb-4 inline-block">
          ← Back to Live Intel
        </Link>
        <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
          Archive
        </h1>
        <p className="text-gray-500 font-medium mt-2">Historical Strategic Briefings</p>
      </header>

      {loading ? (
        <p className="text-gray-500 text-sm uppercase tracking-widest">Loading…</p>
      ) : archives.length === 0 ? (
        <p className="text-gray-500 text-sm">No archived briefings found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {archives.map((entry) => (
            <Link
              key={entry.date}
              href={`/archive/${entry.date}`}
              className="bg-[#161b22] border border-[#30363d] hover:border-amber-500/50 p-4 rounded-lg transition group"
            >
              <p className="font-bold text-white group-hover:text-amber-400 transition text-sm uppercase tracking-tight">
                {entry.label}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                {entry.date} →
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
