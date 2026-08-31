import { useState } from 'react';
import { analyzeMedia } from '../services/api';
import type { AnalyzeResponse } from '../types';

export function useMediaAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (url: string) => {
    if (!url || !url.trim()) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeMedia(url.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze media URL');
    } finally {
      setAnalyzing(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
    setAnalyzing(false);
  };

  return {
    analyzing,
    result,
    error,
    analyze,
    clear,
  };
}
