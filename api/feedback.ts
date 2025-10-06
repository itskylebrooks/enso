import type { VercelRequest, VercelResponse } from '@vercel/node';
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

  // Try to create a GitHub issue if credentials/config are present in env.
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const rawRepoOwner = process.env.GITHUB_REPO_OWNER ?? process.env.GITHUB_OWNER;
  const rawRepoName = process.env.GITHUB_REPO_NAME ?? process.env.GITHUB_REPO;

  let repoOwner = rawRepoOwner ?? undefined;
  let repoName = rawRepoName ?? undefined;

  if (!repoOwner && repoName && repoName.includes('/')) {
    const [owner, name] = repoName.split('/', 2);
    repoOwner = owner || undefined;
    repoName = name || undefined;
  }

  if (repoName && repoName.includes('/')) {
    repoName = repoName.split('/').pop() || repoName;
  }

  if (!GITHUB_TOKEN || !repoOwner || !repoName) {
    // Not configured — accept the feedback but inform the client that no issue was created.
    res.status(201).json({ ok: true, requestId, warning: 'github_not_configured' });
    return;
  }

  const makeIssueBody = (p: typeof payload): string => {
    const lines: string[] = [];
    lines.push(`**Category:** ${p.category}`);
    lines.push(`**Entity:** ${p.entityType}${p.entityId ? ` (${p.entityId})` : ''}`);
    lines.push(`**Locale:** ${p.locale ?? 'n/a'}`);
    lines.push(`**From:** ${escapeInline(p.name)}`);
    if (p.email) lines.push(`**Email:** ${escapeInline(p.email)}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(p.detailsMd || '');
    if (Array.isArray(p.media) && p.media.length > 0) {
      lines.push('');
      lines.push('**Media:**');
      for (const m of p.media) {
        lines.push(`- ${m.type}: ${m.url}${m.title ? ` (${escapeInline(m.title)})` : ''}`);
      }
    }
    lines.push('');
    lines.push('---');
    lines.push(`Client version: ${p.clientVersion ?? 'unknown'}`);
    return lines.join('\n');
  };

  const issueTitle = `[feedback] ${String(payload.summary).slice(0, 120)}`;
  const issueBody = makeIssueBody(payload);

  try {
    const ghResp = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'enso-feedback-bot',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ title: issueTitle, body: issueBody, labels: ['feedback'] }),
      },
    );

    const ghText = await ghResp.text();
    if (!ghResp.ok) {
      console.error('GitHub API error', ghResp.status, ghText);
      res.status(502).json({ ok: false, code: 'github', message: 'Failed to create GitHub issue', requestId, details: ghText });
      return;
    }

    const ghJson = JSON.parse(ghText);
    res.status(201).json({ ok: true, requestId, issueNumber: ghJson.number, issueUrl: ghJson.html_url });
    return;
  } catch (err) {
    console.error('GitHub fetch failed', err);
    res.status(502).json({ ok: false, code: 'github_fetch', message: 'Failed to contact GitHub', requestId });
    return;
  }
}
