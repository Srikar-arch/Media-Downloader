import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const Faq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does OmniMedia bypass DRM, paywalls, or private account restrictions?',
      a: 'No. OmniMedia strictly complies with applicable laws and platform policies. We do not provide DRM circumvention, authentication tampering, or paywall bypassing. When a platform restricts direct downloading through its API, we report the limitation gracefully and only display permitted metadata/oEmbed information.',
    },
    {
      q: 'What video resolutions and audio formats are supported?',
      a: 'We support resolutions from 360p up to 4K Ultra HD (2160p) and 60 FPS where permitted by the media source. For audio extraction, we offer high-fidelity MP3 (up to 320 kbps) and M4A/AAC (256 kbps) containers with accurate bitrate estimates.',
    },
    {
      q: 'How does real-time download progress work?',
      a: 'Rather than hammering the backend with repetitive polling requests, OmniMedia establishes a lightweight Server-Sent Events (SSE) stream. This pushes live processing percentages, transfer speeds, and estimated remaining time directly to your browser.',
    },
    {
      q: 'How long are temporary files kept on the server?',
      a: 'All temporary download files are automatically wiped after 30 minutes by our scheduled cleanup daemon. We never retain, archive, or build profiles on the media you process.',
    },
    {
      q: 'Can I use this utility on iOS and Android devices?',
      a: 'Yes. OmniMedia is designed mobile-first with one-handed touch controls, clipboard paste integration, and responsive layout scaling across all smartphone and tablet displays.',
    },
    {
      q: 'How can developers add new media providers to OmniMedia?',
      a: 'The backend uses an extensible Provider/Adaptor architecture. Developers simply subclass the abstract `MediaProvider` class and implement `canHandle()`, `validate()`, `getMetadata()`, and `getAvailableFormats()`.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 px-4 max-w-4xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          Got Questions?
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-slate-400 mt-3">
          Everything you need to know about our universal media retrieval architecture.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 text-slate-200 hover:text-white font-semibold text-sm sm:text-base cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
