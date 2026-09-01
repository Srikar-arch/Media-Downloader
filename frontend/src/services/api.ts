import type {
  AnalyzeResponse,
  PlatformInfo,
  AdminStats,
  DownloadJobRecord,
  SystemHealth,
  SystemEvent,
  JobProgressUpdate,
} from '../types';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = RAW_BASE
  ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`)
  : '/api';

// Generate or retrieve persistent anonymous session ID
export function getSessionId(): string {
  let id = localStorage.getItem('omni_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('omni_session_id', id);
  }
  return id;
}

// Admin Token helper
export function getAdminToken(): string | null {
  return localStorage.getItem('omni_admin_token');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('omni_admin_token', token);
}

export function clearAdminToken(): void {
  localStorage.removeItem('omni_admin_token');
}

// Base Fetch Helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getAdminToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data?.error?.message || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data as T;
}

// Media API
export async function analyzeMedia(url: string): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>('/media/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function createDownload(url: string, formatId: string, mediaTitle?: string): Promise<{ success: boolean; job: { id: string; status: string; progress: number } }> {
  return request('/downloads', {
    method: 'POST',
    body: JSON.stringify({
      url,
      formatId,
      sessionId: getSessionId(),
      mediaTitle,
    }),
  });
}

export async function getJobStatus(jobId: string): Promise<{ success: boolean; job: DownloadJobRecord }> {
  return request(`/downloads/${jobId}`);
}

export async function cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
  return request(`/downloads/${jobId}/cancel`, {
    method: 'POST',
  });
}

export function getDownloadFileUrl(jobId: string): string {
  return `${API_BASE}/downloads/${jobId}/file`;
}

export async function fetchPlatforms(): Promise<{ success: boolean; platforms: PlatformInfo[] }> {
  return request<{ success: boolean; platforms: PlatformInfo[] }>('/platforms');
}

export async function getCookieStatus(): Promise<{ success: boolean; authenticated: boolean }> {
  return request<{ success: boolean; authenticated: boolean }>('/media/cookies/status');
}

export async function saveCookies(cookies: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/media/cookies', {
    method: 'POST',
    body: JSON.stringify({ cookies }),
  });
}

// SSE listener for real-time progress
export function subscribeToJob(
  jobId: string,
  onUpdate: (update: JobProgressUpdate) => void,
  onError?: (error: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/downloads/${jobId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
      if (['completed', 'failed', 'cancelled', 'expired'].includes(data.status)) {
        eventSource.close();
      }
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

// Admin APIs
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token: string }> {
  const res = await request<{ success: boolean; token: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.token) {
    setAdminToken(res.token);
  }
  return res;
}

export async function fetchAdminStats(): Promise<{ success: boolean; stats: AdminStats }> {
  return request('/admin/stats');
}

export async function fetchAdminJobs(params: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  search?: string;
}): Promise<{
  success: boolean;
  jobs: DownloadJobRecord[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.platform) searchParams.set('platform', params.platform);
  if (params.search) searchParams.set('search', params.search);

  return request(`/admin/jobs?${searchParams.toString()}`);
}

export async function fetchAdminSystem(): Promise<{ success: boolean; system: SystemHealth }> {
  return request('/admin/system');
}

export async function fetchAdminEvents(limit: number = 50): Promise<{ success: boolean; events: SystemEvent[] }> {
  return request(`/admin/events?limit=${limit}`);
}
