import React from 'react';
import { Download, Shield, Heart, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-sm mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Statement */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-md">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-white">OmniMedia</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Production Suite
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A high-performance media utility engineered for fast, secure retrieval and processing of authorized public video and audio streams. Zero retention, fully encrypted, and built with strict adherence to platform standards.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Strict compliance: No DRM circumvention or paywall bypassing.</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#platforms" className="hover:text-indigo-400 transition-colors">
                  Supported Platforms
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-400 transition-colors">
                  Speed & Security
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-indigo-400 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              System & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                  <span>Admin Portal</span>
                </Link>
              </li>
              <li>
                <span className="text-slate-500">API Health: <span className="text-emerald-400">99.99%</span></span>
              </li>
              <li>
                <span className="text-slate-500">TTL File Deletion: <span className="text-indigo-300">30 min auto</span></span>
              </li>
              <li>
                <span className="text-slate-500">SSRF Protection: <span className="text-emerald-400">Active</span></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniMedia. Built for authorized public media access.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>WCAG 2.1 AA Accessible</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Log Policy</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
