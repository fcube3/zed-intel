"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "./LanguageContext";
import dailyIntel from "@/data/daily-intel.json";

export default function LivePriceTicker() {
  const { t } = useTranslation();
  const [prices, setPrices] = useState({
    XAU: { name: "Gold", price: "loading...", change: "...", color: "text-[#d4af37]" },
    XAG: { name: "Silver", price: "loading...", change: "...", color: "text-[#d4af37]" },
    BTC: { name: "BTC", price: "loading...", change: "...", color: "text-[#f7931a]" },
    ETH: { name: "ETH", price: "loading...", change: "...", color: "text-[#f7931a]" }
  });

  useEffect(() => {
    // Fetch function decoupled to prevent one failure blocking all
    const fetchMarkets = async () => {
      // 1. Fetch Metals
      try {
        const metalsRes = await fetch("https://data-asg.goldprice.org/dbXRates/USD");
        if (metalsRes.ok) {
          const metalsData = await metalsRes.json();
          const item = metalsData.items[0];
          
          // Use live change provided by API if available, else calc
          const goldChange = item.pcXau; // API provides percent change
          const silverChange = item.pcXag;

          setPrices(prev => ({
            ...prev,
            XAU: {
              ...prev.XAU,
              price: item.xauPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              change: (goldChange >= 0 ? "+" : "") + goldChange.toFixed(2) + "%"
            },
            XAG: {
              ...prev.XAG,
              price: item.xagPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              change: (silverChange >= 0 ? "+" : "") + silverChange.toFixed(2) + "%"
            }
          }));
        }
      } catch (e) {
        console.error("Metals fetch failed", e);
      }

      // 2. Fetch Crypto (Binance)
      try {
        const [btcRes, ethRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")
        ]);
        
        if (btcRes.ok && ethRes.ok) {
          const btcData = await btcRes.json();
          const ethData = await ethRes.json();

          setPrices(prev => ({
            ...prev,
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
        }
      } catch (e) {
        console.error("Crypto fetch failed", e);
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(prices).map(([symbol, data]) => (
        <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg hover:bg-gray-800/30 transition">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{data.name} / USD</p>
          <p className={`text-2xl font-bold ${data.color}`}>
            {data.price === "loading..." ? <span className="animate-pulse text-gray-600">...</span> : `$${data.price}`}
          </p>
          <p className={`text-sm font-bold ${data.change.startsWith('+') ? 'text-green-400' : data.change === '...' ? 'text-gray-500' : 'text-red-400'}`}>
            {data.change} <i className={`fas fa-arrow-${data.change.startsWith('+') ? 'up' : 'down'} text-[10px] ${data.change === '...' ? 'hidden' : ''}`}></i>
          </p>
        </div>
      ))}
    </div>
  );
}
