"use client";
import React from "react";
import { useTranslation } from "@/components/LanguageContext";

type ArchiveItem = {
  date: string;
  label: string;
};

const RECENT_COUNT = 3;

export default function ArchiveList() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [archives, setArchives] = React.useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadArchives = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch("/api/archive", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const json = await response.json();

        if (isMounted) {
          setArchives(Array.isArray(json.archives) ? json.archives : []);
        }
      } catch (error) {
        console.error("Failed to load archive list", error);

        if (isMounted) {
          setHasError(true);
          setArchives([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadArchives();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentArchives = archives.slice(0, RECENT_COUNT);
  const olderArchives = archives.slice(RECENT_COUNT);

  return (
    <section>
      <h2 className="text-xs font-black mb-6 flex items-center uppercase tracking-[0.3em] text-gray-500 text-white">
        <i className="fas fa-archive mr-2 text-green-500"></i> {t.archiveTitle}
      </h2>
      <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg text-white">
        {isLoading ? (
          <p className="text-[10px] text-gray-500 italic">Loading archive index...</p>
        ) : (
          <>
            <ul className="space-y-2">
              {recentArchives.map((item) => (
                <li key={`recent-${item.date}`}>
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
                      {olderArchives.map((item) => (
                        <li key={`old-${item.date}`}>
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

            {!isLoading && archives.length === 0 && !hasError && (
              <p className="text-[10px] text-gray-600 italic">No archived data yet.</p>
            )}

            {!isLoading && hasError && (
              <p className="text-[10px] text-red-400 italic">Unable to load archive history right now.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
