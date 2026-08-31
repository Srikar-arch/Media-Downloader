import React, { useState, useEffect, useRef } from 'react';
import { Link2, Sparkles, X, ArrowRight, AlertCircle, CheckCircle2, Clipboard } from 'lucide-react';
import { useUrlDetection, type DetectedPlatform } from '../../hooks/useUrlDetection';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  onClear: () => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading, onClear }) => {
  const [url, setUrl] = useState('');
  const [justPasted, setJustPasted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { detectedPlatform, isValidUrl } = useUrlDetection(url);

  // Auto-paste detection via clipboard API
  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
      }
    } catch {
      // Fallback: focus input so user can Cmd+V
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyze(url.trim());
  };

  const handleClear = () => {
    setUrl('');
    onClear();
    inputRef.current?.focus();
  };

  // Demo sample loader
  const handleLoadDemo = () => {
    const demoUrl = 'https://demo.mediadownloader.test/video/big-buck-bunny';
    setUrl(demoUrl);
    onAnalyze(demoUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass-input rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-2xl transition-all border border-slate-700/60 focus-within:border-indigo-500/80">
          {/* Input field */}
          <div className="relative flex-1 w-full flex items-center pl-3 pr-2">
            <Link2 className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL here (YouTube, Vimeo, TikTok, Instagram, X...)"
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none py-2"
              disabled={isLoading}
            />

            {/* Clear Button */}
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-1"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Quick Paste Button if empty */}
            {!url && (
              <button
                type="button"
                onClick={handlePasteClick}
                className="hidden sm:flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all shrink-0"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Analyze CTA Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform active:scale-98 shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Real-time URL Detection Feedback Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
          {/* Detected Platform Tag */}
          <div className="flex items-center gap-2">
            {detectedPlatform ? (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${detectedPlatform.badgeBg} ${detectedPlatform.badgeBorder} ${detectedPlatform.badgeText} font-medium animate-fadeIn`}
              >
                <span className="text-sm">{detectedPlatform.icon}</span>
                <span>{detectedPlatform.name} URL detected ✓</span>
              </div>
            ) : url.trim().length > 4 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Custom / Unsupported media URL</span>
              </div>
            ) : (
              <span className="text-slate-500">Supports YouTube, Vimeo, TikTok, Instagram, Facebook, X</span>
            )}

            {justPasted && (
              <span className="text-emerald-400 font-medium animate-fadeIn">
                Pasted from clipboard!
              </span>
            )}
          </div>

          {/* Quick Demo Trigger */}
          <button
            type="button"
            onClick={handleLoadDemo}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try sample 4K demo video</span>
          </button>
        </div>
      </form>
    </div>
  );
};
