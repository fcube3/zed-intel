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
            <p className="text-xs font-bold text-gray-300 mb-3">{event.title}</p>
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
