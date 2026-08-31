import { describe, it, expect } from 'vitest';
import { validateUrlSecurity, isPrivateIp } from '../src/utils/ssrf.js';

describe('SSRF and URL Security', () => {
  it('allows valid public HTTP and HTTPS URLs', () => {
    expect(validateUrlSecurity('https://www.youtube.com/watch?v=dQw4w9WgXcQ').safe).toBe(true);
    expect(validateUrlSecurity('https://vimeo.com/76979871').safe).toBe(true);
    expect(validateUrlSecurity('https://instagram.com/p/C12345').safe).toBe(true);
    expect(validateUrlSecurity('http://example.com/video.mp4').safe).toBe(true);
  });

  it('blocks file://, ftp://, and dangerous schemes', () => {
    expect(validateUrlSecurity('file:///etc/passwd').safe).toBe(false);
    expect(validateUrlSecurity('ftp://ftp.example.com/file').safe).toBe(false);
    expect(validateUrlSecurity('data:text/html,<script>alert(1)</script>').safe).toBe(false);
    expect(validateUrlSecurity('javascript:alert(1)').safe).toBe(false);
    expect(validateUrlSecurity('gopher://127.0.0.1:70').safe).toBe(false);
  });

  it('blocks localhost and loopback variations', () => {
    expect(validateUrlSecurity('http://localhost/admin').safe).toBe(false);
    expect(validateUrlSecurity('http://127.0.0.1/admin').safe).toBe(false);
    expect(validateUrlSecurity('http://127.0.0.2:80/').safe).toBe(false);
    expect(validateUrlSecurity('http://0.0.0.0/').safe).toBe(false);
    expect(validateUrlSecurity('http://[::1]/').safe).toBe(false);
  });

  it('blocks private IP ranges (Class A, B, C, link-local)', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('10.255.255.254')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true);

    expect(validateUrlSecurity('http://10.0.0.1/api').safe).toBe(false);
    expect(validateUrlSecurity('http://192.168.0.1/secret').safe).toBe(false);
    expect(validateUrlSecurity('http://172.20.0.5/').safe).toBe(false);
    expect(validateUrlSecurity('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
  });

  it('blocks metadata endpoints and encoded IP representations', () => {
    expect(validateUrlSecurity('http://metadata.google.internal/computeMetadata/v1/').safe).toBe(false);
    expect(validateUrlSecurity('http://2130706433/').safe).toBe(false); // 127.0.0.1 decimal
    expect(validateUrlSecurity('http://0x7f000001/').safe).toBe(false); // 127.0.0.1 hex
  });

  it('blocks URLs with credentials', () => {
    expect(validateUrlSecurity('https://user:password@example.com/').safe).toBe(false);
  });

  it('blocks non-standard ports', () => {
    expect(validateUrlSecurity('https://example.com:8080/video').safe).toBe(false);
    expect(validateUrlSecurity('http://example.com:22/').safe).toBe(false);
    expect(validateUrlSecurity('https://example.com:443/').safe).toBe(true);
    expect(validateUrlSecurity('http://example.com:80/').safe).toBe(true);
  });
});
