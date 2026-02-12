"use client";
import React from "react";
import { useTranslation } from "./LanguageContext";
import dailyIntel from "@/data/daily-intel.json";

export default function PredictionFunnel() {
  const { t } = useTranslation();
  
  const events = dailyIntel.predictions;

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 text-white">{t.predictionTitle}</h2>
      </div>
      <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {events.map((event: any, idx: number) => (
          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg group hover:border-[#58a6ff] transition-colors duration-300">
            {/* Header: Label + Volume */}
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${event.color === 'purple' ? 'bg-purple-900/40 text-purple-400 border-purple-800' : event.color === 'yellow' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : event.color === 'red' ? 'bg-red-900/40 text-red-400 border-red-800' : event.color === 'green' ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
                {event.label}
              </span>
              <div className="text-right">
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter text-white">Vol</p>
                <p className="text-[10px] text-white font-black">{event.nominal}</p>
              </div>
            </div>

            {/* Title (Link) */}
            <a href={event.url || "#"} target="_blank" className="block text-[11px] font-bold text-gray-200 mb-3 group-hover:text-[#58a6ff] transition uppercase tracking-tight leading-snug">
              {event.title}
            </a>

            {/* Outcomes List */}
            {event.outcomes ? (
              <div className="space-y-1.5">
                {event.outcomes.map((outcome: any, oIdx: number) => (
                  <div key={oIdx} className="relative">
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold relative z-10 py-0.5 px-1">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-gray-400 whitespace-nowrap truncate max-w-[120px]">{outcome.name}</span>
                        {/* Per-Outcome Volume Badge */}
                        {outcome.vol_fmt && (
                          <span className="text-[8px] text-gray-600 font-mono tracking-tighter hidden group-hover:inline-block transition">
                            {outcome.vol_fmt}
                          </span>
                        )}
                      </div>
                      <span className={idx === 0 && oIdx === 0 ? "text-green-400" : "text-gray-300"}>{outcome.prob_pct}</span>
                    </div>
                    {/* Mini Bar Background */}
                    <div className="absolute top-0 left-0 h-full bg-gray-800/30 rounded z-0" style={{ width: "100%" }}></div>
                    <div className={`absolute top-0 left-0 h-full rounded z-0 opacity-20 ${event.color === 'purple' ? 'bg-purple-500' : event.color === 'yellow' ? 'bg-yellow-500' : event.color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: outcome.prob_pct }}></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">{event.odds}</span>
                <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">{t.consensus}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
