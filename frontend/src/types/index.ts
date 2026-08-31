export interface PlatformInfo {
  name: string;
  slug: string;
  icon: string;
  color: string;
  supportedFeatures: {
    metadata: boolean;
    download: boolean;
    audioExtraction: boolean;
  };
}

export interface MediaMetadata {
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  creator?: string;
  creatorUrl?: string;
  platform: string;
  platformSlug: string;
  sourceUrl: string;
  uploadDate?: string;
  viewCount?: number;
  width?: number;
  height?: number;
}

export interface MediaFormat {
  formatId: string;
  label: string;
  quality: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  container: string;
  codec?: string;
  fileSize?: number;
  bitrate?: number;
  type: 'video' | 'audio' | 'muxed';
  downloadUrl?: string;
  isPermitted: boolean;
}

export interface AnalyzeResponse {
  success: boolean;
  platform: PlatformInfo;
  media: MediaMetadata;
  formats: MediaFormat[];
  downloadPermitted: boolean;
  message?: string;
}

export type JobStatus =
  | 'queued'
  | 'analyzing'
  | 'downloading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface JobProgressUpdate {
  jobId: string;
  status: JobStatus;
  progress: number;
  speed?: number;
  eta?: number;
  processedBytes?: number;
  totalBytes?: number;
  message?: string;
  fileName?: string;
  fileSize?: number;
}

export interface DownloadJobRecord {
  id: string;
  session_id: string;
  platform: string;
  source_url: string;
  requested_format: string | null;
  requested_quality: string | null;
  status: JobStatus;
  progress: number;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  completed_at: string | null;
}

export interface AdminStats {
  totalDownloads: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  platformBreakdown: Record<string, number>;
  recentJobs: DownloadJobRecord[];
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    tempStorageBytes: number;
    queueLength: number;
  };
}

export interface SystemHealth {
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  tempStorage: {
    bytesUsed: number;
  };
  nodeVersion: string;
  platform: string;
  arch: string;
}

export interface SystemEvent {
  id: number;
  event_type: string;
  details: string | null;
  created_at: string;
}
