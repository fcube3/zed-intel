"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "./LanguageContext";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function AssetSelector() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("OANDA:XAUUSD");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => loadWidget(selected);
    document.head.appendChild(script);
  }, []);

  const loadWidget = (symbol: string) => {
    if (window.TradingView) {
      new window.TradingView.widget({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tv_chart_container"
      });
    }
  };

  const assets = [
    { name: "Gold", symbol: "OANDA:XAUUSD" },
    { name: "Silver", symbol: "OANDA:XAGUSD" },
    { name: "BTC", symbol: "BINANCE:BTCUSDT" },
    { name: "ETH", symbol: "BINANCE:ETHUSDT" }
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h2 className="text-xl font-bold flex items-center uppercase tracking-widest text-white">
          <i className="fas fa-chart-line mr-3 text-[#F5A623]"></i> {t.chartTitle}
        </h2>
        <div className="flex space-x-6 text-[10px] font-black tracking-widest">
          {assets.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => {
                setSelected(asset.symbol);
                loadWidget(asset.symbol);
              }}
              className={`pb-1 uppercase transition ${selected === asset.symbol ? 'border-b-2 border-[#F5A623] text-[#F5A623]' : 'text-gray-500 hover:text-white'}`}
            >
              {asset.name}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] overflow-hidden h-[550px] shadow-2xl rounded-lg text-white">
        <div id="tv_chart_container" className="h-full w-full"></div>
      </div>
    </section>
  );
}
