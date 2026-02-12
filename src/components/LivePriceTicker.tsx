"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "./LanguageContext";

export default function LivePriceTicker() {
  const { t } = useTranslation();
  const [prices, setPrices] = useState({
    XAU: { name: "Gold", price: "5,088.60", change: "+0.41%", color: "text-[#d4af37]" },
    XAG: { name: "Silver", price: "83.03", change: "+0.59%", color: "text-[#d4af37]" },
    BTC: { name: "BTC", price: "loading...", change: "...", color: "text-[#f7931a]" },
    ETH: { name: "ETH", price: "loading...", change: "...", color: "text-[#f7931a]" }
  });

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const [btcRes, ethRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")
        ]);
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
      } catch (e) {
        console.error("Crypto fetch failed", e);
      }
    };

    fetchCrypto();
    const interval = setInterval(fetchCrypto, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(prices).map(([symbol, data]) => (
        <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg hover:bg-gray-800/30 transition">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{data.name} / USD</p>
          <p className={`text-2xl font-bold ${data.color}`}>${data.price}</p>
          <p className={`text-sm font-bold ${data.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {data.change} <i className={`fas fa-arrow-${data.change.startsWith('+') ? 'up' : 'down'} text-[10px]`}></i>
          </p>
        </div>
      ))}
    </div>
  );
}
