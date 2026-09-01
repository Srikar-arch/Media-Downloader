import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, ShieldCheck, Lock, KeyRound } from 'lucide-react';
import { CookieModal } from '../home/CookieModal';
import { getCookieStatus } from '../../services/api';

export const Navbar: React.FC = () => {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkStatus = async () => {
    try {
      const res = await getCookieStatus();
      if (res && res.success) {
        setIsAuthenticated(res.authenticated);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                OmniMedia
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Universal Media Utility
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#platforms" className="hover:text-white transition-colors">
            Supported Platforms
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCookieModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isAuthenticated
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 shadow-sm'
            }`}
            title="YouTube Cloud Authentication Setup"
          >
            {isAuthenticated ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">YouTube Auth Active</span>
                <span className="sm:hidden">Auth ✅</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>YouTube Auth</span>
              </>
            )}
          </button>

          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Admin Dashboard"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      <CookieModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSuccess={() => checkStatus()}
      />
    </header>
  );
};
