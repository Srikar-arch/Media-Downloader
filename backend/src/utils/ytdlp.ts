import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from './logger.js';
import { config } from './config.js';
import type { MediaMetadata, MediaFormat } from '../types/index.js';

function getBinPath(): string {
  const localBin = path.resolve(import.meta.dirname, '../../bin/yt-dlp');
  if (fs.existsSync(localBin)) return localBin;
  if (fs.existsSync('/app/bin/yt-dlp')) return '/app/bin/yt-dlp';
  return 'yt-dlp';
}

function getFfmpegPath(): string | null {
  if (fs.existsSync('/usr/bin/ffmpeg')) return '/usr/bin/ffmpeg';
  if (fs.existsSync('/usr/local/bin/ffmpeg')) return '/usr/local/bin/ffmpeg';
  if (fs.existsSync('/opt/homebrew/bin/ffmpeg')) return '/opt/homebrew/bin/ffmpeg';
  return null;
}

export interface YtDlpExtractionResult {
  metadata: MediaMetadata;
  formats: MediaFormat[];
  platformName: string;
}

/**
 * Execute yt-dlp with JSON metadata dump.
 */
export async function extractMediaWithYtDlp(url: string): Promise<YtDlpExtractionResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '-J',
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--js-runtimes', 'node',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      url,
    ];

    const bin = getBinPath();
    const proc = spawn(bin, args);
    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('error', (err) => {
      logger.error({ err }, 'Failed to spawn yt-dlp');
      reject(err);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        logger.warn({ code, stderr: stderrData.slice(0, 300) }, 'yt-dlp exited with non-zero code');
        return reject(new Error(stderrData || 'Failed to extract media information'));
      }

      try {
        const data = JSON.parse(stdoutData);
        const metadata: MediaMetadata = {
          title: data.title || 'Untitled Media',
          description: data.description || undefined,
          thumbnail: data.thumbnail || (Array.isArray(data.thumbnails) && data.thumbnails.length > 0 ? data.thumbnails[data.thumbnails.length - 1].url : undefined),
          duration: typeof data.duration === 'number' ? data.duration : undefined,
          creator: data.uploader || data.channel || data.artist || undefined,
          creatorUrl: data.uploader_url || data.channel_url || undefined,
          platform: data.extractor_key || 'Web Media',
          platformSlug: (data.extractor_key || 'media').toLowerCase(),
          sourceUrl: url,
          uploadDate: data.upload_date || undefined,
          viewCount: typeof data.view_count === 'number' ? data.view_count : undefined,
          width: data.width || undefined,
          height: data.height || undefined,
        };

        // Determine available resolutions from formats
        const rawFormats = Array.isArray(data.formats) ? data.formats : [];
        const availableHeights = new Set<number>();

        rawFormats.forEach((f: any) => {
          if (typeof f.height === 'number' && f.height > 0) {
            availableHeights.add(f.height);
          }
          if (typeof f.resolution === 'string') {
            const match = f.resolution.match(/(\d+)x(\d+)/);
            if (match) availableHeights.add(parseInt(match[2], 10));
          }
          if (typeof f.format_note === 'string') {
            const match = f.format_note.match(/(\d+)p/);
            if (match) availableHeights.add(parseInt(match[1], 10));
          }
        });

        if (data.height && typeof data.height === 'number') {
          availableHeights.add(data.height);
        }

        const standardHeights = [2160, 1440, 1080, 720, 480, 360];
        const videoFormats: MediaFormat[] = [];

        // Pick matching qualities
        for (const h of standardHeights) {
          const hasQuality = Array.from(availableHeights).some((availH) => availH >= h - 40);
          if (hasQuality || (h <= 1080 && availableHeights.size === 0)) {
            const qualityLabel = getQualityLabel(h);
            const approxSize = data.duration
              ? estimateVideoSize(data.duration, h)
              : undefined;

            videoFormats.push({
              formatId: `video-${h}p`,
              label: qualityLabel,
              quality: `${h}p`,
              resolution: `${Math.round((h * 16) / 9)}x${h}`,
              height: h,
              container: 'mp4',
              fileSize: approxSize,
              type: 'video',
              isPermitted: true,
            });
          }
        }

        // Fallback standard format if none detected
        if (videoFormats.length === 0) {
          videoFormats.push({
            formatId: 'video-best',
            label: 'Original Quality',
            quality: data.height ? `${data.height}p` : 'Best Quality',
            container: 'mp4',
            fileSize: data.filesize || data.filesize_approx || undefined,
            type: 'video',
            isPermitted: true,
          });
        }

        // Audio formats
        const audioFormats: MediaFormat[] = [
          {
            formatId: 'audio-mp3',
            label: 'MP3 High Quality',
            quality: '320 kbps',
            container: 'mp3',
            fileSize: data.duration ? Math.round((data.duration * 320 * 1000) / 8) : 9846374,
            bitrate: 320000,
            type: 'audio',
            isPermitted: true,
          },
          {
            formatId: 'audio-m4a',
            label: 'M4A Original Audio',
            quality: '256 kbps',
            container: 'm4a',
            fileSize: data.duration ? Math.round((data.duration * 256 * 1000) / 8) : 7864320,
            bitrate: 256000,
            type: 'audio',
            isPermitted: true,
          },
        ];

        resolve({
          metadata,
          formats: [...videoFormats, ...audioFormats],
          platformName: data.extractor_key || 'Web Video',
        });
      } catch (err) {
        logger.error({ err }, 'Failed to parse yt-dlp JSON output');
        reject(err);
      }
    });
  });
}

