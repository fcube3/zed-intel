"use client";
import React from "react";
import { useTranslation } from "./LanguageContext";

interface Props {
  data: any;
}

export default function StaticPriceTicker({ data }: Props) {
  const { t } = useTranslation();
  
  if (!data) return null;

  const prices = {
    XAU: { name: "Gold", price: data.gold, change: "+0.41%", color: "text-[#d4af37]" },
    XAG: { name: "Silver", price: data.silver, change: "+0.59%", color: "text-[#d4af37]" },
    BTC: { name: "BTC", price: data.btc, change: "-1.10%", color: "text-[#f7931a]" },
    ETH: { name: "ETH", price: data.eth, change: "-0.30%", color: "text-[#f7931a]" }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 opacity-90 grayscale-[20%]">
      {Object.entries(prices).map(([symbol, item]) => (
        <div key={symbol} className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{item.name} / USD</p>
          <p className={`text-2xl font-bold ${item.color}`}>${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">EOD FIX</p>
        </div>
      ))}
    </div>
  );
}
