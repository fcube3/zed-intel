"use client";
import React from "react";
import { useTranslation } from "./LanguageContext";
import dailyIntel from "@/data/daily-intel.json";

export default function PredictionFunnel() {
  const { t } = useTranslation();
  const events = dailyIntel.predictions;

  const getColorClass = (color: string, type: 'text' | 'bg') => {
      const map: any = {
          purple: { text: 'text-purple-400', bg: 'bg-purple-500' },
          blue: { text: 'text-blue-400', bg: 'bg-blue-500' },
          red: { text: 'text-rose-400', bg: 'bg-rose-500' },
          green: { text: 'text-emerald-400', bg: 'bg-emerald-500' },
          yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500' },
          gray: { text: 'text-gray-400', bg: 'bg-gray-500' },
      };
      return map[color]?.[type] || (type === 'text' ? 'text-gray-400' : 'bg-gray-500');
  };

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-10">{t.predictionTitle}</h3>
      
      <div className="space-y-12">
        {events.map((event: any, idx: number) => {
          const textColor = getColorClass(event.color, 'text');
          const bgColor = getColorClass(event.color, 'bg');
          
          return (
            <div key={idx} className="group">
                <div className="flex justify-between text-[10px] uppercase font-bold text-[#52525b] mb-3">
                    <span className={textColor}>{event.label}</span>
                    <span className="font-mono text-[#71717a]">{event.nominal}</span>
                </div>
                
                <a href={event.url || "#"} target="_blank" className={`text-base font-medium text-white mb-4 leading-snug block hover:${textColor} transition`}>
                    {event.title}
                </a>
                
                {event.outcomes ? (
                    <ul className="space-y-3">
                        {event.outcomes.map((outcome: any, oIdx: number) => (
                            <li key={oIdx} className="relative">
                                <div className="flex justify-between items-center text-xs font-mono mb-1 relative z-10">
                                    <div className="flex items-center space-x-2">
                                        <span className={oIdx===0 ? "text-[#e4e4e7]" : "text-[#71717a]"}>{outcome.name}</span>
                                        {outcome.vol_fmt && (
                                          <span className="text-[9px] text-[#3f3f46] hidden group-hover:inline-block">
                                            {outcome.vol_fmt}
                                          </span>
                                        )}
                                    </div>
                                    <span className={oIdx===0 ? textColor : "text-[#52525b]"}>{outcome.prob_pct}</span>
                                </div>
                                <div className="w-full h-[2px] bg-[#27272a]">
                                    <div className={`h-full ${bgColor}`} style={{ width: outcome.prob_pct, opacity: oIdx===0 ? 1 : 0.3 }}></div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-between border-t border-[#27272a] pt-2">
                        <span className="text-xl font-medium text-white">{event.odds}</span>
                        <span className="text-[9px] text-[#52525b] uppercase tracking-widest">{t.consensus}</span>
                    </div>
                )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
