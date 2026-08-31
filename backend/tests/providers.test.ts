import { describe, it, expect } from 'vitest';
import { providerRegistry } from '../src/providers/registry.js';

describe('Provider Registry & URL Detection', () => {
  it('correctly detects YouTube URLs', () => {
    const provider1 = providerRegistry.detectProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(provider1?.slug).toBe('youtube');

    const provider2 = providerRegistry.detectProvider('https://youtu.be/dQw4w9WgXcQ');
    expect(provider2?.slug).toBe('youtube');

    const provider3 = providerRegistry.detectProvider('https://www.youtube.com/shorts/12345678901');
    expect(provider3?.slug).toBe('youtube');
  });

  it('correctly detects Vimeo URLs', () => {
    const provider = providerRegistry.detectProvider('https://vimeo.com/76979871');
    expect(provider?.slug).toBe('vimeo');
  });

  it('correctly detects Instagram URLs', () => {
    const provider = providerRegistry.detectProvider('https://www.instagram.com/p/CXYZ1234567/');
    expect(provider?.slug).toBe('instagram');

    const reelProvider = providerRegistry.detectProvider('https://www.instagram.com/reel/CXYZ1234567/');
    expect(reelProvider?.slug).toBe('instagram');
  });

  it('correctly detects TikTok URLs', () => {
    const provider = providerRegistry.detectProvider('https://www.tiktok.com/@user/video/7123456789012345678');
    expect(provider?.slug).toBe('tiktok');

    const vmProvider = providerRegistry.detectProvider('https://vm.tiktok.com/ZM8abc123/');
    expect(vmProvider?.slug).toBe('tiktok');
  });

  it('correctly detects Facebook URLs', () => {
    const provider = providerRegistry.detectProvider('https://www.facebook.com/watch/?v=123456789');
    expect(provider?.slug).toBe('facebook');
  });

  it('correctly detects X / Twitter URLs', () => {
    const provider = providerRegistry.detectProvider('https://x.com/user/status/1234567890123456789');
    expect(provider?.slug).toBe('x');

    const twitterProvider = providerRegistry.detectProvider('https://twitter.com/user/status/1234567890123456789');
    expect(twitterProvider?.slug).toBe('x');
  });

  it('correctly detects Demo URLs', () => {
    const provider = providerRegistry.detectProvider('https://demo.mediadownloader.test/video/1');
    expect(provider?.slug).toBe('demo');
  });

  it('returns null for unsupported domains', () => {
    expect(providerRegistry.detectProvider('https://example.com/some-page')).toBeNull();
    expect(providerRegistry.detectProvider('https://google.com')).toBeNull();
  });

  it('validates provider URLs and normalizes tracking params', () => {
    const youtube = providerRegistry.getProvider('youtube');
    expect(youtube).toBeDefined();

    const validation = youtube?.validate('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&feature=share');
    expect(validation?.valid).toBe(true);
    expect(validation?.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});
