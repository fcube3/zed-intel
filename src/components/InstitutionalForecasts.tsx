"use client";
import React from 'react';
import dailyIntel from "@/data/daily-intel.json";
import { useTranslation } from "@/components/LanguageContext";

// Define the type for forecast items to avoid TS errors
type ForecastItem = {
  firm: string;
  target: string;
  timeline: string;
  sentiment: string;
  change: string;
  note: string;
};

export default function InstitutionalForecasts() {
  const { t, language } = useTranslation();
  
  // Safety check in case the JSON hasn't been updated in all environments yet
  const forecasts: ForecastItem[] = (dailyIntel as any).forecasts || [];

  if (forecasts.length === 0) return null;

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment.toLowerCase()) {
      case 'bullish': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'bearish': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  const getChangeIcon = (change: string) => {
    switch(change.toLowerCase()) {
      case 'raised': return '↑';
      case 'lowered': return '↓';
      default: return '•';
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-widest text-white">
        <i className={`fas fa-chart-line ${language === 'ar' ? 'ml-3' : 'mr-3'} text-yellow-500`}></i> 
        {language === 'ar' ? 'توقعات البنوك (2026)' : 'Bank Forecasts (2026)'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecasts.map((item, idx) => {
          const colors = getSentimentColor(item.sentiment);
          const changeIcon = getChangeIcon(item.change);
          
          return (
            <div key={idx} className={`bg-[#161b22] border border-[#30363d] p-4 rounded-lg relative overflow-hidden group hover:border-gray-600 transition`}>
              {/* Top Row: Firm & Sentiment */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-sm text-gray-300 uppercase tracking-wider">{item.firm}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${colors}`}>
                  {item.sentiment}
                </span>
              </div>

              {/* Middle Row: Target Price */}
              <div className="mb-3">
                <div className="text-2xl font-black text-white tracking-tighter flex items-baseline gap-2">
                  {item.target}
                  <span className="text-[10px] font-normal text-gray-500 uppercase tracking-widest">/ oz</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Target: {item.timeline} <span className="text-gray-600">|</span> Change: <span className="text-white">{changeIcon} {item.change}</span>
                </div>
              </div>

              {/* Bottom Row: Note */}
              <p className="text-[11px] text-gray-400 italic leading-relaxed border-t border-gray-800 pt-2">
                &quot;{item.note}&quot;
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
