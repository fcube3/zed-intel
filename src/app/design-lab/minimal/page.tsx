"use client";
import React from 'react';
import dailyIntel from "@/data/daily-intel.json";

export default function MinimalTheme() {
  const data = dailyIntel;

  return (
    <main className="min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans p-8 md:p-16">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-20">
            <h1 className="text-6xl font-bold tracking-tighter text-white mb-4">Zed Intelligence.</h1>
            <div className="flex justify-between items-end border-b border-white pb-4">
                <p className="text-sm font-medium text-[#71717a]">Daily Strategic Briefing</p>
                <p className="text-sm font-medium text-white">{data.date}</p>
            </div>
        </header>

        {/* Ticker Row */}
        <div className="grid grid-cols-4 gap-8 mb-20 border-t border-b border-[#27272a] py-8">
            {Object.entries(data.prices).map(([key, val]) => (
                <div key={key} className="flex flex-col pl-4 border-l border-[#27272a] first:border-l-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#52525b] mb-2">{key} / USD</span>
                    <div className="flex items-baseline space-x-3">
                        <span className="text-3xl font-medium tracking-tight text-white">${Number(val).toLocaleString()}</span>
                        {/* Simulation of change for design demo */}
                        <span className={`text-xs font-mono font-bold ${key==='gold'||key==='silver' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {key==='gold'||key==='silver' ? '+0.4%' : '-1.2%'}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-12 gap-16">
            
            {/* Main Content */}
            <div className="col-span-7 space-y-16">
                <section>
                    <h2 className="text-sm font-bold text-[#a1a1aa] mb-8 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
                        Strategic Briefing
                    </h2>
                    <div className="space-y-10">
                        {data.news.map((n, i) => (
                            <div key={i} className="group cursor-pointer">
                                <h3 className="text-2xl font-medium text-[#e4e4e7] group-hover:text-blue-400 transition mb-3 leading-tight">{n.title}</h3>
                                <p className="text-base text-[#71717a] leading-relaxed max-w-prose border-l-2 border-[#27272a] pl-4">{n.summary}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-bold text-[#a1a1aa] mb-8 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-3"></span>
                        Institutional View
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                         {data.institutional.metals.map((m, i) => (
                             <div key={i} className="bg-[#18181b] p-8 border-l-2 border-yellow-500/50 hover:border-yellow-500 transition">
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">{m.firm}</h4>
                                     <span className="text-[10px] font-mono text-yellow-500/80 bg-yellow-500/10 px-2 py-1">VERIFIED_NOTE</span>
                                 </div>
                                 <p className="text-lg text-[#d4d4d8] font-light leading-relaxed">&quot;{m.insight}&quot;</p>
                             </div>
                         ))}
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <div className="col-span-5 border-l border-[#27272a] pl-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#52525b] mb-10">Prediction Markets</h3>
                
                <div className="space-y-12">
                    {data.predictions.map((p, i) => (
                        <div key={i} className="group">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-[#52525b] mb-3">
                                <span className={p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : 'text-gray-400'}>{p.label}</span>
                                <span className="font-mono text-[#71717a]">{p.nominal}</span>
                            </div>
                            <h4 className="text-base font-medium text-white mb-4 leading-snug group-hover:text-blue-400 transition">{p.title}</h4>
                            
                            <ul className="space-y-3">
                                {p.outcomes.map((o: any, idx: number) => (
                                    <li key={idx} className="relative">
                                        <div className="flex justify-between items-center text-xs font-mono mb-1 relative z-10">
                                            <span className={idx===0 ? "text-[#e4e4e7]" : "text-[#71717a]"}>{o.name}</span>
                                            <span className={idx===0 ? (p.color==='purple'?'text-purple-400':'text-blue-400') : "text-[#52525b]"}>{o.prob_pct}</span>
                                        </div>
                                        {/* Minimal Bar */}
                                        <div className="w-full h-[2px] bg-[#27272a]">
                                            <div className={`h-full ${p.color==='purple'?'bg-purple-500':'bg-blue-500'}`} style={{ width: o.prob_pct, opacity: idx===0 ? 1 : 0.3 }}></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
