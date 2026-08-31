import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class YouTubeProvider extends MediaProvider {
  readonly name = 'YouTube';
  readonly slug = 'youtube';
  readonly icon = '📺';
  readonly color = '#FF0000';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\//i,
    /^https?:\/\/youtu\.be\//i,
    /^https?:\/\/(www\.)?youtube\.com\/embed\//i,
    /^https?:\/\/m\.youtube\.com\/watch\?/i,
    /^https?:\/\/(www\.)?youtube\.com\/live\//i,
  ];

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);

    try {
      const parsed = new URL(normalized);
      const hostname = parsed.hostname.replace('www.', '').replace('m.', '');

      if (hostname === 'youtu.be') {
        const videoId = parsed.pathname.slice(1);
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return { valid: true, normalizedUrl: `https://www.youtube.com/watch?v=${videoId}` };
        }
      }

      if (hostname === 'youtube.com') {
        const videoId = parsed.searchParams.get('v');
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return { valid: true, normalizedUrl: `https://www.youtube.com/watch?v=${videoId}` };
        }

        const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) {
          return { valid: true, normalizedUrl: `https://www.youtube.com/watch?v=${shortsMatch[1]}` };
        }

        const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
        if (embedMatch) {
          return { valid: true, normalizedUrl: `https://www.youtube.com/watch?v=${embedMatch[1]}` };
        }

        const liveMatch = parsed.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
        if (liveMatch) {
          return { valid: true, normalizedUrl: `https://www.youtube.com/watch?v=${liveMatch[1]}` };
        }
      }
    } catch {
      // fall through
    }

    return { valid: false, error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error('Invalid YouTube URL');
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(validation.normalizedUrl)}&format=json`;
    const data = await this.fetchOEmbed(oembedUrl);

    return {
      title: (data?.title as string) || 'YouTube Video',
      thumbnail: (data?.thumbnail_url as string) || undefined,
      creator: (data?.author_name as string) || undefined,
      creatorUrl: (data?.author_url as string) || undefined,
      platform: this.name,
      platformSlug: this.slug,
      sourceUrl: validation.normalizedUrl,
      width: (data?.thumbnail_width as number) || undefined,
      height: (data?.thumbnail_height as number) || undefined,
    };
  }

  async getAvailableFormats(_url: string): Promise<MediaFormat[]> {
    return [
      { formatId: 'video-1080p', label: 'Full HD', quality: '1080p', container: 'mp4', type: 'video', isPermitted: true },
      { formatId: 'video-720p', label: 'HD', quality: '720p', container: 'mp4', type: 'video', isPermitted: true },
      { formatId: 'video-480p', label: 'SD', quality: '480p', container: 'mp4', type: 'video', isPermitted: true },
      { formatId: 'audio-mp3', label: 'MP3 Audio', quality: '320kbps', container: 'mp3', type: 'audio', isPermitted: true },
    ];
  }
}
