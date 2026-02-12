"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from "@/components/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function ArchivePage() {
  const params = useParams();
  const date = params?.date;
  const { t } = useTranslation();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (date) {
      fetch(`/data/archive/${date}.json`)
        .then(res => res.json())
        .then(json => setData(json))
        .catch(e => console.error("Failed to load archive", e));
    }
  }, [date]);

  if (!data) return <div className="p-20 text-center text-white font-black uppercase tracking-widest bg-black min-h-screen">Loading Archive: {date}...</div>;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto bg-black min-h-screen text-white">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="w-full md:w-auto">
          <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter">
            <span className="text-green-500 mr-2">[ARCHIVE]</span> {t.title}
          </h1>
          <p className="text-gray-500 font-medium">Historical Strategic Briefing</p>
        </div>
        <div className="text-right mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
          <div className="hidden md:block mb-4">
            <LanguageSelector />
          </div>
          <p className="text-lg font-bold">{data.date}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="px-2 py-0.5 bg-gray-900/30 text-gray-400 text-[10px] rounded border border-gray-700 uppercase font-black italic">Historical Record</span>
          </div>
        </div>
      </header>

      {/* Snapshot Prices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 opacity-75">
        {data.prices && Object.entries(data.prices).map(([symbol, price]: any) => (
          <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{symbol} / USD</p>
            <p className="text-xl font-bold text-gray-300">${price.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-12">
          
          {/* Social Intel (The Squad) */}
          {data.social_intelligence && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest">
                <i className="fas fa-project-diagram mr-3 text-purple-500"></i> Social Intelligence
              </h2>
              <div className="space-y-4">
                {data.social_intelligence.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg border-l-4 border-purple-500/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[9px] font-black bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-purple-800 mr-2">{item.source}</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{item.asset} Signal: {item.signal}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confidence: <span className="text-green-400">{item.confidence}</span></span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic">"{item.insight}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Institutional */}
          <section className="space-y-10">
            <h2 className="text-xl font-bold mb-8 flex items-center border-b border-gray-800 pb-2 uppercase tracking-widest">
              Institutional Intelligence
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {/* Macro */}
              {data.institutional?.macro && (
                <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-blue-500/30 rounded-lg">
                   <h4 className="font-bold mb-2 text-[#d4af37]">{data.institutional.macro.firm} | {data.institutional.macro.analyst}</h4>
                   <p className="text-sm text-gray-300 leading-relaxed italic">“{data.institutional.macro.insight}”</p>
                </div>
              )}
              {/* Metals Loop */}
              {data.institutional?.metals && (
                <div className="grid md:grid-cols-2 gap-6">
                  {data.institutional.metals.map((item: any, idx: number) => (
                    <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 border-t-2 border-yellow-700/50 rounded-b-lg">
                      <h4 className="font-bold mb-2 text-[#a6a6a6] text-sm uppercase">{item.firm} | {item.analyst}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{item.insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-12">
           <a href="/" className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded block text-center hover:bg-blue-500 transition">
             ← Return to Live Intel
           </a>
        </div>
      </div>
    </main>
  );
}
