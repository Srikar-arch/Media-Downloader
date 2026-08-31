import { createHash } from 'crypto';
import { providerRegistry } from '../providers/registry.js';
import { validateUrlSecurity } from '../utils/ssrf.js';
import { getDatabase } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { extractMediaWithYtDlp } from '../utils/ytdlp.js';
import type { AnalyzeResponse, ApiError, MediaMetadata, MediaFormat, PlatformInfo } from '../types/index.js';

// In-memory LRU cache for metadata
const metadataCache = new Map<string, { data: AnalyzeResponse; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500;

function getCacheKey(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

function cleanCache(): void {
  const now = Date.now();
  for (const [key, value] of metadataCache.entries()) {
    if (value.expiresAt < now) {
      metadataCache.delete(key);
    }
  }
  if (metadataCache.size > MAX_CACHE_SIZE) {
    const firstKey = metadataCache.keys().next().value;
    if (firstKey) metadataCache.delete(firstKey);
  }
}

export async function analyzeUrl(url: string): Promise<AnalyzeResponse | ApiError> {
  // 1. Security check
  const security = validateUrlSecurity(url);
  if (!security.safe) {
    return {
      success: false,
      error: {
        code: 'INVALID_URL',
        message: security.error || 'This URL is not allowed.',
      },
    };
  }

  // 2. Check cache
  const cacheKey = getCacheKey(url);
  const cached = metadataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.info({ url, cached: true }, 'Returning cached analysis');
    return cached.data;
  }

  // 3. Detect provider if known, or fallback to generic web provider
  const detectedProvider = providerRegistry.detectProvider(url);
  const normalizedUrl = detectedProvider ? detectedProvider.validate(url).normalizedUrl || url : url;

  try {
    logger.info({ url: normalizedUrl, provider: detectedProvider?.slug || 'universal' }, 'Analyzing media stream');

    // If it's the demo provider, use its fast internal mock
    if (detectedProvider && detectedProvider.slug === 'demo') {
      const metadata = await detectedProvider.getMetadata(normalizedUrl);
      const formats = await detectedProvider.getAvailableFormats(normalizedUrl);
      const response: AnalyzeResponse = {
        success: true,
        platform: detectedProvider.getPlatformInfo(),
        media: metadata,
        formats,
        downloadPermitted: true,
      };
      return response;
    }

    // Universal extraction via yt-dlp
    let extractionResult;
    try {
      extractionResult = await extractMediaWithYtDlp(normalizedUrl);
    } catch (ytdlpErr) {
      // If yt-dlp fails on this URL, try oEmbed fallback if provider exists
      if (detectedProvider) {
        logger.warn({ err: ytdlpErr }, 'Falling back to oEmbed metadata');
        const meta = await detectedProvider.getMetadata(normalizedUrl);
        const defaultFormats = await detectedProvider.getAvailableFormats(normalizedUrl);
        extractionResult = {
          metadata: meta,
          formats: defaultFormats,
          platformName: detectedProvider.name,
        };
      } else {
        throw ytdlpErr;
      }
    }

    const platformInfo: PlatformInfo = detectedProvider
      ? {
          ...detectedProvider.getPlatformInfo(),
          supportedFeatures: { metadata: true, download: true, audioExtraction: true },
        }
      : {
          name: extractionResult.platformName || 'Web Media',
          slug: (extractionResult.platformName || 'media').toLowerCase().replace(/\s+/g, '-'),
          icon: '🌐',
          color: '#6366F1',
          supportedFeatures: { metadata: true, download: true, audioExtraction: true },
        };

    const response: AnalyzeResponse = {
      success: true,
      platform: platformInfo,
      media: extractionResult.metadata,
      formats: extractionResult.formats,
      downloadPermitted: extractionResult.formats.length > 0,
    };

    // 7. Cache result
    cleanCache();
    metadataCache.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // 8. Log system event
    try {
      const db = getDatabase();
      db.prepare(
        `INSERT INTO system_events (event_type, details) VALUES (?, ?)`
      ).run('media_analyzed', JSON.stringify({
        platform: platformInfo.slug,
        url: normalizedUrl,
        formatsFound: extractionResult.formats.length,
        downloadPermitted: true,
      }));
    } catch (e) {
      logger.warn({ err: e }, 'Failed to log system event');
    }

    return response;
  } catch (err: any) {
    logger.error({ err, url: normalizedUrl }, 'Failed to analyze media');

    return {
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: err.message || 'We couldn\'t process this media. The link may be private, invalid, or temporarily unreachable. Please try again.',
      },
    };
  }
}
