"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from "@/components/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import StaticPriceTicker from "@/components/StaticPriceTicker";
import StaticPredictionFunnel from "@/components/StaticPredictionFunnel";
import AssetSelector from "@/components/AssetSelector"; // We'll hide the live chart inside but keep structure if needed

export default function ArchivePage() {
  const params = useParams();
  const date = params?.date;
  const { t, language } = useTranslation();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (date) {
      fetch(`/api/archive/${date}`)
        .then(res => res.json())
        .then(json => setData(json))
        .catch(e => console.error("Failed to load archive", e));
    }
  }, [date]);

  if (!data) return <div className="p-20 text-center text-white font-black uppercase tracking-widest bg-black min-h-screen">Loading Archive: {date}...</div>;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto bg-black min-h-screen text-white">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="w-full md:w-auto">
          <div className="flex justify-between items-start mb-4 md:mb-0">
             <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-white">
               <span className="text-green-500 mr-2">[ARCHIVE]</span> {t.title}
             </h1>
             <div className="md:hidden">
                <LanguageSelector />
             </div>
          </div>
          <p className="text-gray-500 font-medium">Historical Strategic Briefing</p>
        </div>
        <div className="text-right mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
          <div className="hidden md:block mb-4">
            <LanguageSelector />
          </div>
          <p className="text-lg font-bold text-white">{data.date}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="px-2 py-0.5 bg-gray-900/30 text-gray-400 text-[10px] rounded border border-gray-700 uppercase font-black italic">Historical Record</span>
          </div>
        </div>
      </header>

      {/* Static Ticker */}
      <StaticPriceTicker data={data.prices} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-12">
          
          {/* Major News */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
              <i className={`fas fa-bolt ${language === 'ar' ? 'ml-3' : 'mr-3'} text-yellow-500`}></i> {t.newsTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {data.news?.map((item: any, idx: number) => (
                <a key={idx} href={item.url} target="_blank" className="bg-[#161b22] border border-[#30363d] p-4 border-l-4 border-yellow-600 hover:bg-gray-800/30 block group rounded-r-lg transition">
                  <h3 className="font-bold mb-1 text-sm group-hover:text-yellow-500 transition uppercase tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{item.summary}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Social Intelligence Stream */}
          {data.social_intelligence && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
                <i className={`fas fa-project-diagram ${language === 'ar' ? 'ml-3' : 'mr-3'} text-purple-500`}></i> {t.socialIntelTitle}
              </h2>
              <div className="space-y-4">
                {data.social_intelligence.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg border-l-4 border-purple-500/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[9px] font-black bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-purple-800 mr-2">{item.source}</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{item.asset} Signal: {item.signal}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.confidence}: <span className="text-green-400">{item.confidence}</span></span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic">&quot;{item.insight}&quot;</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Institutional Intelligence */}
          <section className="space-y-10">
            <h2 className="text-xl font-bold mb-8 flex items-center border-b border-gray-800 pb-2 uppercase tracking-widest text-white">
              <i className={`fas fa-university ${language === 'ar' ? 'ml-3' : 'mr-3'} text-blue-500`}></i> {t.intelTitle}
            </h2>
            
            <div className="grid grid-cols-1 gap-8">
              {/* Macro */}
              {data.institutional?.macro && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="h-1 w-8 bg-blue-500 rounded-full"></span>
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.macroTitle}</h3>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-blue-500/30 rounded-lg text-white">
                    <h4 className="font-bold mb-2 text-[#d4af37]">{data.institutional.macro.firm} | {data.institutional.macro.analyst}</h4>
                    <p className="text-sm text-gray-300 leading-relaxed italic mb-3">&ldquo;{data.institutional.macro.insight}&rdquo;</p>
                    <a href={data.institutional.macro.url} target="_blank" className="text-[10px] text-blue-400 hover:text-white transition uppercase font-black tracking-widest">
                      <i className="fas fa-external-link-alt mr-1"></i> {t.openReport}
                    </a>
                  </div>
                </div>
              )}

              {/* Metals & Crypto */}
              <div className="grid md:grid-cols-2 gap-6">
                 {data.institutional?.metals && (
                   <div className="space-y-4 text-white">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="h-1 w-8 bg-yellow-600 rounded-full"></span>
                        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.metalsTitle}</h3>
                      </div>
                      {data.institutional.metals.map((item: any, idx: number) => (
                        <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 border-t-2 border-yellow-700/50 rounded-b-lg">
                          <h4 className="font-bold mb-2 text-[#a6a6a6] text-sm uppercase">{item.firm} | {item.analyst}</h4>
                          <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{item.insight}</p>
                          <a href={item.url} target="_blank" className="text-[9px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-tighter">{t.verifiedSource}</a>
                        </div>
                      ))}
                   </div>
                 )}
                 {data.institutional?.crypto && (
                   <div className="space-y-4 text-white">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="h-1 w-8 bg-orange-500 rounded-full"></span>
                        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.cryptoTitle}</h3>
                      </div>
                      <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-orange-500/30 rounded-lg">
                        <h4 className="font-bold mb-2 text-[#f7931a] uppercase">{data.institutional.crypto.firm} | {data.institutional.crypto.analyst}</h4>
                        <p className="text-sm text-gray-300 leading-relaxed italic mb-3">&ldquo;{data.institutional.crypto.insight}&rdquo;</p>
                        <a href={data.institutional.crypto.url} target="_blank" className="text-[10px] text-blue-400 hover:text-white transition uppercase font-black tracking-widest">
                          <i className="fas fa-link mr-1"></i> {t.openReport}
                        </a>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </section>

          {/* Placeholder for Chart Area in Archive (Static Message) */}
          <section>
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
              <h2 className="text-xl font-bold flex items-center uppercase tracking-widest text-white"><i className="fas fa-chart-line mr-3 text-blue-500"></i> {t.chartTitle}</h2>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] h-[200px] shadow-2xl rounded-lg text-white flex items-center justify-center flex-col opacity-50">
               <i className="fas fa-history text-4xl mb-4 text-gray-600"></i>
               <p className="text-xs uppercase font-black tracking-widest text-gray-500">Live Chart Data Not Archived</p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <StaticPredictionFunnel predictions={data.predictions} />
          
          <div className="space-y-4">
             <a href="/" className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded block text-center hover:bg-blue-500 transition">
               ← Return to Live Intel
             </a>
          </div>

          <section>
            <h2 className="text-xs font-black mb-4 flex items-center uppercase tracking-[0.3em] text-indigo-400 italic">
               <i className={`fas fa-fox ${language === 'ar' ? 'ml-2' : 'mr-2'} text-indigo-400`}></i> {t.logicTitle}
            </h2>
            <div className="bg-indigo-900/10 border-l-4 border-indigo-500 p-4 rounded-r-lg text-white">
              <p className="text-[11px] text-indigo-200 italic leading-relaxed">
                &quot;{t.logicText}&quot;
              </p>
            </div>
          </section>

          <footer className="text-center pt-8 space-y-3 border-t border-gray-800/50">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
              {t.poweredBy} <a href="https://openclaw.ai" target="_blank" className="text-blue-500 hover:text-blue-400 transition underline">OpenClaw</a>
            </p>
            <p className="text-[9px] text-gray-700 font-bold uppercase">© 2026 KAI INTEL | KGOLD LABS</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
