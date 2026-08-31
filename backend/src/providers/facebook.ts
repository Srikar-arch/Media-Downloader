import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

export class FacebookProvider extends MediaProvider {
  readonly name = 'Facebook';
  readonly slug = 'facebook';
  readonly icon = '📘';
  readonly color = '#1877F2';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/(www\.|m\.|web\.)?facebook\.com\/.*\/videos\//i,
    /^https?:\/\/(www\.|m\.)?facebook\.com\/watch\//i,
    /^https?:\/\/(www\.|m\.)?facebook\.com\/reel\//i,
    /^https?:\/\/fb\.watch\//i,
  ];

  validate(url: string): ValidationResult {
    const normalized = this.normalizeUrl(url);
    try {
      const parsed = new URL(normalized);
      const hostname = parsed.hostname.replace('www.', '').replace('m.', '').replace('web.', '');
      if (hostname === 'facebook.com' || hostname === 'fb.watch') {
        return { valid: true, normalizedUrl: normalized };
      }
    } catch { /* fall through */ }
    return { valid: false, error: 'Invalid Facebook URL. Please provide a valid Facebook video link.' };
  }

  async getMetadata(url: string): Promise<MediaMetadata> {
    const validation = this.validate(url);
    if (!validation.valid || !validation.normalizedUrl) throw new Error('Invalid Facebook URL');

    return {
      title: 'Facebook Video',
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
