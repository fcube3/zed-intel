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
    const fetchMarkets = async () => {
      // 1. Fetch Metals via Proxy
      try {
        const metalsRes = await fetch("/api/prices");
        if (metalsRes.ok) {
          const metalsData = await metalsRes.json();
          if (metalsData.items && metalsData.items.length > 0) {
            const item = metalsData.items[0];
            const goldChange = item.pcXau;
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
        }
      } catch (e) {
        console.error("Metals proxy fetch failed", e);
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
    <div className="grid grid-cols-4 gap-8 mb-20 border-t border-b border-[#27272a] py-8">
      {Object.entries(prices).map(([symbol, data]) => (
        <div key={symbol} className="flex flex-col pl-4 border-l border-[#27272a] first:border-l-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#52525b] mb-2">{data.name} / USD</span>
          <div className="flex items-baseline space-x-3">
             <span className="text-3xl font-medium tracking-tight text-white">
                {data.price === "loading..." ? <span className="animate-pulse text-[#27272a]">...</span> : `$${data.price}`}
             </span>
             <span className={`text-xs font-mono font-bold ${data.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {data.change}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
}
