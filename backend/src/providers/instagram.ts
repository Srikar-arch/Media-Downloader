import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class InstagramProvider extends MediaProvider {
  readonly name = 'Instagram';
  readonly slug = 'instagram';
  readonly icon = '📸';
  readonly color = '#E4405F';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i,
    /^https?:\/\/(www\.)?instagr\.am\/(p|reel)\//i,
  ];

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);
    try {
      const parsed = new URL(normalized);
      const hostname = parsed.hostname.replace('www.', '');
      if ((hostname === 'instagram.com' || hostname === 'instagr.am') &&
          /^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(parsed.pathname)) {
        const cleanPath = parsed.pathname.replace(/\/+$/, '');
        return { valid: true, normalizedUrl: `https://www.instagram.com${cleanPath}/` };
      }
    } catch { /* fall through */ }
    return { valid: false, error: 'Invalid Instagram URL. Please provide a valid Instagram post or reel link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) throw new Error('Invalid Instagram URL');

    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(validation.normalizedUrl)}&access_token=public`;
    const data = await this.fetchOEmbed(oembedUrl);

    return {
      title: (data?.title as string) || 'Instagram Media',
      thumbnail: (data?.thumbnail_url as string) || undefined,
      creator: (data?.author_name as string) || undefined,
      creatorUrl: (data?.author_url as string) || undefined,
      platform: this.name,
      platformSlug: this.slug,
      sourceUrl: validation.normalizedUrl,
      width: (data?.width as number) || undefined,
      height: (data?.height as number) || undefined,
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
