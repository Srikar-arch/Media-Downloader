import React from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  Gauge,
  Timer,
  FileCheck,
} from 'lucide-react';
import type { JobStatus } from '../../types';

interface DownloadProgressModalProps {
  isOpen: boolean;
  status: JobStatus | null;
  progress: number;
  speed?: number;
  eta?: number;
  errorMessage?: string | null;
  onCancel: () => void;
  onClose: () => void;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  isOpen,
  status,
  progress,
  speed,
  eta,
  errorMessage,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isTerminal = isCompleted || isFailed || isCancelled;

  // Format speed in MB/s or KB/s
  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec) return null;
    const mb = bytesPerSec / (1024 * 1024);
    if (mb > 1) return `${mb.toFixed(1)} MB/s`;
    const kb = bytesPerSec / 1024;
    return `${kb.toFixed(0)} KB/s`;
  };

  // Format seconds into ETA
  const formatEta = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Status headline & subtext
  const getStatusDetails = () => {
    switch (status) {
      case 'queued':
        return {
          title: 'Initializing Queue…',
          desc: 'Assigning a high-speed media processing worker.',
          icon: <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />,
        };
      case 'analyzing':
        return {
          title: 'Analyzing Stream…',
          desc: 'Validating media signatures and permitted streams.',
          icon: <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />,
        };
      case 'downloading':
        return {
          title: 'Retrieving Media Stream…',
          desc: 'Streaming authorized chunks directly through worker pool.',
          icon: <Download className="w-6 h-6 text-indigo-400 animate-bounce" />,
        };
      case 'processing':
        return {
          title: 'Finalizing Package…',
          desc: 'Packaging container metadata and verifying integrity.',
          icon: <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />,
        };
      case 'completed':
        return {
          title: 'Download Ready!',
          desc: 'Your browser has initiated the file transfer automatically.',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
        };
      case 'cancelled':
        return {
          title: 'Download Cancelled',
          desc: 'The job was stopped and temporary files were cleaned.',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
        };
      case 'failed':
      default:
        return {
          title: 'Processing Failed',
          desc: errorMessage || 'An error occurred during media retrieval.',
          icon: <XCircle className="w-6 h-6 text-rose-400" />,
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative space-y-6">
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              {details.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{details.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{details.desc}</p>
            </div>
          </div>

          {isTerminal && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-medium">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">
              {status || 'Processing'}
            </span>
            <span className="text-indigo-300 font-bold">{progress}%</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 relative ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.max(progress, 5)}%` }}
            >
              {!isTerminal && (
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Metrics Row (Speed & ETA) */}
        {!isTerminal && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Speed</div>
                <div className="font-mono text-slate-200 font-medium">
                  {formatSpeed(speed) || 'Streaming…'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <Timer className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Remaining</div>
                <div className="font-mono text-slate-200 font-medium">
                  {formatEta(eta) || 'Calculating…'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex items-center gap-3">
          {!isTerminal ? (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Cancel Download
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
