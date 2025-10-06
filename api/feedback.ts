// Use plain any types here to avoid dependency on '@vercel/node' type package in the editor.
// The runtime on Vercel will continue to receive the platform request/response objects.
// This avoids the TypeScript editor error when the optional package isn't installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VercelRequest = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VercelResponse = any;
import { z } from 'zod';
import crypto from 'node:crypto';

const MAX_BODY_BYTES = 1_000_000;

const MediaSchema = z.object({
  type: z.enum(['youtube', 'image', 'link']),
  url: z.string().trim().url().max(2000),
  title: z.string().trim().max(200).optional(),
});

const FeedbackSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(320).optional(),
    category: z.enum(['suggestion', 'bug', 'edit', 'new-version', 'new-variation', 'new-technique']),
    entityType: z.enum(['technique', 'glossary', 'exam', 'guide', 'other']),
    entityId: z.string().trim().max(256).optional(),
    locale: z.enum(['en', 'de']).optional(),
    summary: z.string().trim().min(1).max(120),
    detailsMd: z.string().min(1).max(10_000),
    diffJson: z.unknown().optional(),
    media: z.array(MediaSchema).optional(),
    clientVersion: z.string().trim().max(64).optional(),
    userAgent: z.string().trim().max(512).optional(),
    honeypot: z.string().optional(),
  })
  .strict();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readRequestBody = async (req: VercelRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req
      .on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          reject(new Error('PAYLOAD_TOO_LARGE'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      })
      .on('error', reject);
  });
};

const escapeInline = (value: string): string => {
  const normalized = value.replace(/\r/g, '').split('\n').map((line) => line.trim()).join(' ');
  return ['*', '[', ']', '`'].reduce((acc, ch) => acc.split(ch).join(`\\${ch}`), normalized);
};

// Simplified server handler: we no longer create GitHub issues from the server.
// The handler will validate the payload and return a successful response with a requestId.
// This keeps the server-side flow but removes external GitHub interaction.

const validateOrigin = (req: VercelRequest): boolean => {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const hostHeader = req.headers.host;
    return Boolean(hostHeader && url.host === hostHeader);
  } catch {
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const requestId = crypto.randomUUID?.() ?? `req-${Date.now()}`;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, code: 'method', message: 'Method not allowed', requestId });
    return;
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    res.status(415).json({ ok: false, code: 'format', message: 'Content-Type must be application/json', requestId });
    return;
  }

  if (!validateOrigin(req)) {
    res.status(403).json({ ok: false, code: 'origin', message: 'Cross-origin requests are not allowed', requestId });
    return;
  }

  let raw = '';
  try {
    raw = await readRequestBody(req);
  } catch (error) {
    const message = (error as Error).message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large' : 'Failed to read body';
    res.status(413).json({ ok: false, code: 'size', message, requestId });
    return;
  }

  await sleep(50 + Math.floor(Math.random() * 100));

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    res.status(400).json({ ok: false, code: 'json', message: 'Invalid JSON payload', requestId });
    return;
  }

  const result = FeedbackSchema.safeParse(parsed);
  if (!result.success) {
    res.status(400).json({ ok: false, code: 'validation', message: 'Invalid feedback payload', requestId, issues: result.error.issues });
    return;
  }

  const payload = result.data;

  if ((payload.honeypot ?? '').trim() !== '') {
    res.status(400).json({ ok: false, code: 'spam', message: 'Spam detected', requestId });
    return;
  }

  // Accept the validated feedback and return a requestId. We no longer create GitHub issues.
  res.status(201).json({ ok: true, requestId });
}
