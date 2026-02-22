"use client";
import React from 'react';
import { useTranslation } from "@/components/LanguageContext";

export default function ArchiveList() {
  const { t } = useTranslation();
  
  // Feb 12 is currently LIVE. It should only appear here after the 11:59 PM fix.
  const archives = [
    { date: "2026-02-22", label: "Feb 22, 2026" },
    { date: "2026-02-21", label: "Feb 21, 2026" },
    { date: "2026-02-20", label: "Feb 20, 2026" },
    { date: "2026-02-19", label: "Feb 19, 2026" },
    { date: "2026-02-18", label: "Feb 18, 2026" },
    { date: "2026-02-17", label: "Feb 17, 2026" },
    { date: "2026-02-16", label: "Feb 16, 2026" },
    { date: "2026-02-15", label: "Feb 15, 2026" },
    { date: "2026-02-14", label: "Feb 14, 2026" },
    { date: "2026-02-13", label: "Feb 13, 2026" },
    { date: "2026-02-12", label: "Feb 12, 2026" },
    { date: "2026-02-11", label: "Feb 11, 2026" },
  ];

  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const RECENT_COUNT = 3;
  const recentArchives = archives.slice(0, RECENT_COUNT);
  const olderArchives = archives.slice(RECENT_COUNT);

  return (
    <section>
      <h2 className="text-xs font-black mb-6 flex items-center uppercase tracking-[0.3em] text-gray-500 text-white">
        <i className="fas fa-archive mr-2 text-green-500"></i> {t.archiveTitle}
      </h2>
      <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg text-white">
        <ul className="space-y-2">
          {recentArchives.map((item, idx) => (
            <li key={`recent-${idx}`}>
              <a 
                href={`/archive/${item.date}`} 
                className="text-[11px] font-bold text-blue-400 hover:text-white transition uppercase tracking-widest block py-1 border-b border-gray-800"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {olderArchives.length > 0 && (
          <div className="mt-2 pt-1 border-t border-gray-800/50">
            {!isExpanded ? (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-[10px] font-black text-gray-500 hover:text-white transition uppercase tracking-widest block py-2 w-full text-left"
              >
                <i className="fas fa-history mr-1"></i> Show History ({olderArchives.length})
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <ul className="space-y-2 max-h-32 overflow-y-auto pr-1 my-2 custom-scrollbar">
                  {olderArchives.map((item, idx) => (
                    <li key={`old-${idx}`}>
                      <a 
                        href={`/archive/${item.date}`} 
                        className="text-[10px] font-bold text-gray-500 hover:text-white transition uppercase tracking-widest block py-1 border-b border-gray-800/50"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-[9px] font-bold text-gray-600 hover:text-gray-400 transition uppercase tracking-widest block py-1 w-full text-left"
                >
                  Hide History
                </button>
              </div>
            )}
          </div>
        )}

        {archives.length === 0 && (
          <p className="text-[10px] text-gray-600 italic">No archived data yet.</p>
        )}
      </div>
    </section>
  );
}
