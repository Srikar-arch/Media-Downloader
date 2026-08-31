import { useState, useEffect, useRef } from 'react';
import {
  createDownload,
  cancelJob as apiCancelJob,
  subscribeToJob,
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

  const startDownload = async (url: string, formatId: string) => {
    setIsDownloading(true);
    setStatus('queued');
    setProgress(5);
    setErrorMessage(null);
    setIsCompleted(false);

    try {
      const { job } = await createDownload(url, formatId);
      setActiveJobId(job.id);
      setStatus(job.status as JobStatus);
      setProgress(job.progress);

      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to SSE updates
      const unsub = subscribeToJob(
        job.id,
        (update: JobProgressUpdate) => {
          setStatus(update.status);
          setProgress(update.progress);
          if (update.speed !== undefined) setSpeed(update.speed);
          if (update.eta !== undefined) setEta(update.eta);
          if (update.message) setErrorMessage(update.message);

          if (update.status === 'completed') {
            setIsCompleted(true);
            setIsDownloading(false);
            // Trigger automatic browser download
            const downloadUrl = getDownloadFileUrl(job.id);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else if (['failed', 'cancelled', 'expired'].includes(update.status)) {
            setIsDownloading(false);
          }
        },
        (err) => {
          console.error('SSE Error:', err);
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
      setStatus('cancelled');
      setIsDownloading(false);
    } catch (err: any) {
      console.error('Failed to cancel job:', err);
    }
  };

  const reset = () => {
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
  };

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

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
  };
}
