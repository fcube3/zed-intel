"use client";
import React from "react";

export default function PredictionFunnel() {
  const events = [
    { label: "BTC (2026)", title: "BTC hit $75k before 2027?", odds: "89%", nominal: "$16,000,000", color: "purple" },
    { label: "ETH (FEB)", title: "Floor of $1,600 holds?", odds: "78%", nominal: "$12,000,000", color: "blue" },
    { label: "MACRO PROXY", title: "Warsh to be Fed Chair?", odds: "96%", nominal: "$157,000,000", color: "gray" }
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 text-white">Prediction Markets</h2>
      </div>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg group">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${event.color === 'purple' ? 'bg-purple-900/40 text-purple-400 border-purple-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
                {event.label}
              </span>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter text-white">Nominal Size</p>
                <p className="text-[11px] text-white font-black">{event.nominal}</p>
              </div>
            </div>
            <p className="text-xs font-bold group-hover:text-blue-400 transition mb-3 text-white">{event.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">{event.odds}</span>
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Consensus</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
