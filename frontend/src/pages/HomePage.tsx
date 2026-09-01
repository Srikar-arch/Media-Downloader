import React, { useState } from 'react';
import { Hero } from '../components/home/Hero';
import { UrlInput } from '../components/home/UrlInput';
import { MediaResultCard } from '../components/home/MediaResultCard';
import { DownloadProgressModal } from '../components/home/DownloadProgressModal';
import { CookieModal } from '../components/home/CookieModal';
import { HowItWorks } from '../components/home/HowItWorks';
import { SupportedPlatforms } from '../components/home/SupportedPlatforms';
import { Features } from '../components/home/Features';
import { PrivacySection } from '../components/home/PrivacySection';
import { Faq } from '../components/home/Faq';
import { useMediaAnalysis } from '../hooks/useMediaAnalysis';
import { useJobProgress } from '../hooks/useJobProgress';
import { AlertTriangle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { analyzing, result, error, analyze, clear } = useMediaAnalysis();
  const {
    status,
    progress,
    speed,
    eta,
    errorMessage,
    isDownloading,
    startDownload,
    cancel,
    reset,
    retrySave,
  } = useJobProgress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleAnalyze = (url: string) => {
    setCurrentUrl(url);
    analyze(url);
  };

  const handleStartDownload = (formatId: string) => {
    if (!currentUrl) return;
    setIsModalOpen(true);
    const mediaTitle = result?.media?.title;
    startDownload(currentUrl, formatId, mediaTitle);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleClear = () => {
    clear();
    reset();
    setCurrentUrl('');
  };

  const handleCancelDownload = () => {
    cancel();
    setIsModalOpen(false);
    reset();
  };

  return (
    <main className="min-h-screen flex flex-col items-center">
      {/* Hero Section */}
      <Hero />

      {/* URL Input Form */}
      <UrlInput
        onAnalyze={handleAnalyze}
        isLoading={analyzing}
        onClear={handleClear}
      />

      {/* Error Alert Message */}
      {error && (
        <div className="w-full max-w-3xl mx-auto px-4 mt-6 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">Analysis Error</div>
              <div className="mt-0.5 text-rose-300/90">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Media Result Card */}
      {result && (
        <div className="w-full animate-fadeIn">
          <MediaResultCard
            data={result}
            onDownload={handleStartDownload}
            isDownloading={isDownloading}
          />
        </div>
      )}

      {/* Download Progress Modal */}
      <DownloadProgressModal
        isOpen={isModalOpen}
        status={status}
        progress={progress}
        speed={speed}
        eta={eta}
        errorMessage={errorMessage}
        onCancel={handleCancelDownload}
        onClose={handleCloseModal}
        onRetryDownload={retrySave}
        onOpenCookieModal={() => setIsCookieModalOpen(true)}
      />

      <CookieModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
      />

      {/* Informational & Marketing Sections */}
      <div className="w-full mt-16 space-y-12">
        <HowItWorks />
        <SupportedPlatforms />
        <Features />
        <PrivacySection />
        <Faq />
      </div>
    </main>
  );
};
