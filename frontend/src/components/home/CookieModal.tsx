import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, X, ExternalLink, ShieldCheck, Copy } from 'lucide-react';
import { saveCookies } from '../../services/api';

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CookieModal: React.FC<CookieModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [cookieText, setCookieText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!cookieText.trim()) {
      setStatus('error');
      setMessage('Please paste your cookies text.');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const res = await saveCookies(cookieText.trim());
      if (res.success) {
        setStatus('success');
        setMessage('YouTube session authenticated successfully! All downloads unlocked.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(res.message || 'Failed to save cookies.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to save cookies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">YouTube Cloud Authentication</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Unlock 100% unrestricted YouTube downloads on cloud servers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Quick Steps Guide */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            Quick 15-Second Setup:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <li>
              Install the free extension{' '}
              <a
                href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Get cookies.txt LOCALLY <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Open YouTube in your browser (logged in).</li>
            <li>Click the extension, export/copy cookies, and paste below:</li>
          </ol>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Paste cookies.txt content:
          </label>
          <textarea
            rows={4}
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
            placeholder="# Netscape HTTP Cookie File&#10;.youtube.com&#9;TRUE&#9;/&#9;TRUE&#9;...&#9;SAPISID&#9;..."
            className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none transition-all"
          />
        </div>

        {/* Status Message */}
        {status === 'error' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : 'Save & Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
};
