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
        <div className="grid grid-cols-4 gap-8 mb-20">
            {Object.entries(data.prices).map(([key, val]) => (
                <div key={key} className="flex flex-col border-l border-[#27272a] pl-4">
                    <span className="text-xs font-bold uppercase text-[#52525b] mb-1">{key}</span>
                    <span className="text-3xl font-medium tracking-tight text-white">${Number(val).toLocaleString()}</span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-12 gap-16">
            
            {/* Main Content */}
            <div className="col-span-7 space-y-16">
                <section>
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                        Key Developments
                    </h2>
                    <div className="space-y-8">
                        {data.news.map((n, i) => (
                            <div key={i} className="group cursor-pointer">
                                <h3 className="text-xl font-medium text-[#e4e4e7] group-hover:text-white transition mb-2">{n.title}</h3>
                                <p className="text-sm text-[#71717a] leading-relaxed max-w-prose">{n.summary}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                        <span className="w-2 h-2 bg-[#27272a] rounded-full mr-3"></span>
                        Institutional View
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                         {data.institutional.metals.map((m, i) => (
                             <div key={i} className="bg-[#18181b] p-6 rounded-sm border-l-2 border-white">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] mb-3">{m.firm}</h4>
                                 <p className="text-base text-[#d4d4d8] italic">"{m.insight}"</p>
                             </div>
                         ))}
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <div className="col-span-5 border-l border-[#27272a] pl-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-8">Prediction Markets</h3>
                
                <div className="space-y-10">
                    {data.predictions.map((p, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-[#52525b] mb-2">
                                <span>{p.label}</span>
                                <span>{p.nominal}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-3 leading-snug">{p.title}</h4>
                            
                            <ul className="space-y-2">
                                {p.outcomes.map((o: any, idx: number) => (
                                    <li key={idx} className="flex justify-between items-center text-xs font-mono">
                                        <span className={idx===0 ? "text-[#d4d4d8]" : "text-[#52525b]"}>{o.name}</span>
                                        <span className={idx===0 ? "text-white" : "text-[#52525b]"}>{o.prob_pct}</span>
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
