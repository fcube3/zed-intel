"use client";
import React from "react";
import { useTranslation } from "./LanguageContext";

interface Props {
  predictions: any[];
}

export default function StaticPredictionFunnel({ predictions }: Props) {
  const { t } = useTranslation();
  
  if (!predictions) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 text-white">{t.predictionTitle}</h2>
      </div>
      <div className="space-y-4 opacity-90">
        {predictions.map((event, idx) => (
          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg group hover:border-[#58a6ff] transition-colors duration-300">
            {/* Header: Label + Volume */}
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${event.color === 'purple' ? 'bg-purple-900/40 text-purple-400 border-purple-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
                {event.label}
              </span>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter text-white">{t.nominalSize}</p>
                <p className="text-[11px] text-white font-black">{event.nominal}</p>
              </div>
            </div>

            {/* Title (Link) */}
            <a href={event.url || "#"} target="_blank" className="block text-xs font-bold text-gray-200 mb-4 group-hover:text-[#58a6ff] transition uppercase tracking-tight leading-snug">
              {event.title} <i className="fas fa-external-link-alt ml-1 text-[9px] opacity-50"></i>
            </a>

            {/* Outcomes List */}
            {event.outcomes ? (
              <div className="space-y-2">
                {event.outcomes.map((outcome: any, oIdx: number) => (
                  <div key={oIdx} className="relative">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold relative z-10">
                      <span className="text-gray-400">{outcome.name}</span>
                      <span className={idx === 0 && oIdx === 0 ? "text-green-400" : "text-gray-300"}>{outcome.prob_pct}</span>
                    </div>
                    {/* Mini Bar Background */}
                    <div className="absolute top-0 left-0 h-full bg-gray-800/50 rounded z-0" style={{ width: "100%" }}></div>
                    <div className={`absolute top-0 left-0 h-full rounded z-0 opacity-20 ${event.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: outcome.prob_pct }}></div>
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
