import { MediaProvider } from './base.js';
import type { MediaMetadata, MediaFormat, ValidationResult } from '../types/index.js';

/**
 * Demo provider for testing and showcasing the application.
 * Returns simulated data so the full UI flow can be demonstrated.
 */
export class DemoProvider extends MediaProvider {
  readonly name = 'Demo';
  readonly slug = 'demo';
  readonly icon = '🎮';
  readonly color = '#8B5CF6';
  readonly downloadPermitted = true;
  readonly audioExtractionPermitted = true;

  readonly patterns = [
    /^https?:\/\/demo\.mediadownloader\.test\//i,
    /^demo:\/\//i,
  ];

  validate(url: string): ValidationResult {
    if (this.canHandle(url)) {
      return { valid: true, normalizedUrl: url };
    }
    return { valid: false, error: 'Invalid demo URL' };
  }

  async getMetadata(_url: string): Promise<MediaMetadata> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      title: 'Big Buck Bunny — Demo Video',
      description: 'This is a demonstration video showcasing the media downloader interface. Big Buck Bunny is a Creative Commons licensed short film.',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
      duration: 596,
      creator: 'Blender Foundation',
      creatorUrl: 'https://www.blender.org',
      platform: this.name,
      platformSlug: this.slug,
      sourceUrl: _url,
      width: 3840,
      height: 2160,
      uploadDate: '2008-05-30',
      viewCount: 15000000,
    };
  }

  async getAvailableFormats(_url: string): Promise<MediaFormat[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
      {
        formatId: 'demo-4k',
        label: '4K Ultra HD',
        quality: '2160p',
        resolution: '3840x2160',
        width: 3840,
        height: 2160,
        fps: 30,
        container: 'mp4',
        codec: 'h264',
        fileSize: 734003200,  // ~700 MB
        bitrate: 20000000,
        type: 'muxed',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
      {
        formatId: 'demo-1080p',
        label: 'Full HD',
        quality: '1080p',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        fps: 30,
        container: 'mp4',
        codec: 'h264',
        fileSize: 192937984,  // ~184 MB
        bitrate: 5000000,
        type: 'muxed',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
      {
        formatId: 'demo-720p',
        label: 'HD',
        quality: '720p',
        resolution: '1280x720',
        width: 1280,
        height: 720,
        fps: 30,
        container: 'mp4',
        codec: 'h264',
        fileSize: 96468992,  // ~92 MB
        bitrate: 2500000,
        type: 'muxed',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
      {
        formatId: 'demo-480p',
        label: 'SD',
        quality: '480p',
        resolution: '854x480',
        width: 854,
        height: 480,
        fps: 30,
        container: 'mp4',
        codec: 'h264',
        fileSize: 48234496,  // ~46 MB
        bitrate: 1200000,
        type: 'muxed',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
      {
        formatId: 'demo-audio-mp3',
        label: 'MP3 Audio',
        quality: '320kbps',
        container: 'mp3',
        codec: 'mp3',
        fileSize: 9846374,  // ~9.4 MB
        bitrate: 320000,
        type: 'audio',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
      {
        formatId: 'demo-audio-m4a',
        label: 'M4A Audio',
        quality: '256kbps',
        container: 'm4a',
        codec: 'aac',
        fileSize: 7864320,  // ~7.5 MB
        bitrate: 256000,
        type: 'audio',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isPermitted: true,
      },
    ];
  }
}
