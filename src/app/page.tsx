// Minimal Theme Production Deploy [2026-02-12]
"use client";
import dailyIntel from "@/data/daily-intel.json";
import LivePriceTicker from "@/components/LivePriceTicker";
import AssetSelector from "@/components/AssetSelector";
import PredictionFunnel from "@/components/PredictionFunnel";
import LanguageSelector from "@/components/LanguageSelector";
import ArchiveList from "@/components/ArchiveList";
import { useTranslation } from "@/components/LanguageContext";

export default function Home() {
  const { t, language } = useTranslation();

  return (
    <main className="min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans p-8 md:p-16">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-20">
            <h1 className="text-6xl font-bold tracking-tighter text-white mb-4 uppercase">Zed Intel<span className="text-[#27272a]">.</span></h1>
            <div className="flex justify-between items-end border-b border-white pb-4">
                <div className="flex items-center space-x-4">
                   <p className="text-sm font-medium text-[#71717a] uppercase tracking-widest">{t.subtitle}</p>
                   <div className="md:hidden"><LanguageSelector /></div>
                </div>
                <div className="text-right">
                    <div className="hidden md:block mb-1"><LanguageSelector /></div>
                    <p className="text-sm font-medium text-white">{dailyIntel.date}</p>
                </div>
            </div>
        </header>

        {/* Live Ticker (New Minimal Style) */}
        <LivePriceTicker />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-20">
                
                {/* Major News */}
                <section>
                    <h2 className="text-sm font-bold text-[#a1a1aa] mb-8 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
                        {t.newsTitle}
                    </h2>
                    <div className="space-y-10">
                        {dailyIntel.news.map((n, i) => (
                            <div key={i} className="group cursor-pointer">
                                <a href={n.url} target="_blank" className="block">
                                    <h3 className="text-2xl font-medium text-[#e4e4e7] group-hover:text-blue-400 transition mb-3 leading-tight">{n.title}</h3>
                                    <p className="text-base text-[#71717a] leading-relaxed max-w-prose border-l-2 border-[#27272a] pl-4 group-hover:border-blue-500/50 transition">{n.summary}</p>
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Social Intel */}
                <section>
                    <h2 className="text-sm font-bold text-[#a1a1aa] mb-8 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></span>
                        {t.socialIntelTitle}
                    </h2>
                    <div className="space-y-8">
                        {dailyIntel.social_intelligence.map((item, idx) => (
                            <div key={idx} className="bg-[#18181b] p-6 border-l-2 border-purple-500/30">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mb-1">{item.source}</span>
                                        <span className="text-sm font-medium text-white">{item.asset} Signal: <span className="text-purple-400">{item.signal}</span></span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#52525b]">Conf: {item.confidence}</span>
                                </div>
                                <p className="text-sm text-[#d4d4d8] leading-relaxed italic">"{item.insight}"</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Institutional */}
                <section>
                    <h2 className="text-sm font-bold text-[#a1a1aa] mb-8 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-3"></span>
                        {t.intelTitle}
                    </h2>
                    
                    <div className="space-y-12">
                        {/* Macro */}
                        <div>
                             <h4 className="text-xs font-bold uppercase tracking-widest text-[#52525b] mb-4">{t.macroTitle}</h4>
                             <div className="bg-[#18181b] p-8 border-l-2 border-blue-500/30 hover:border-blue-500 transition">
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">{dailyIntel.institutional.macro.firm}</h4>
                                     <a href={dailyIntel.institutional.macro.url} target="_blank" className="text-[10px] font-mono text-blue-500 hover:text-blue-400">REPORT_LINK</a>
                                 </div>
                                 <p className="text-lg text-[#d4d4d8] font-light leading-relaxed">"{dailyIntel.institutional.macro.insight}"</p>
                             </div>
                        </div>

                        {/* Metals Loop */}
                        <div className="grid md:grid-cols-2 gap-8">
                             {dailyIntel.institutional.metals.map((m, i) => (
                                 <div key={i} className="bg-[#18181b] p-6 border-l-2 border-yellow-500/30 hover:border-yellow-500 transition">
                                     <h4 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] mb-3">{m.firm}</h4>
                                     <p className="text-sm text-[#d4d4d8] leading-relaxed">"{m.insight}"</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </section>
                
                {/* Chart Area */}
                <AssetSelector />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 lg:border-l border-[#27272a] lg:pl-10 space-y-16">
                
                {/* Prediction Funnel (New Minimal) */}
                <PredictionFunnel />
                
                {/* Sentiment */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-6">{t.sentimentTitle}</h3>
                    <div className="bg-[#18181b] p-6 border border-[#27272a]">
                         <div className="flex justify-between items-end mb-4">
                             <span className="text-[10px] font-bold uppercase text-[#52525b]">{t.retailPositioning}</span>
                             <span className="text-sm font-mono text-rose-400">76% LONG</span>
                         </div>
                         <div className="w-full h-1 bg-[#27272a] mb-4">
                             <div className="h-full bg-rose-500" style={{ width: "76%" }}></div>
                         </div>
                         <p className="text-xs text-[#a1a1aa] leading-tight">{t.trapPhase}</p>
                    </div>
                </section>

                {/* Logic */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-6">{t.logicTitle}</h3>
                    <div className="pl-4 border-l-2 border-indigo-500">
                        <p className="text-sm text-indigo-300 italic leading-relaxed">"{t.logicText}"</p>
                    </div>
                </section>

                <ArchiveList />
                
                <footer className="pt-20 border-t border-[#27272a]">
                    <p className="text-[10px] text-[#52525b] font-mono mb-2">ENGINEERED_BY_OPENCLAW</p>
                    <p className="text-[10px] text-[#3f3f46] uppercase font-bold tracking-widest">© 2026 ZED INTEL</p>
                </footer>
            </div>
        </div>
      </div>
    </main>
  );
}
