"use client";
import React, { useState, useEffect } from "react";

export default function LivePriceTicker() {
  const [prices, setPrices] = useState({
    XAU: { price: "5,045.57", change: "+0.41%" },
    XAG: { price: "81.25", change: "+0.59%" },
    BTC: { price: "69,159.94", change: "-1.10%" },
    ETH: { price: "2,026.36", change: "-0.30%" }
  });

  // Simulation of live refresh logic for the Coach
  useEffect(() => {
    // In a real production app, you'd call a real API here
    console.log("Next.js Client Logic: Fetching live prices on refresh...");
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(prices).map(([symbol, data]) => (
        <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg hover:bg-gray-800/30 transition">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{symbol} / USD</p>
          <p className={`text-2xl font-bold ${symbol === 'BTC' || symbol === 'ETH' ? 'text-[#f7931a]' : 'text-[#d4af37]'}`}>${data.price}</p>
          <p className={`text-sm font-bold ${data.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {data.change} <i className={`fas fa-arrow-${data.change.startsWith('+') ? 'up' : 'down'} text-[10px]`}></i>
          </p>
        </div>
      ))}
    </div>
  );
}
