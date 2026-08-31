import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class TikTokProvider extends MediaProvider {
  readonly name = 'TikTok';
  readonly slug = 'tiktok';
  readonly icon = '🎵';
  readonly color = '#000000';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/i,
    /^https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[A-Za-z0-9]+/i,
    /^https?:\/\/m\.tiktok\.com\/v\/\d+/i,
  ];

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);
    try {
      const parsed = new URL(normalized);
      const hostname = parsed.hostname.replace('www.', '').replace('m.', '');
      if (hostname === 'tiktok.com' || hostname === 'vm.tiktok.com') {
        return { valid: true, normalizedUrl: normalized };
      }
    } catch { /* fall through */ }
    return { valid: false, error: 'Invalid TikTok URL. Please provide a valid TikTok video link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) throw new Error('Invalid TikTok URL');

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(validation.normalizedUrl)}`;
    const data = await this.fetchOEmbed(oembedUrl);

    return {
      title: (data?.title as string) || 'TikTok Video',
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
      { formatId: 'audio-mp3', label: 'MP3 Audio', quality: '320kbps', container: 'mp3', type: 'audio', isPermitted: true },
    ];
  }
}
