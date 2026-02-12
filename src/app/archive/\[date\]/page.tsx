"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import LivePriceTicker from "@/components/LivePriceTicker";
import AssetSelector from "@/components/AssetSelector";
import PredictionFunnel from "@/components/PredictionFunnel";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/components/LanguageContext";

export default function ArchivePage() {
  const { date } = useParams();
  const { t, language } = useTranslation();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (date) {
      import(`@/data/archive/${date}.json`)
        .then(m => setData(m.default))
        .catch(e => console.error("Failed to load archive", e));
    }
  }, [date]);

  if (!data) return <div className="p-20 text-center text-white font-black uppercase tracking-widest">Loading Archive: {date}...</div>;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="w-full md:w-auto">
          <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-white">
            <span className="text-green-500 mr-2">[ARCHIVE]</span> {t.title}
          </h1>
          <p className="text-gray-500 font-medium">Historical Strategic Briefing</p>
        </div>
        <div className="text-right mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
          <div className="hidden md:block mb-4">
            <LanguageSelector />
          </div>
          <p className="text-lg font-bold text-white">{data.date}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="px-2 py-0.5 bg-gray-900/30 text-gray-400 text-[10px] rounded border border-gray-700 uppercase font-black italic underline">Historical Record</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-12">
          {/* Re-use components but with archived data */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
              <i className="fas fa-history mr-3 text-yellow-500"></i> Archived News
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {data.news.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 border-l-4 border-gray-600 rounded-r-lg text-white">
                  <h3 className="font-bold mb-1 text-sm uppercase tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{item.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Institutional Archive */}
          <section className="space-y-10">
            <h2 className="text-xl font-bold mb-8 flex items-center border-b border-gray-800 pb-2 uppercase tracking-widest text-white">
              Institutional Intelligence
            </h2>
            <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-blue-500/30 rounded-lg text-white">
               <h4 className="font-bold mb-2 text-[#d4af37]">{data.institutional.macro.firm}</h4>
               <p className="text-sm text-gray-300 leading-relaxed italic">“{data.institutional.macro.insight}”</p>
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
