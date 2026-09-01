import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL is too long')
    .url('Please enter a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only HTTP and HTTPS URLs are supported'
    ),
});

export const createDownloadSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL is too long')
    .url('Please enter a valid URL'),
  formatId: z.string().min(1, 'Format selection is required'),
  sessionId: z.string().min(1, 'Session ID is required').max(128),
  mediaTitle: z.string().max(500).optional(),
});

export const jobIdSchema = z.object({
  jobId: z.string().min(1).max(64),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  platform: z.string().optional(),
  search: z.string().max(256).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'status', 'platform']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
