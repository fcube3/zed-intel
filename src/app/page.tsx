import dailyIntel from "@/data/daily-intel.json";
import LivePriceTicker from "@/components/LivePriceTicker";
import AssetSelector from "@/components/AssetSelector";
import PredictionFunnel from "@/components/PredictionFunnel";

export default function Home() {
  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-white">📡 ZED INTELLIGENCE</h1>
          <p className="text-gray-500 font-medium">Daily Strategic Briefing | Public Edition 🦊</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-lg font-bold text-white">{dailyIntel.date}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-[10px] rounded border border-green-700 uppercase font-black">Live Feed</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">DXY: 104.5 | US10Y: 4.2%</span>
          </div>
        </div>
      </header>

      {/* Live Ticker (Client Side Refresh) */}
      <LivePriceTicker />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left & Center: Intel & Charts (3 Cols) */}
        <div className="lg:col-span-3 space-y-12">
          
          {/* Major News */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
              <i className="fas fa-bolt mr-3 text-yellow-500"></i> Market Volatility Catalysts
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dailyIntel.news.map((item, idx) => (
                <a key={idx} href={item.url} target="_blank" className="bg-[#161b22] border border-[#30363d] p-4 border-l-4 border-yellow-600 hover:bg-gray-800/30 block group rounded-r-lg transition">
                  <h3 className="font-bold mb-1 text-sm group-hover:text-yellow-500 transition uppercase tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{item.summary}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Institutional Intelligence */}
          <section className="space-y-10">
            <h2 className="text-xl font-bold mb-8 flex items-center border-b border-gray-800 pb-2 uppercase tracking-widest text-white">
              <i className="fas fa-university mr-3 text-blue-500"></i> Institutional Research Synthesis
            </h2>
            
            <div className="grid grid-cols-1 gap-8">
              {/* Macro */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-1 w-8 bg-blue-500 rounded-full"></span>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Global Macro</h3>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] p-6 border-l-4 border-blue-500/30 rounded-lg">
                  <h4 className="font-bold mb-2 text-[#d4af37]">{dailyIntel.institutional.macro.firm} | {dailyIntel.institutional.macro.analyst}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed italic mb-3">“{dailyIntel.institutional.macro.insight}”</p>
                  <a href={dailyIntel.institutional.macro.url} target="_blank" className="text-[10px] text-blue-400 hover:text-white transition uppercase font-black tracking-widest">
                    <i className="fas fa-external-link-alt mr-1"></i> Open Full Report
                  </a>
                </div>
              </div>

              {/* Precious Metals */}
              <div className="grid md:grid-cols-2 gap-6">
                {dailyIntel.institutional.metals.map((item, idx) => (
                  <div key={idx} className="bg-[#161b22] border border-[#30363d] p-5 border-t-2 border-yellow-700/50 rounded-b-lg">
                    <h4 className="font-bold mb-2 text-[#a6a6a6] text-sm uppercase">{item.firm} | {item.analyst}</h4>
                    <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{item.insight}</p>
                    <a href={item.url} target="_blank" className="text-[9px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-tighter">Verified Source</a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Asset Selector & Chart (Client Component) */}
          <AssetSelector />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-12">
          <PredictionFunnel />
          
          {/* Sentiment Radar (Static placeholder for now, will add dynamic logic) */}
          <section>
            <h2 className="text-xs font-black mb-6 flex items-center uppercase tracking-[0.3em] text-gray-500">
              <i className="fas fa-brain mr-2 text-orange-500"></i> Sentiment Radar
            </h2>
            <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-2">Metals Positioning (IG)</p>
              <p className="text-[11px] font-black text-red-400 mb-2 uppercase text-white">Extreme Long: 76%</p>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mb-2">
                <div className="bg-red-500 h-full" style={{ width: "76%" }}></div>
              </div>
              <p className="text-[9px] text-gray-600 leading-tight italic uppercase">Dumb Money Trap Phase</p>
            </div>
          </section>

          {/* Coach Zed Note */}
          <section>
            <h2 className="text-xs font-black mb-4 flex items-center uppercase tracking-[0.3em] text-indigo-400 italic">Zed's Logic Briefing</h2>
            <div className="bg-indigo-900/10 border-l-4 border-indigo-500 p-4 rounded-r-lg">
              <p className="text-[11px] text-indigo-200 italic leading-relaxed">
                "Human, Singapore's 6.9% GDP beat is a warning to the West. The rotation from BTC to Bullion at the $5k level suggests the market is choosing 'History' over 'Beta' right now."
              </p>
            </div>
          </section>

          <footer className="text-center pt-8 space-y-3 border-t border-gray-800/50">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
              Powered by <a href="https://openclaw.ai" target="_blank" className="text-blue-500 hover:text-blue-400 transition underline">OpenClaw</a>
            </p>
            <p className="text-[9px] text-gray-700 font-bold">© 2026 ZED INTEL | ZGOLD LABS</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
