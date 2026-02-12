"use client";
import React from 'react';

export default function DesignLab() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold mb-2">Zed Pixel / Design Lab</h1>
        <p className="text-gray-400 mb-12">Aesthetic prototypes for the next generation of Zed Intelligence.</p>
        
        <div className="grid md:grid-cols-3 gap-8">
            <a href="/design-lab/glass" className="group block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500 transition duration-300">
                <div className="h-40 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center group-hover:scale-105 transition duration-500">
                    <span className="text-4xl">💎</span>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition">Institutional Glass</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        High-end fintech aesthetic. Frosted glass, deep gradients, refined typography. The evolution of the current look.
                    </p>
                </div>
            </a>

            <a href="/design-lab/cyber" className="group block bg-black border border-gray-800 rounded-2xl overflow-hidden hover:border-[#00ff41] transition duration-300">
                <div className="h-40 bg-black flex items-center justify-center relative group-hover:scale-105 transition duration-500">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    <span className="text-4xl relative z-10">📟</span>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 group-hover:text-[#00ff41] transition font-mono">CYBER_SIGNAL</h2>
                    <p className="text-xs text-gray-500 leading-relaxed font-mono">
                        High-frequency terminal vibe. Monospaced data, neon accents, raw data density.
                    </p>
                </div>
            </a>

            <a href="/design-lab/minimal" className="group block bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-white transition duration-300">
                <div className="h-40 bg-white flex items-center justify-center group-hover:scale-105 transition duration-500">
                    <span className="text-4xl text-black">🗞️</span>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 group-hover:text-white transition text-zinc-300">Swiss Minimal</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Editorial print style. High contrast, heavy typography, zero clutter. Information first.
                    </p>
                </div>
            </a>
        </div>
        
        <div className="mt-12 text-center">
            <a href="/" className="text-xs text-gray-600 hover:text-white transition uppercase tracking-widest">← Return to Production</a>
        </div>
      </div>
    </main>
  );
}
