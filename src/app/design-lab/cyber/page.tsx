"use client";
import React from 'react';
import dailyIntel from "@/data/daily-intel.json";

export default function CyberTheme() {
  const data = dailyIntel;

  return (
    <main className="min-h-screen bg-black text-[#00ff41] font-mono p-4 selection:bg-[#00ff41] selection:text-black">
      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      <div className="max-w-[1600px] mx-auto relative z-10 border border-[#00ff41]/20 p-1">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-[#00ff41]/30 pb-4 mb-8 bg-black/80 backdrop-blur">
            <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-[#00ff41] animate-pulse"></div>
                <h1 className="text-xl font-bold tracking-tighter">ZED_INTEL__V2.0</h1>
            </div>
            <div className="text-xs text-[#00ff41]/60">
                Connection: SECURE_SOCKET_LAYER
                <span className="ml-4">Ping: 12ms</span>
            </div>
        </header>

        {/* Marquee Ticker */}
        <div className="flex space-x-1 mb-8">
            {Object.entries(data.prices).map(([key, val]) => (
                <div key={key} className="flex-1 border border-[#00ff41]/20 bg-[#00ff41]/5 p-3 flex justify-between items-center">
                    <span className="text-xs opacity-70">{key}</span>
                    <span className="text-lg font-bold">${Number(val).toLocaleString()}</span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-1">
            {/* Intel Feed */}
            <div className="col-span-2 border-r border-[#00ff41]/20 pr-4">
                <h2 className="text-xs bg-[#00ff41] text-black inline-block px-2 py-1 mb-6 font-bold">>> STREAM_LOG</h2>
                
                <div className="space-y-6">
                    {data.news.map((n, i) => (
                        <div key={i} className="border-l-2 border-[#00ff41]/40 pl-4 py-1 hover:border-[#00ff41] hover:bg-[#00ff41]/5 transition-all cursor-pointer">
                            <h3 className="text-sm font-bold uppercase mb-1">[{i.toString().padStart(2, '0')}] {n.title}</h3>
                            <p className="text-xs text-[#00ff41]/70 leading-relaxed">{n.summary}</p>
                        </div>
                    ))}
                    
                    <div className="mt-8 border-t border-[#00ff41]/20 pt-8">
                        <h2 className="text-xs bg-[#00ff41] text-black inline-block px-2 py-1 mb-6 font-bold">>> INSTITUTIONAL_DATA</h2>
                        <div className="grid grid-cols-2 gap-4">
                             {data.institutional.metals.map((m, i) => (
                                 <div key={i} className="border border-[#00ff41]/20 p-4">
                                     <h4 className="text-xs font-bold mb-2">SOURCE: {m.firm.toUpperCase()}</h4>
                                     <p className="text-xs opacity-80">"{m.insight}"</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Prediction Terminal */}
            <div className="pl-4">
                <h2 className="text-xs bg-[#00ff41] text-black inline-block px-2 py-1 mb-6 font-bold">>> PROBABILITY_MATRIX</h2>
                <div className="space-y-4 text-xs">
                    {data.predictions.map((p, i) => (
                        <div key={i} className="border border-[#00ff41]/30 p-2 bg-black hover:bg-[#00ff41]/10">
                            <div className="flex justify-between mb-2 opacity-50">
                                <span>ID: {p.label}</span>
                                <span>VOL: {p.nominal}</span>
                            </div>
                            <div className="font-bold mb-2 truncate text-[#00ff41]">{p.title}</div>
                            <div className="space-y-1">
                                {p.outcomes.map((o: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center group">
                                        <span className="opacity-70 group-hover:opacity-100">{o.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 h-1 bg-[#00ff41]/20">
                                                <div className="h-full bg-[#00ff41]" style={{ width: o.prob_pct }}></div>
                                            </div>
                                            <span className="w-8 text-right font-bold">{o.prob_pct}</span>
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
    </main>
  );
}
