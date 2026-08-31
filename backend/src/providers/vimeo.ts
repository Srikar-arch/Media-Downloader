import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class VimeoProvider extends MediaProvider {
  readonly name = 'Vimeo';
  readonly slug = 'vimeo';
  readonly icon = '🎬';
  readonly color = '#1AB7EA';
  readonly downloadPermitted = true; // Only for videos marked downloadable by creator
  readonly audioExtractionPermitted = false;

  readonly patterns = [
    /^https?:\/\/(www\.)?vimeo\.com\/\d+/i,
    /^https?:\/\/player\.vimeo\.com\/video\/\d+/i,
  ];

  private extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);
    const videoId = this.extractVideoId(normalized);

    if (videoId) {
      return { valid: true, normalizedUrl: `https://vimeo.com/${videoId}` };
    }

    return { valid: false, error: 'Invalid Vimeo URL. Please provide a valid Vimeo video link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error('Invalid Vimeo URL');
    }

    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(validation.normalizedUrl)}`;
    const data = await this.fetchOEmbed(oembedUrl);

    if (!data) {
      throw new Error('Could not retrieve video information. The video may be private or unavailable.');
    }

    return {
      title: (data.title as string) || 'Vimeo Video',
      description: (data.description as string) || undefined,
      thumbnail: (data.thumbnail_url as string) || undefined,
      duration: (data.duration as number) || undefined,
      creator: (data.author_name as string) || undefined,
      creatorUrl: (data.author_url as string) || undefined,
      platform: this.name,
      platformSlug: this.slug,
      sourceUrl: validation.normalizedUrl,
      width: (data.width as number) || undefined,
      height: (data.height as number) || undefined,
    };
  }

  async getAvailableFormats(url: string): Promise<MediaFormat[]> {
    const validation = this.validate(url);
    if (!validation.valid) return [];

    const videoId = this.extractVideoId(url);
    if (!videoId) return [];

    try {
      // Try Vimeo's player config endpoint (works for public downloadable videos)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://player.vimeo.com/video/${videoId}/config`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'MediaDownloader/1.0',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return [];
      }

      const config = await response.json() as Record<string, unknown>;
      const request = config.request as Record<string, unknown> | undefined;
      const files = request?.files as Record<string, unknown> | undefined;
      const progressive = files?.progressive as Array<Record<string, unknown>> | undefined;

      if (!progressive || progressive.length === 0) {
        return [];
      }

      return progressive.map((file, index) => ({
        formatId: `vimeo-${file.quality || index}`,
        label: this.getQualityLabel(file.height as number),
        quality: `${file.height}p`,
        resolution: `${file.width}x${file.height}`,
        width: file.width as number,
        height: file.height as number,
        fps: file.fps as number || undefined,
        container: 'mp4',
        codec: (file.codec as string) || 'h264',
        fileSize: (file.size as number) || undefined,
        bitrate: (file.bitrate as number) || undefined,
        type: 'muxed' as const,
        downloadUrl: file.url as string,
        isPermitted: true,
      })).sort((a, b) => (b.height || 0) - (a.height || 0));
    } catch {
      return [];
    }
  }

  private getQualityLabel(height: number): string {
    if (height >= 2160) return '4K Ultra HD';
    if (height >= 1440) return '2K QHD';
    if (height >= 1080) return 'Full HD';
    if (height >= 720) return 'HD';
    if (height >= 480) return 'SD';
    if (height >= 360) return 'SD';
    return 'Low';
  }
}
