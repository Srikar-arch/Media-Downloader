import { useState, useMemo } from 'react';

export interface DetectedPlatform {
  slug: string;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const PLATFORM_PATTERNS: {
  slug: string;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  regex: RegExp[];
}[] = [
  {
    slug: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: '#FF0000',
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    regex: [
      /youtube\.com\/watch/i,
      /youtube\.com\/shorts/i,
      /youtu\.be\//i,
      /youtube\.com\/embed/i,
      /youtube\.com\/live/i,
    ],
  },
  {
    slug: 'vimeo',
    name: 'Vimeo',
    icon: '🎬',
    color: '#1AB7EA',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    regex: [/vimeo\.com\/\d+/i, /player\.vimeo\.com\/video\/\d+/i],
  },
  {
    slug: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    badgeBg: 'bg-pink-500/10',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-400',
    regex: [/instagram\.com\/(p|reel|reels|tv)/i, /instagr\.am\/(p|reel)/i],
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#EE1D52',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
    regex: [/tiktok\.com\/@[^/]+\/video/i, /vm\.tiktok\.com/i, /tiktok\.com\/t\//i],
  },
  {
    slug: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
    regex: [/facebook\.com\/.*\/videos/i, /facebook\.com\/watch/i, /facebook\.com\/reel/i, /fb\.watch/i],
  },
  {
    slug: 'x',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#A0AEC0',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/30',
    badgeText: 'text-slate-300',
    regex: [/twitter\.com\/[^/]+\/status/i, /x\.com\/[^/]+\/status/i, /t\.co\//i],
  },
  {
    slug: 'demo',
    name: 'Demo Showcase',
    icon: '🎮',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
    regex: [/demo\.mediadownloader\.test/i, /^demo:\/\//i],
  },
];

export function useUrlDetection(url: string) {
  const detectedPlatform = useMemo<DetectedPlatform | null>(() => {
    if (!url || url.trim().length < 4) return null;
    const trimmed = url.trim();

    for (const p of PLATFORM_PATTERNS) {
      if (p.regex.some((r) => r.test(trimmed))) {
        return {
          slug: p.slug,
          name: p.name,
          icon: p.icon,
          color: p.color,
          badgeBg: p.badgeBg,
          badgeBorder: p.badgeBorder,
          badgeText: p.badgeText,
        };
      }
    }
    return null;
  }, [url]);

  const isValidUrl = useMemo(() => {
    if (!url || url.trim().length < 4) return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' || url.startsWith('demo://');
    } catch {
      return false;
    }
  }, [url]);

  return {
    detectedPlatform,
    isValidUrl,
    isSupported: detectedPlatform !== null,
  };
}
