"use client";
import React from 'react';
import { useTranslation } from "@/components/LanguageContext";

export default function ArchiveList() {
  const { t } = useTranslation();
  
  // Feb 12 is currently LIVE. It should only appear here after the 11:59 PM fix.
  const archives = [
    { date: "2026-02-11", label: "Feb 11, 2026" },
  ];

  return (
    <section>
      <h2 className="text-xs font-black mb-6 flex items-center uppercase tracking-[0.3em] text-gray-500 text-white">
        <i className="fas fa-archive mr-2 text-green-500"></i> {t.archiveTitle}
      </h2>
      <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg text-white">
        <ul className="space-y-2">
          {archives.map((item, idx) => (
            <li key={idx}>
              <a 
                href={`/archive/${item.date}`} 
                className="text-[11px] font-bold text-blue-400 hover:text-white transition uppercase tracking-widest block py-1 border-b border-gray-800"
              >
                {item.label}
              </a>
            </li>
          ))}
          {archives.length === 0 && (
            <p className="text-[10px] text-gray-600 italic">No archived data yet.</p>
          )}
        </ul>
      </div>
    </section>
  );
}
