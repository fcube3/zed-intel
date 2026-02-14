// Dynamic Archive and 5-Slot Funnel Fix [Force Rebuild 2026-02-12]
"use client";
import dailyIntel from "@/data/daily-intel.json";
import LivePriceTicker from "@/components/LivePriceTicker";
import AssetSelector from "@/components/AssetSelector";
import PredictionFunnel from "@/components/PredictionFunnel";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/components/LanguageContext";

import ArchiveList from "@/components/ArchiveList";

const getAssetColor = (asset: string) => {
    const a = asset.toUpperCase();
    if (a.includes('GOLD') || a.includes('SILVER') || a.includes('XAU') || a.includes('XAG') || a.includes('METAL')) return { border: 'border-yellow-500/30', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (a.includes('BTC') || a.includes('ETH') || a.includes('CRYPTO') || a.includes('BITCOIN')) return { border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500/10' };
    if (a.includes('MACRO') || a.includes('FED') || a.includes('DOLLAR')) return { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { border: 'border-gray-500/30', text: 'text-gray-400', bg: 'bg-gray-500/10' };
};

export default function Home() {
  const { t, language } = useTranslation();

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="w-full md:w-auto">
          <div className="flex justify-between items-start mb-4 md:mb-0">
             <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-white">{t.title}</h1>
             <div className="md:hidden">
                <LanguageSelector />
             </div>
          </div>
          <p className="text-gray-500 font-medium">{t.subtitle}</p>
        </div>
        <div className="text-right mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
          <div className="hidden md:block mb-4">
            <LanguageSelector />
          </div>
          <p className="text-lg font-bold text-white">{dailyIntel.date}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-[10px] rounded border border-green-700 uppercase font-black">{t.liveFeed}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">DXY: 104.5 | US10Y: 4.2%</span>
          </div>
        </div>
      </header>

      {/* Live Ticker */}
      <LivePriceTicker />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-12">
          
          {/* Major News */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
              <i className={`fas fa-bolt ${language === 'ar' ? 'ml-3' : 'mr-3'} text-blue-500`}></i> {t.newsTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dailyIntel.news.map((item, idx) => (
                <a key={idx} href={item.url} target="_blank" className="bg-[#161b22] border border-[#30363d] p-4 border-l-4 border-blue-600 hover:bg-gray-800/30 block group rounded-r-lg transition">
                  <h3 className="font-bold mb-1 text-sm group-hover:text-blue-500 transition uppercase tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{item.summary}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Social Intelligence Stream (Dynamic Colors) */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
              <i className={`fas fa-project-diagram ${language === 'ar' ? 'ml-3' : 'mr-3'} text-purple-500`}></i> {t.socialIntelTitle}
            </h2>
            <div className="space-y-4">
              {dailyIntel.social_intelligence.map((item, idx) => {
                const colors = getAssetColor(item.asset);
                return (
                  <div key={idx} className={`bg-[#161b22] border border-[#30363d] p-5 rounded-lg border-l-4 ${colors.border.replace('/30', '')}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border mr-2 ${colors.bg} ${colors.text} ${colors.border}`}>{item.source}</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{item.asset} Signal: {item.signal}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.confidence}: <span className="text-green-400">{item.confidence}</span></span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic">"{item.insight}"</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Institutional Intelligence */}
          <section className="space-y-10">
            <h2 className="text-xl font-bold mb-8 flex items-center border-b border-gray-800 pb-2 uppercase tracking-widest text-white">
              <i className={`fas fa-university ${language === 'ar' ? 'ml-3' : 'mr-3'} text-gray-500`}></i> {t.intelTitle}
            </h2>
            
            <div className="grid grid-cols-1 gap-8">
              {/* Macro */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-1 w-8 bg-blue-500 rounded-full"></span>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.macroTitle}</h3>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-blue-500/30 rounded-lg text-white">
                  <h4 className="font-bold mb-2 text-[#d4af37]">{dailyIntel.institutional.macro.firm} | {dailyIntel.institutional.macro.analyst}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed italic mb-3">“{dailyIntel.institutional.macro.insight}”</p>
                  <a href={dailyIntel.institutional.macro.url} target="_blank" className="text-[10px] text-blue-400 hover:text-white transition uppercase font-black tracking-widest">
                    <i className="fas fa-external-link-alt mr-1"></i> {t.openReport}
                  </a>
                </div>
              </div>

              {/* Metals & Crypto */}
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4 text-white">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="h-1 w-8 bg-yellow-500 rounded-full"></span>
                      <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.metalsTitle}</h3>
                    </div>
                    {dailyIntel.institutional.metals.map((item, idx) => (
                      <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 border-t-2 border-yellow-500/50 rounded-b-lg">
                        <h4 className="font-bold mb-2 text-[#a6a6a6] text-sm uppercase">{item.firm} | {item.analyst}</h4>
                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{item.insight}</p>
                        <a href={item.url} target="_blank" className="text-[9px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-tighter">{t.verifiedSource}</a>
                      </div>
                    ))}
                 </div>
                 <div className="space-y-4 text-white">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="h-1 w-8 bg-purple-500 rounded-full"></span>
                      <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.cryptoTitle}</h3>
                    </div>
                    <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-purple-500/30 rounded-lg">
                      <h4 className="font-bold mb-2 text-[#f7931a] uppercase">{dailyIntel.institutional.crypto.firm} | {dailyIntel.institutional.crypto.analyst}</h4>
                      <p className="text-sm text-gray-300 leading-relaxed italic mb-3">“{dailyIntel.institutional.crypto.insight}”</p>
                      <a href={dailyIntel.institutional.crypto.url} target="_blank" className="text-[10px] text-blue-400 hover:text-white transition uppercase font-black tracking-widest">
                        <i className="fas fa-link mr-1"></i> {t.openReport}
                      </a>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <AssetSelector />
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <PredictionFunnel />
          
          {/* Archive */}
          <ArchiveList />

          {/* Logic */}
          <section>
            <h2 className="text-xs font-black mb-4 flex items-center uppercase tracking-[0.3em] text-indigo-400 italic">
               <i className={`fas fa-fox ${language === 'ar' ? 'ml-2' : 'mr-2'} text-indigo-400`}></i> {t.logicTitle}
            </h2>
            <div className="bg-indigo-900/10 border-l-4 border-indigo-500 p-4 rounded-r-lg text-white">
              <p className="text-[11px] text-indigo-200 italic leading-relaxed">
                "{t.logicText}"
              </p>
            </div>
          </section>

          <footer className="text-center pt-8 space-y-3 border-t border-gray-800/50">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
              {t.poweredBy} <a href="https://openclaw.ai" target="_blank" className="text-blue-500 hover:text-blue-400 transition underline">OpenClaw</a>
            </p>
            <p className="text-[9px] text-gray-700 font-bold uppercase">© 2026 ZED INTEL | ZGOLD LABS</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
