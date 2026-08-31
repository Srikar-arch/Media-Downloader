import React from 'react';
import {
  Zap,
  ShieldCheck,
  Layers,
  Trash2,
  Activity,
  Cpu,
  Smartphone,
  Lock,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      title: 'High-Throughput Streaming',
      desc: 'Never loads gigabyte media files into server memory. Memory-efficient streams pass data seamlessly to the user.',
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
    },
    {
      title: 'Active SSRF & Threat Defense',
      desc: 'Deep inspection blocks internal IP ranges, cloud metadata endpoints, decimal exploits, and hostile protocols.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'Automatic 30-Min TTL Cleanup',
      desc: 'Scheduled daemon cleans temporary processing files and caches every 5 minutes. No permanent video storage.',
      icon: <Trash2 className="w-5 h-5 text-purple-400" />,
    },
    {
      title: 'Real-Time SSE Progress Engine',
      desc: 'No aggressive API polling. Server-Sent Events push live speed, progress percentage, and time estimates directly.',
      icon: <Activity className="w-5 h-5 text-pink-400" />,
    },
    {
      title: 'Multi-Resolution & 4K Ready',
      desc: 'Full support for 4K Ultra HD (2160p), 2K (1440p), Full HD (1080p), and pure 320kbps audio extractions.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: 'Mobile-First Precision',
      desc: 'Optimized touch targets, clipboard paste accelerators, and responsive layouts crafted for one-handed phone use.',
      icon: <Smartphone className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <section id="features" className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Engineered For Production
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          Speed, Security & Scalability
        </h2>
        <p className="text-sm text-slate-400 mt-3">
          Built with enterprise-grade reliability to handle concurrent media operations without breaking a sweat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-start"
          >
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 w-fit mb-4 shadow-inner">
              {f.icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
