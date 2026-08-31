import type { MediaMetadata, MediaFormat, ValidationResult, PlatformInfo } from '../types/index.js';

/**
 * Abstract base class for all media providers.
 * Each supported platform implements this interface.
 */
export abstract class MediaProvider {
  abstract readonly name: string;
  abstract readonly slug: string;
  abstract readonly icon: string;
  abstract readonly color: string;
  abstract readonly patterns: RegExp[];

  /**
   * Whether this provider supports downloading content.
   * Returns false for platforms that restrict downloads.
   */
  abstract readonly downloadPermitted: boolean;

  /**
   * Whether audio extraction is supported.
   */
  abstract readonly audioExtractionPermitted: boolean;

  /**
   * Check if this provider can handle the given URL.
   */
  canHandle(url: string): boolean {
    return this.patterns.some(pattern => pattern.test(url));
  }

  /**
   * Validate and normalize the URL.
   */
  abstract validate(url: string): ValidationResult;

  /**
   * Retrieve media metadata (title, thumbnail, duration, etc.).
   */
  abstract getMetadata(url: string): Promise<MediaMetadata>;

  /**
   * Get available download formats.
   */
  abstract getAvailableFormats(url: string): Promise<MediaFormat[]>;

  /**
   * Get platform info for display.
   */
  getPlatformInfo(): PlatformInfo {
    return {
      name: this.name,
      slug: this.slug,
      icon: this.icon,
      color: this.color,
      supportedFeatures: {
        metadata: true,
        download: this.downloadPermitted,
        audioExtraction: this.audioExtractionPermitted,
      },
    };
  }

  /**
   * Normalize a URL by removing tracking parameters and standardizing format.
   */
  protected normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'feature', 'si', 'pp'];
      trackingParams.forEach(p => parsed.searchParams.delete(p));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Fetch oEmbed data for a URL.
   */
  protected async fetchOEmbed(oembedUrl: string): Promise<Record<string, unknown> | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(oembedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'MediaDownloader/1.0 (oEmbed Client)',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      return await response.json() as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
