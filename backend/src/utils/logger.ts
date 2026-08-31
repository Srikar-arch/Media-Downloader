import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.logging.level,
  transport: config.env === 'development' ? {
    target: 'pino/file',
    options: { destination: 1 },
  } : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.secret', '*.token', '*.apiKey'],
    censor: '[REDACTED]',
  },
});
