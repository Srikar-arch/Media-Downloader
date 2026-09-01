import { useState, useEffect, useRef } from 'react';
import {
  createDownload,
  cancelJob as apiCancelJob,
  subscribeToJob,
  getJobStatus,
  getDownloadFileUrl,
} from '../services/api';
import type { JobStatus, JobProgressUpdate } from '../types';

export function useJobProgress() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<number | undefined>(undefined);
  const [eta, setEta] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollingIntervalRef = useRef<any>(null);
  const hasTriggeredDownloadRef = useRef<boolean>(false);

  const triggerFileDownload = (jobId: string) => {
    if (hasTriggeredDownloadRef.current) return;
    hasTriggeredDownloadRef.current = true;

    const downloadUrl = getDownloadFileUrl(jobId);

    // Trigger instant native direct download to device
    // By using hidden iframe and direct anchor click without target=_blank,
    // the server's Content-Disposition: attachment header triggers the browser's
    // native download manager straight into the user's Downloads directory.
    let iframe = document.getElementById('__direct_download_frame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = '__direct_download_frame';
      iframe.style.position = 'fixed';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.bottom = '0';
      iframe.style.right = '0';
      document.body.appendChild(iframe);
    }
    iframe.src = downloadUrl;

    // Anchor fallback for all mobile and desktop browsers
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.setAttribute('download', '');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1000);
    }, 50);
  };

  const handleTerminalState = (jobId: string, currentStatus: JobStatus, errorMsg?: string | null) => {
    setStatus(currentStatus);
    setIsDownloading(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (currentStatus === 'completed') {
      setProgress(100);
      setIsCompleted(true);
      triggerFileDownload(jobId);
    } else if (currentStatus === 'failed') {
      setErrorMessage(errorMsg || 'Failed to download media stream.');
    }
  };

  const startDownload = async (url: string, formatId: string, mediaTitle?: string) => {
    setIsDownloading(true);
    setStatus('queued');
    setProgress(10);
    setErrorMessage(null);
    setIsCompleted(false);
    hasTriggeredDownloadRef.current = false;

    // Clean up previous listeners & polling
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (unsubscribeRef.current) unsubscribeRef.current();

    try {
      const { job } = await createDownload(url, formatId, mediaTitle);
      setActiveJobId(job.id);
      setStatus(job.status as JobStatus);
      setProgress(Math.max(job.progress, 15));

      // 1. Setup Active Polling Fallback (every 1.5 seconds)
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const res = await getJobStatus(job.id);
          if (res && res.job) {
            const currentJob = res.job;
            setStatus(currentJob.status);
            setProgress((prev) => Math.max(prev, currentJob.progress));

            if (['completed', 'failed', 'cancelled', 'expired'].includes(currentJob.status)) {
              handleTerminalState(job.id, currentJob.status, currentJob.error_message);
            }
          }
        } catch (pollErr) {
          console.warn('Job polling error:', pollErr);
        }
      }, 1500);

      // 2. Setup Real-time SSE Stream
      const unsub = subscribeToJob(
        job.id,
        (update: JobProgressUpdate) => {
          setStatus(update.status);
          setProgress((prev) => Math.max(prev, update.progress));
          if (update.speed !== undefined) setSpeed(update.speed);
          if (update.eta !== undefined) setEta(update.eta);
          if (update.message) setErrorMessage(update.message);

          if (['completed', 'failed', 'cancelled', 'expired'].includes(update.status)) {
            handleTerminalState(job.id, update.status, update.message);
          }
        },
        (sseErr) => {
          console.warn('SSE disconnected, relying on polling fallback:', sseErr);
        }
      );

      unsubscribeRef.current = unsub;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start download');
      setStatus('failed');
      setIsDownloading(false);
    }
  };

  const cancel = async () => {
    if (!activeJobId) return;
    try {
      await apiCancelJob(activeJobId);
      handleTerminalState(activeJobId, 'cancelled');
    } catch (err: any) {
      console.error('Failed to cancel job:', err);
    }
  };

  const reset = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setActiveJobId(null);
    setStatus(null);
    setProgress(0);
    setErrorMessage(null);
    setIsDownloading(false);
    setIsCompleted(false);
    hasTriggeredDownloadRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const retrySave = () => {
    if (!activeJobId) return;
    triggerFileDownload(activeJobId);
  };

  return {
    activeJobId,
    status,
    progress,
    speed,
    eta,
    errorMessage,
    isDownloading,
    isCompleted,
    startDownload,
    cancel,
    reset,
    retrySave,
  };
}
