import { MediaProvider } from './base.js';
import { YouTubeProvider } from './youtube.js';
import { VimeoProvider } from './vimeo.js';
import { InstagramProvider } from './instagram.js';
import { TikTokProvider } from './tiktok.js';
import { FacebookProvider } from './facebook.js';
import { XProvider } from './x.js';
import { DemoProvider } from './demo.js';
import { logger } from '../utils/logger.js';
import type { PlatformInfo } from '../types/index.js';

class ProviderRegistry {
  private providers: MediaProvider[] = [];

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register(new YouTubeProvider());
    this.register(new VimeoProvider());
    this.register(new InstagramProvider());
    this.register(new TikTokProvider());
    this.register(new FacebookProvider());
    this.register(new XProvider());
    this.register(new DemoProvider());

    logger.info({ count: this.providers.length }, 'Provider registry initialized');
  }

  register(provider: MediaProvider): void {
    this.providers.push(provider);
  }

  /**
   * Detect which provider can handle the given URL.
   */
  detectProvider(url: string): MediaProvider | null {
    for (const provider of this.providers) {
      if (provider.canHandle(url)) {
        return provider;
      }
    }
    return null;
  }

  /**
   * Get a provider by its slug.
   */
  getProvider(slug: string): MediaProvider | null {
    return this.providers.find(p => p.slug === slug) || null;
  }

  /**
   * List all registered platforms.
   */
  listPlatforms(): PlatformInfo[] {
    return this.providers
      .filter(p => p.slug !== 'demo') // Hide demo from public listing
      .map(p => p.getPlatformInfo());
  }

  /**
   * List all platforms including demo.
   */
  listAllPlatforms(): PlatformInfo[] {
    return this.providers.map(p => p.getPlatformInfo());
  }
}

// Singleton
export const providerRegistry = new ProviderRegistry();
