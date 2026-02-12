"use client";
import React from 'react';
import { useTranslation } from "@/components/LanguageContext";

export default function ArchiveList() {
  const { t } = useTranslation();
  
  // Feb 12 is currently LIVE. It should only appear here after the 11:59 PM fix.
  // We'll update this list dynamically later, for now static.
  const archives = [
    { date: "2026-02-11", label: "Feb 11, 2026" },
  ];

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-6">{t.archiveTitle}</h3>
      <ul className="space-y-4 border-l border-[#27272a] pl-4">
        {archives.map((item, idx) => (
          <li key={idx}>
            <a 
              href={`/archive/${item.date}`} 
              className="text-xs font-mono text-[#52525b] hover:text-[#e4e4e7] transition block"
            >
              {item.label}
            </a>
          </li>
        ))}
        {archives.length === 0 && (
          <p className="text-[10px] text-[#3f3f46] italic">No archived data yet.</p>
        )}
      </ul>
    </section>
  );
}
