import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class XProvider extends MediaProvider {
  readonly name = 'X (Twitter)';
  readonly slug = 'x';
  readonly icon = '🐦';
  readonly color = '#000000';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/(www\.)?twitter\.com\/[^/]+\/status\/\d+/i,
    /^https?:\/\/(www\.)?x\.com\/[^/]+\/status\/\d+/i,
    /^https?:\/\/t\.co\/[A-Za-z0-9]+/i,
  ];

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);
    try {
      const parsed = new URL(normalized);
      const hostname = parsed.hostname.replace('www.', '');
      if (hostname === 'twitter.com' || hostname === 'x.com' || hostname === 't.co') {
        const normalizedUrl = normalized.replace('twitter.com', 'x.com');
        return { valid: true, normalizedUrl };
      }
    } catch { /* fall through */ }
    return { valid: false, error: 'Invalid X/Twitter URL. Please provide a valid post link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) throw new Error('Invalid X URL');

    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(validation.normalizedUrl)}`;
    const data = await this.fetchOEmbed(oembedUrl);

    const authorName = typeof data?.author_name === 'string' ? data.author_name : undefined;
    const authorUrl = typeof data?.author_url === 'string' ? data.author_url : undefined;

    return {
      title: authorName ? `Post by ${authorName}` : 'X Post',
      creator: authorName,
      creatorUrl: authorUrl,
      platform: this.name,
      platformSlug: this.slug,
      sourceUrl: validation.normalizedUrl,
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
