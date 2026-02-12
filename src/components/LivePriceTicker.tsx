"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "./LanguageContext";
import dailyIntel from "@/data/daily-intel.json"; // Import baseline for calc

export default function LivePriceTicker() {
  const { t } = useTranslation();
  const [prices, setPrices] = useState({
    XAU: { name: "Gold", price: "loading...", change: "...", color: "text-[#d4af37]" },
    XAG: { name: "Silver", price: "loading...", change: "...", color: "text-[#d4af37]" },
    BTC: { name: "BTC", price: "loading...", change: "...", color: "text-[#f7931a]" },
    ETH: { name: "ETH", price: "loading...", change: "...", color: "text-[#f7931a]" }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [btcRes, ethRes, metalsRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT"),
          fetch("https://data-asg.goldprice.org/dbXRates/USD")
        ]);

        const btcData = await btcRes.json();
        const ethData = await ethRes.json();
        const metalsData = await metalsRes.json();

        const goldPrice = metalsData.items[0].xauPrice;
        const silverPrice = metalsData.items[0].xagPrice;

        // Calculate approx change vs the daily-intel snapshot (acting as our "Open" or "Ref")
        // accurate enough for a dashboard pulse
        const goldRef = dailyIntel.prices.gold; 
        const silverRef = dailyIntel.prices.silver;
        
        const goldChange = ((goldPrice - goldRef) / goldRef) * 100;
        const silverChange = ((silverPrice - silverRef) / silverRef) * 100;

        setPrices(prev => ({
          ...prev,
          XAU: {
            ...prev.XAU,
            price: goldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            change: (goldChange >= 0 ? "+" : "") + goldChange.toFixed(2) + "%"
          },
          XAG: {
            ...prev.XAG,
            price: silverPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            change: (silverChange >= 0 ? "+" : "") + silverChange.toFixed(2) + "%"
          },
          BTC: { 
            ...prev.BTC, 
            price: parseFloat(btcData.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }), 
            change: (parseFloat(btcData.priceChangePercent) >= 0 ? "+" : "") + btcData.priceChangePercent + "%" 
          },
          ETH: { 
            ...prev.ETH, 
            price: parseFloat(ethData.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }), 
            change: (parseFloat(ethData.priceChangePercent) >= 0 ? "+" : "") + ethData.priceChangePercent + "%" 
          }
        }));
      } catch (e) {
        console.error("Market data fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(prices).map(([symbol, data]) => (
        <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg hover:bg-gray-800/30 transition">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{data.name} / USD</p>
          <p className={`text-2xl font-bold ${data.color}`}>
            {data.price === "loading..." ? <span className="animate-pulse">...</span> : `$${data.price}`}
          </p>
          <p className={`text-sm font-bold ${data.change.startsWith('+') ? 'text-green-400' : data.change === '...' ? 'text-gray-500' : 'text-red-400'}`}>
            {data.change} <i className={`fas fa-arrow-${data.change.startsWith('+') ? 'up' : 'down'} text-[10px] ${data.change === '...' ? 'hidden' : ''}`}></i>
          </p>
        </div>
      ))}
    </div>
  );
}
