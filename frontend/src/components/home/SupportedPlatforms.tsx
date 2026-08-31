import React from 'react';
import { Check, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const SupportedPlatforms: React.FC = () => {
  const platforms = [
    {
      name: 'Vimeo',
      slug: 'vimeo',
      icon: '🎬',
      color: '#1AB7EA',
      resolutions: '4K • 1080p • 720p • 480p',
      downloadSupport: 'Permitted (Public Videos)',
      audioSupport: 'Available',
      status: 'Fully Enabled',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Full streaming and multi-resolution downloads for videos marked downloadable by authors.',
    },
    {
      name: 'YouTube',
      slug: 'youtube',
      icon: '📺',
      color: '#FF0000',
      resolutions: '4K • 1080p • 720p',
      downloadSupport: 'Metadata / oEmbed Only',
      audioSupport: 'Restricted',
      status: 'Compliant Mode',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Authoritative metadata inspection, thumbnail retrieval, and duration analytics via official oEmbed.',
    },
    {
      name: 'Instagram',
      slug: 'instagram',
      icon: '📸',
      color: '#E4405F',
      resolutions: 'Reels & Posts',
      downloadSupport: 'Metadata / Embeds',
      audioSupport: 'Restricted',
      status: 'Compliant Mode',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Structured metadata and publisher verification for public reels and video posts.',
    },
    {
      name: 'TikTok',
      slug: 'tiktok',
      icon: '🎵',
      color: '#EE1D52',
      resolutions: '1080p • 720p',
      downloadSupport: 'Metadata / oEmbed',
      audioSupport: 'Restricted',
      status: 'Compliant Mode',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Instant creator attribution, video title extraction, and sound analysis for viral clips.',
    },
    {
      name: 'Facebook',
      slug: 'facebook',
      icon: '📘',
      color: '#1877F2',
      resolutions: 'HD • SD',
      downloadSupport: 'Metadata / Watch',
      audioSupport: 'Restricted',
      status: 'Compliant Mode',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Validates public watch URLs and reels with platform-compliant data parsing.',
    },
    {
      name: 'X (Twitter)',
      slug: 'x',
      icon: '🐦',
      color: '#CBD5E1',
      resolutions: 'MP4 Videos & GIFs',
      downloadSupport: 'Publish API / oEmbed',
      audioSupport: 'Restricted',
      status: 'Compliant Mode',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Full tweet metadata and author inspection using standard publish endpoints.',
    },
  ];

  return (
    <section id="platforms" className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
          Provider Ecosystem
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          Supported Platforms & Policy
        </h2>
        <p className="text-sm text-slate-400 mt-3">
          Engineered around a modular adaptor architecture with strict adherence to platform Terms of Service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <div
            key={p.slug}
            className="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="font-bold text-base text-white">{p.name}</h3>
                    <span className="text-[10px] text-slate-400">{p.resolutions}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.statusColor}`}
                >
                  {p.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {p.description}
              </p>
            </div>

            {/* Capability Checklist */}
            <div className="pt-4 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Download Capability</span>
                <span className="font-medium">{p.downloadSupport}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Audio Stream</span>
                <span className="font-medium">{p.audioSupport}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Guarantee Banner */}
      <div className="mt-12 p-6 rounded-3xl bg-indigo-950/30 border border-indigo-500/20 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-white">Extensible Architecture:</span> New media providers can be plugged in seamlessly by implementing our unified <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded">MediaProvider</code> interface.
        </div>
      </div>
    </section>
  );
};
