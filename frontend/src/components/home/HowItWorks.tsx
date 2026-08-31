import React from 'react';
import { Link2, Sliders, Cpu, Download, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Paste URL',
      description: 'Copy and paste any video or audio link from supported public sources. Platform is detected instantly.',
      icon: <Link2 className="w-6 h-6 text-indigo-400" />,
      tag: 'Auto Detection',
    },
    {
      number: '02',
      title: 'Analyze Stream',
      description: 'The engine parses authorized video codecs, resolutions up to 4K Ultra HD, and pure audio bitrates.',
      icon: <Sliders className="w-6 h-6 text-purple-400" />,
      tag: 'Multi-Quality',
    },
    {
      number: '03',
      title: 'Stream Processing',
      description: 'A dedicated worker streams and packages the media efficiently without loading entire files into memory.',
      icon: <Cpu className="w-6 h-6 text-pink-400" />,
      tag: 'Zero Bottlenecks',
    },
    {
      number: '04',
      title: 'Instant Download',
      description: 'Track real-time SSE progress and receive your high-speed download automatically in your browser.',
      icon: <Download className="w-6 h-6 text-emerald-400" />,
      tag: 'Real-Time SSE',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          Streamlined Workflow
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          How OmniMedia Works
        </h2>
        <p className="text-sm text-slate-400 mt-3">
          A modern 4-step pipeline designed for lightning-fast media retrieval and privacy by default.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className="glass-panel glass-panel-hover rounded-3xl p-6 relative flex flex-col justify-between group border border-slate-800"
          >
            <div>
              {/* Top Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-inner group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <span className="text-3xl font-extrabold text-slate-700/60 font-mono">
                  {step.number}
                </span>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
            </div>

            {/* Bottom Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300">
                {step.tag}
              </span>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:inline" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
