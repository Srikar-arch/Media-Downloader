import { URL } from 'url';
import net from 'net';

/**
 * SSRF Protection - Prevents Server-Side Request Forgery attacks.
 * Validates URLs to ensure they don't point to internal/private resources.
 */

const BLOCKED_PROTOCOLS = new Set(['file:', 'ftp:', 'data:', 'javascript:', 'vbscript:', 'gopher:']);

const PRIVATE_IP_RANGES = [
  /^127\./,                          // Loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Class B private
  /^192\.168\./,                     // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./, // Shared address space
  /^198\.1[89]\./,                   // Benchmark testing
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
  /^fd/i,                            // IPv6 unique local
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
  '[::]',
  '[::1]',
  'metadata.google.internal',       // GCP metadata
  '169.254.169.254',                // Cloud metadata endpoint
  'metadata.google.com',
]);

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some(range => range.test(ip));
}

export function validateUrlSecurity(urlString: string): { safe: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, error: 'Invalid URL format' };
  }

  // Check protocol
  if (BLOCKED_PROTOCOLS.has(parsed.protocol)) {
    return { safe: false, error: `Protocol "${parsed.protocol}" is not allowed` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Only HTTP and HTTPS URLs are supported` };
  }

  // Prefer HTTPS
  // (We allow HTTP but log a warning)

  // Check hostname
  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, error: 'This hostname is not allowed' };
  }

  // Check if hostname is an IP address
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { safe: false, error: 'Private/internal IP addresses are not allowed' };
    }
  }

  // Check for IP in various encoded forms
  // Decimal IP (e.g., http://2130706433 = 127.0.0.1)
  if (/^\d+$/.test(hostname)) {
    return { safe: false, error: 'Numeric IP addresses are not allowed' };
  }

  // Hex IP
  if (/^0x/i.test(hostname)) {
    return { safe: false, error: 'Hexadecimal addresses are not allowed' };
  }

  // Check for username:password in URL
  if (parsed.username || parsed.password) {
    return { safe: false, error: 'URLs with credentials are not allowed' };
  }

  // Check port - only allow standard ports
  if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
    return { safe: false, error: 'Non-standard ports are not allowed' };
  }

  return { safe: true };
}
