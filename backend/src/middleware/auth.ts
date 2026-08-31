import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { config } from '../utils/config.js';

// Hash the admin password on startup
let hashedAdminPassword: string;

export async function initAuth(): Promise<void> {
  hashedAdminPassword = await bcryptjs.hash(config.admin.password, 10);
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<string | null> {
  if (username !== config.admin.username) {
    return null;
  }

  const valid = await bcryptjs.compare(password, hashedAdminPassword);
  if (!valid) {
    return null;
  }

  const token = jwt.sign(
    { role: 'admin', username },
    config.admin.jwtSecret,
    { expiresIn: '24h' }
  );

  return token;
}

export function verifyAdminToken(token: string): { valid: boolean; payload?: jwt.JwtPayload } {
  try {
    const payload = jwt.verify(token, config.admin.jwtSecret) as jwt.JwtPayload;
    if (payload.role !== 'admin') {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Admin auth guard middleware.
 */
export async function adminAuthGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  const token = authHeader.slice(7);
  const result = verifyAdminToken(token);

  if (!result.valid) {
    reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
    });
    return;
  }
}
