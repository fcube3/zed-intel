"use client";
import React from 'react';
import dailyIntel from "@/data/daily-intel.json";

export default function GlassTheme() {
  const data = dailyIntel;
  
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0f16] to-black text-white font-sans selection:bg-gold-500/30">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto p-8 relative z-10">
        {/* Header */}
        <header className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extralight tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              ZED <span className="font-bold text-white">INTELLIGENCE</span>
            </h1>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Institutional Strategic Briefing</p>
          </div>
          <div className="text-right">
             <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                <span className="text-xs font-mono text-gray-300">SYSTEM ONLINE</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Ticker & Intel */}
            <div className="col-span-8 space-y-8">
                {/* Ticker Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {Object.entries(data.prices).map(([key, val]) => (
                        <div key={key} className="relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition duration-500">
                             <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition"></div>
                             <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{key}</p>
                             <p className="text-2xl font-medium tracking-tight">${Number(val).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Main Intel Card */}
                <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-gold-500 opacity-50"></div>
                    <h2 className="text-2xl font-light mb-8 flex items-center">
                        <span className="w-1 h-8 bg-blue-500 mr-4"></span>
                        Strategic Synthesis
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 border-b border-white/5 pb-2">Institutional Flows</h3>
                            {data.institutional.metals.map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition">{item.firm}</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed mt-1 group-hover:text-gray-300 transition">&quot;{item.insight}&quot;</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                             <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 border-b border-white/5 pb-2">Macro Context</h3>
                             <div>
                                <h4 className="text-sm font-bold text-gray-300">{data.institutional.macro.firm}</h4>
                                <p className="text-sm text-gray-400 leading-relaxed mt-1">&quot;{data.institutional.macro.insight}&quot;</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Prediction Funnel */}
            <div className="col-span-4 space-y-6">
                <div className="rounded-3xl bg-[#0d1117]/80 border border-white/10 p-6 backdrop-blur-lg">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 flex justify-between items-center">
                        <span>Prediction Markets</span>
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    </h3>
                    
                    <div className="space-y-4">
                        {data.predictions.map((p, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-bold text-purple-400 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20">{p.label}</span>
                                    <span className="text-[9px] text-gray-500 font-mono">{p.nominal}</span>
                                </div>
                                <h4 className="text-sm text-gray-200 font-medium leading-snug mb-2 group-hover:text-purple-300 transition">{p.title}</h4>
                                
                                <div className="space-y-1">
                                    {p.outcomes.map((o: any, idx: number) => (
                                        <div key={idx} className="relative h-6 bg-white/5 rounded overflow-hidden flex items-center px-2">
                                             <div className="absolute top-0 left-0 h-full bg-purple-500/20" style={{ width: o.prob_pct }}></div>
                                             <div className="relative z-10 flex justify-between w-full text-[10px] font-mono">
                                                 <span className="text-gray-300">{o.name}</span>
                                                 <span className={idx===0 ? "text-purple-300 font-bold" : "text-gray-500"}>{o.prob_pct}</span>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
