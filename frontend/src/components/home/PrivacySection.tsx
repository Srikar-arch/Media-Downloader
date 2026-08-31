import React from 'react';
import { Shield, Lock, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';

export const PrivacySection: React.FC = () => {
  return (
    <section id="privacy" className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-900">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden bg-gradient-to-b from-slate-900/60 via-slate-950/80 to-slate-950">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero Knowledge Architecture</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Privacy is Our Core Principle
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Unlike typical downloader websites filled with aggressive trackers, malware, and data profiling, OmniMedia is engineered as a clean, private utility.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ephemeral File Storage</h4>
                  <p className="text-[11px] text-slate-400">
                    Temporary processing files are automatically wiped after 30 minutes. We never permanently store downloaded media.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">No Tracking or Data Selling</h4>
                  <p className="text-[11px] text-slate-400">
                    URLs are processed solely to fulfill your active request. We never sell, log, or commercialize your activity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Anonymous Client Sessions</h4>
                  <p className="text-[11px] text-slate-400">
                    No forced user accounts or cookie tracking. Every session is completely anonymous.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphic Side */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-300">Privacy Status</span>
                <span className="text-xs font-bold text-emerald-400">100% Guaranteed</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Data Retention:</span>
                  <span className="text-indigo-300">0 Days (30 min TTL)</span>
                </div>
                <div className="flex justify-between">
                  <span>Tracking Cookies:</span>
                  <span className="text-emerald-400">0 Detected</span>
                </div>
                <div className="flex justify-between">
                  <span>Ad Trackers:</span>
                  <span className="text-emerald-400">0 Present</span>
                </div>
                <div className="flex justify-between">
                  <span>Encryption:</span>
                  <span className="text-indigo-300">TLS 1.3 End-to-End</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All URL parameters sanitized before request execution.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
