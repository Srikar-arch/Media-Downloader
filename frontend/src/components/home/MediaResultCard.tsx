import React, { useState } from 'react';
import {
  Download,
  Clock,
  User,
  Music,
  Video,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import type { AnalyzeResponse, MediaFormat } from '../../types';

interface MediaResultCardProps {
  data: AnalyzeResponse;
  onDownload: (formatId: string) => void;
  isDownloading: boolean;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  data,
  onDownload,
  isDownloading,
}) => {
  const { media, formats, platform, downloadPermitted, message } = data;

  // Separate video formats and audio formats
  const videoFormats = formats.filter((f) => f.type === 'video' || f.type === 'muxed');
  const audioFormats = formats.filter((f) => f.type === 'audio');

  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    videoFormats[0]?.formatId || audioFormats[0]?.formatId || ''
  );
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const selectedFormat = formats.find((f) => f.formatId === selectedFormatId);

  // Format duration in mm:ss or hh:mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size in MB/GB with intelligent fallback
  const formatFileSize = (fmt: { fileSize?: number; quality?: string; height?: number; type?: string }) => {
    if (fmt.fileSize && fmt.fileSize > 0) {
      const mb = fmt.fileSize / (1024 * 1024);
      if (mb >= 1000) return `~${(mb / 1024).toFixed(2)} GB`;
      return `~${mb.toFixed(1)} MB`;
    }
    const dur = media.duration || 210;
    const q = (fmt.quality || '').toLowerCase();
    let bitrateBps = 4500000;
    if (q.includes('2160') || q.includes('4k')) bitrateBps = 18000000;
    else if (q.includes('1440') || q.includes('2k')) bitrateBps = 8500000;
    else if (q.includes('1080')) bitrateBps = 4500000;
    else if (q.includes('720')) bitrateBps = 2200000;
    else if (q.includes('480')) bitrateBps = 1100000;
    else if (q.includes('360')) bitrateBps = 600000;
    else if (fmt.type === 'audio' || q.includes('mp3') || q.includes('m4a')) bitrateBps = 320000;

    const estimatedMb = (dur * bitrateBps) / (8 * 1024 * 1024);
    if (estimatedMb >= 1000) return `~${(estimatedMb / 1024).toFixed(2)} GB`;
    return `~${estimatedMb.toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop inside card */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: platform.color || '#6366f1' }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media Thumbnail & Info */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md aspect-video sm:aspect-[16/10] flex items-center justify-center group">
              {media.thumbnail ? (
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Video className="w-12 h-12 stroke-[1.5]" />
                  <span className="text-xs">No preview available</span>
                </div>
              )}

              {/* Duration badge */}
              {media.duration ? (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-mono font-medium flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatDuration(media.duration)}</span>
                </div>
              ) : null}

              {/* Platform badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                <span>{platform.icon}</span>
                <span>{platform.name}</span>
              </div>
            </div>

            {/* Title & Metadata */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
                {media.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-400">
                {media.creator && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {media.creatorUrl ? (
                      <a
                        href={media.creatorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        {media.creator}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="font-medium">{media.creator}</span>
                    )}
                  </div>
                )}

                {media.viewCount && (
                  <span>• {media.viewCount.toLocaleString()} views</span>
                )}
              </div>

              {media.description && (
                <p className="mt-3 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {media.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Format Picker & Quality Selector */}
          <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-8 pt-6 lg:pt-0">
            {downloadPermitted && formats.length > 0 ? (
              <div className="space-y-6">
                {/* Mode Selector Tabs (Video vs Audio) */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('video');
                      if (videoFormats[0]) setSelectedFormatId(videoFormats[0].formatId);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      activeTab === 'video'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Formats ({videoFormats.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('audio');
                      if (audioFormats[0]) setSelectedFormatId(audioFormats[0].formatId);
                    }}
                    disabled={audioFormats.length === 0}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                      activeTab === 'audio'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Audio Extraction ({audioFormats.length})</span>
                  </button>
                </div>

                {/* Available Quality Options Grid */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold text-slate-200">
                      {activeTab === 'video' ? 'Select Resolution & Quality' : 'Select Audio Bitrate'}
                    </span>
                    <span>{activeTab === 'video' ? 'MP4 Container' : 'High Bitrate'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(activeTab === 'video' ? videoFormats : audioFormats).map((fmt) => {
                      const isSelected = fmt.formatId === selectedFormatId;
                      return (
                        <button
                          key={fmt.formatId}
                          type="button"
                          onClick={() => setSelectedFormatId(fmt.formatId)}
                          className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 relative ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">
                              {fmt.quality || fmt.label}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {fmt.label}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-300/90 font-medium">
                            {formatFileSize(fmt)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Details Summary */}
                {selectedFormat && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="text-slate-400">Selected Output</div>
                      <div className="font-semibold text-white">
                        {selectedFormat.label} ({selectedFormat.quality}) • {selectedFormat.container.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Estimated Size</div>
                      <div className="font-mono font-bold text-indigo-300 text-sm">
                        {formatFileSize(selectedFormat)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Download CTA */}
                <button
                  type="button"
                  onClick={() => selectedFormatId && onDownload(selectedFormatId)}
                  disabled={!selectedFormatId || isDownloading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    {activeTab === 'video'
                      ? `Download Video (${selectedFormat?.quality || 'Selected'})`
                      : `Download Audio (${selectedFormat?.quality || 'MP3'})`}
                  </span>
                </button>
              </div>
            ) : (
              /* Graceful Compliance & Legal Message when platform does not permit download */
              <div className="h-full flex flex-col justify-center items-center text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Platform Download Unavailable
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                    {message || `${platform.name} does not permit direct downloading through its public API.`} We strictly adhere to platform policies and do not bypass DRM, paywalls, or authentication restrictions.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Metadata & oEmbed analysis retrieved successfully.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
