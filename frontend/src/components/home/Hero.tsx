import React from 'react';
import { Sparkles, Zap, Shield, Check } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-6 sm:pt-20 sm:pb-8 flex flex-col items-center text-center px-4 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-inner animate-pulse-glow">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Universal Media Retrieval Engine • Next-Gen Speed</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
        Download Media.{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          Fast. Simple. Secure.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
        Paste a supported video URL to automatically detect the source, inspect permitted formats, select crystal-clear resolutions, and download in seconds.
      </p>

      {/* Value Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-xs sm:text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>Auto Platform Detection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>Up to 4K Ultra HD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>Zero Server Retention</span>
        </div>
      </div>
    </section>
  );
};
