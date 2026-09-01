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
      { formatId: 'video-2160p', label: '4K Ultra HD', quality: '2160p', resolution: '3840x2160', height: 2160, container: 'mp4', fileSize: 472000000, type: 'video', isPermitted: true },
      { formatId: 'video-1440p', label: '2K QHD', quality: '1440p', resolution: '2560x1440', height: 1440, container: 'mp4', fileSize: 210000000, type: 'video', isPermitted: true },
      { formatId: 'video-1080p', label: 'Full HD', quality: '1080p', resolution: '1920x1080', height: 1080, container: 'mp4', fileSize: 85000000, type: 'video', isPermitted: true },
      { formatId: 'video-720p', label: 'HD', quality: '720p', resolution: '1280x720', height: 720, container: 'mp4', fileSize: 35000000, type: 'video', isPermitted: true },
      { formatId: 'video-480p', label: 'SD', quality: '480p', resolution: '854x480', height: 480, container: 'mp4', fileSize: 18000000, type: 'video', isPermitted: true },
      { formatId: 'video-360p', label: 'SD', quality: '360p', resolution: '640x360', height: 360, container: 'mp4', fileSize: 9500000, type: 'video', isPermitted: true },
      { formatId: 'audio-mp3', label: 'MP3 High Quality', quality: '320 kbps', container: 'mp3', bitrate: 320000, fileSize: 8400000, type: 'audio', isPermitted: true },
      { formatId: 'audio-m4a', label: 'M4A Original Audio', quality: '256 kbps', container: 'm4a', bitrate: 256000, fileSize: 6700000, type: 'audio', isPermitted: true },
    ];
  }
}
