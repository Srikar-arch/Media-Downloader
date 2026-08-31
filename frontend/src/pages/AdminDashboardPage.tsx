import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  RefreshCw,
  LogOut,
  Search,
  Filter,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminJobs,
  fetchAdminSystem,
  fetchAdminEvents,
  clearAdminToken,
} from '../services/api';
import type {
  AdminStats,
  DownloadJobRecord,
  SystemHealth,
  SystemEvent,
} from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [system, setSystem] = useState<SystemHealth | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [jobs, setJobs] = useState<DownloadJobRecord[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'system' | 'events'>('jobs');
  const navigate = useNavigate();

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setRefreshing(true);

    try {
      const [statsRes, jobsRes, sysRes, eventsRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminJobs({ page, limit: 15, status: statusFilter || undefined, search: searchQuery || undefined }),
        fetchAdminSystem(),
        fetchAdminEvents(30),
      ]);

      setStats(statsRes.stats);
      setJobs(jobsRes.jobs);
      setTotalJobs(jobsRes.total);
      setTotalPages(jobsRes.totalPages);
      setSystem(sysRes.system);
      setEvents(eventsRes.events);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('token')) {
        clearAdminToken();
        navigate('/admin');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [page, statusFilter, searchQuery]);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin');
  };

  // Helper to format bytes
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Format uptime
  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.floor(seconds)}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Operational Control Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, queue monitoring, ephemeral storage usage, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 my-8">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Total Jobs</span>
              <Download className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{stats.totalDownloads}</div>
            <span className="text-[10px] text-slate-500">All-time processed</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Active Queue</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats.activeJobs}</div>
            <span className="text-[10px] text-slate-500">Currently executing</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.completedJobs}</div>
            <span className="text-[10px] text-slate-500">Delivered successfully</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Failed / Cancel</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">{stats.failedJobs + stats.cancelledJobs}</div>
            <span className="text-[10px] text-slate-500">Errors or cancellations</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Temp Storage</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300 font-mono">
              {formatBytes(stats.systemHealth?.tempStorageBytes)}
            </div>
            <span className="text-[10px] text-slate-500">TTL auto-cleaned</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase">Uptime</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono">
              {formatUptime(stats.systemHealth?.uptime)}
            </div>
            <span className="text-[10px] text-slate-500">Continuous operation</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'jobs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Download Jobs ({totalJobs})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'system'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          System & Worker Health
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Logs ({events.length})
        </button>
      </div>

      {/* TAB 1: Jobs Table */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job ID or URL…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="queued">Queued</option>
                <option value="downloading">Downloading</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Job ID</th>
                  <th className="p-3.5">Platform</th>
                  <th className="p-3.5">Source URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">File Size</th>
                  <th className="p-3.5">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {jobs.length > 0 ? (
                  jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 text-indigo-300 font-bold">{j.id}</td>
                      <td className="p-3.5 uppercase text-slate-300 font-sans">{j.platform}</td>
                      <td className="p-3.5 max-w-xs truncate text-slate-400 font-sans" title={j.source_url}>
                        {j.source_url}
                      </td>
                      <td className="p-3.5 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : j.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : j.status === 'cancelled'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{j.progress}%</td>
                      <td className="p-3.5 text-slate-400">{formatBytes(j.file_size || 0)}</td>
                      <td className="p-3.5 text-slate-500 text-[11px] font-sans">
                        {new Date(j.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      No jobs match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: System Health */}
      {activeTab === 'system' && system && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Node & Runtime Environment</span>
            </h3>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Node Version:</span>
                <span>{system.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">OS Architecture:</span>
                <span>{system.platform} ({system.arch})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Heap Used:</span>
                <span className="text-indigo-300">{formatBytes(system.memory.heapUsed)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">RSS Memory:</span>
                <span>{formatBytes(system.memory.rss)}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Storage & Daemon Metrics</span>
            </h3>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Temp File Directory:</span>
                <span>./data/temp</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Active Temp Storage:</span>
                <span className="text-purple-300">{formatBytes(system.tempStorage.bytesUsed)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">File TTL Expiration:</span>
                <span>30 Minutes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Cleanup Frequency:</span>
                <span>Every 5 Minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Event Logs */}
      {activeTab === 'events' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>System Event Stream</span>
            </span>
            <span className="text-[11px] text-slate-400">Last 7 Days Retained</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {events.map((evt) => (
              <div key={evt.id} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] font-semibold">
                    {evt.event_type}
                  </span>
                  <span className="text-slate-300 font-mono text-[11px] truncate max-w-xl">
                    {evt.details || 'No details provided'}
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[10px] shrink-0">
                  {new Date(evt.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
