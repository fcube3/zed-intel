"use client";
import React from "react";
import { useTranslation } from "./LanguageContext";

import dailyIntel from "@/data/daily-intel.json";

export default function PredictionFunnel() {
  const { t } = useTranslation();
  
  const events = dailyIntel.predictions;

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 text-white">{t.predictionTitle}</h2>
      </div>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg group">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${event.color === 'purple' ? 'bg-purple-900/40 text-purple-400 border-purple-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
                {event.label}
              </span>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter text-white">{t.nominalSize}</p>
                <p className="text-[11px] text-white font-black">{event.nominal}</p>
              </div>
            </div>
            <p className="text-xs font-bold group-hover:text-purple-400 transition mb-3 text-white">{event.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">{event.odds}</span>
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">{t.consensus}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