const activeProcesses = new Map<string, any>();

export function killActiveProcess(jobId: string): boolean {
  const proc = activeProcesses.get(jobId);
  if (proc) {
    try {
      proc.kill('SIGKILL');
      activeProcesses.delete(jobId);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Download media with real-time progress callbacks.
 */
export async function downloadWithYtDlp(
  jobId: string,
  url: string,
  formatId: string,
  onProgress: (progress: number, speed?: number, eta?: number) => void
): Promise<{ filePath: string; fileName: string; fileSize: number; mimeType: string }> {
  const tempDir = path.resolve(config.storage.tempDir);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const isAudio = formatId.startsWith('audio-');
  const targetExtension = isAudio ? (formatId === 'audio-m4a' ? 'm4a' : 'mp3') : 'mp4';
  const outputTemplate = path.join(tempDir, `${jobId}.%(ext)s`);
  const finalFilePath = path.join(tempDir, `${jobId}.${targetExtension}`);

  const args = [
    '--newline',
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--no-interactive',
    '--force-overwrites',
    '--no-cache-dir',
    '--socket-timeout', '30',
    '--js-runtimes', 'node',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    '--extractor-args',
    'youtube:player_client=android,ios,web',
    '--postprocessor-args',
    'ffmpeg:-y',
  ];

  const ffmpegLoc = getFfmpegPath();
  if (ffmpegLoc) {
    args.push('--ffmpeg-location', ffmpegLoc);
  }

  if (isAudio) {
    if (formatId === 'audio-m4a') {
      args.push(
        '-f', 'bestaudio[ext=m4a]/bestaudio/best',
        '-x',
        '--audio-format', 'm4a'
      );
    } else {
      args.push(
        '-f', 'bestaudio/best',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0'
      );
    }
  } else {
    // Video format
    let heightLimit = 1080;
    if (formatId === 'video-2160p') heightLimit = 2160;
    else if (formatId === 'video-1440p') heightLimit = 1440;
    else if (formatId === 'video-1080p') heightLimit = 1080;
    else if (formatId === 'video-720p') heightLimit = 720;
    else if (formatId === 'video-480p') heightLimit = 480;
    else if (formatId === 'video-360p') heightLimit = 360;

    args.push(
      '-f', `bestvideo[height<=${heightLimit}]+bestaudio/best[height<=${heightLimit}]/best`,
      '--merge-output-format', 'mp4'
    );
  }

  args.push('-o', outputTemplate, url);

  return new Promise((resolve, reject) => {
    const bin = getBinPath();
    const proc = spawn(bin, args);
    activeProcesses.set(jobId, proc);

    try {
      proc.stdin?.end();
    } catch {
      // ignore
    }

    const timeout = setTimeout(() => {
      killActiveProcess(jobId);
      reject(new Error('Media download timed out.'));
    }, 600000);

    proc.stdout.on('data', (data: Buffer) => {
      const line = data.toString();
      // Parse progress: [download]  45.2% of 12.34MiB at 4.56MiB/s ETA 00:05
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      const speedMatch = line.match(/at\s+([\d.]+(?:[kKMGT]?i?B\/s))/i);
      const etaMatch = line.match(/ETA\s+(\d+:\d+)/i);

      if (percentMatch) {
        const pct = Math.min(Math.round(parseFloat(percentMatch[1])), 95);
        let speedBytes: number | undefined;
        let etaSecs: number | undefined;

        if (speedMatch) {
          speedBytes = parseSpeedToBytes(speedMatch[1]);
        }
        if (etaMatch) {
          etaSecs = parseEtaToSeconds(etaMatch[1]);
        }

        onProgress(pct, speedBytes, etaSecs);
      }
    });

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      activeProcesses.delete(jobId);

      if (code !== 0) {
        logger.error({ code, stderr }, 'yt-dlp download failed');
        return reject(new Error(stderr || 'Download processing failed'));
      }

      // Check final generated file
      let matchedFile = finalFilePath;
      if (!fs.existsSync(matchedFile)) {
        // Find any file starting with jobId in temp dir
        const files = fs.readdirSync(tempDir);
        const candidate = files.find((f) => f.startsWith(jobId));
        if (candidate) {
          matchedFile = path.join(tempDir, candidate);
        }
      }

      if (!fs.existsSync(matchedFile)) {
        return reject(new Error('Downloaded file was not found on disk.'));
      }

      const stat = fs.statSync(matchedFile);
      const ext = path.extname(matchedFile).replace('.', '') || targetExtension;
      const mimeType = getMimeType(ext);
      const fileName = `media-${jobId.slice(0, 8)}.${ext}`;

      onProgress(100);

      resolve({
        filePath: matchedFile,
        fileName,
        fileSize: stat.size,
        mimeType,
      });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function getQualityLabel(height: number): string {
  if (height >= 2160) return '4K Ultra HD';
  if (height >= 1440) return '2K QHD';
  if (height >= 1080) return 'Full HD';
  if (height >= 720) return 'HD';
  if (height >= 480) return 'SD';
  if (height >= 360) return 'SD';
  return `${height}p`;
}

function estimateVideoSize(durationSeconds: number, height: number): number {
  let bitrateBps = 3000000; // 3 Mbps default for 1080p
  if (height >= 2160) bitrateBps = 18000000; // 18 Mbps for 4K
  else if (height >= 1440) bitrateBps = 8000000; // 8 Mbps for 1440p
  else if (height >= 1080) bitrateBps = 4500000;
  else if (height >= 720) bitrateBps = 2200000;
  else if (height >= 480) bitrateBps = 1000000;
  else bitrateBps = 600000;

  return Math.round((durationSeconds * bitrateBps) / 8);
}

function parseSpeedToBytes(speedStr: string): number {
  const match = speedStr.match(/([\d.]+)\s*([kKMGT]?i?B\/s)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith('G')) return val * 1024 * 1024 * 1024;
  if (unit.startsWith('M')) return val * 1024 * 1024;
  if (unit.startsWith('K')) return val * 1024;
  return val;
}

function parseEtaToSeconds(etaStr: string): number {
  const parts = etaStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function getMimeType(extension: string): string {
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    opus: 'audio/opus',
    ogg: 'audio/ogg',
  };
  return types[extension] || 'application/octet-stream';
}
