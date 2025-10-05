import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import crypto from 'node:crypto';

const MAX_BODY_BYTES = 1_000_000;
const MIN_DETAILS_LENGTH = 20;

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

const buildIssueBody = (
  payload: z.infer<typeof FeedbackSchema>,
  meta: { requestId: string },
): string => {
  const headerLines = [
    `**From:** ${escapeInline(payload.name)}${payload.email ? ` <${escapeInline(payload.email)}>` : ''}  `,
    `**Entity:** ${payload.entityType}${payload.entityId ? ` / ${escapeInline(payload.entityId)}` : ''}  `,
    `**App:** ${payload.clientVersion ?? '-'}  `,
    `**Request:** ${meta.requestId}`,
    '',
    '---',
    '',
  ];

  const structured = {
    entityId: payload.entityId ?? null,
    diffJson: payload.diffJson ?? null,
    media: payload.media ?? null,
    userAgent: payload.userAgent ?? null,
  };

  return (
    headerLines.join('\n') +
    `\n${payload.detailsMd}\n\n---\n**Structured payload**\n\n\`\`\`json\n${JSON.stringify(structured, null, 2)}\n\`\`\``
  );
};

const createGitHubIssue = async (
  payload: z.infer<typeof FeedbackSchema>,
  requestId: string,
): Promise<{ ok: boolean; issueNumber?: number; issueUrl?: string; status: number; message?: string } | null> => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    console.error(`[feedback] ${requestId} missing GitHub configuration`);
    return null;
  }

  const titleBase = `${payload.entityType}${payload.entityId ? `:${payload.entityId}` : ''}`;
  const title = `[Feedback/${payload.category}] ${titleBase} — ${payload.summary}`;

  const localeLabel = `loc:${payload.locale ?? 'en'}`;
  const labels = ['feedback', 'from-enso', `cat:${payload.category}`, `ent:${payload.entityType}`, localeLabel];

  const body = buildIssueBody(payload, { requestId });

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'enso-feedback-bot',
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    });
  } catch (error) {
    console.error(`[feedback] ${requestId} GitHub request failed`, error);
    return {
      ok: false,
      status: 0,
      message: (error as Error).message,
    };
  }

  if (response.status === 201) {
    const json = await response.json();
    return {
      ok: true,
      issueNumber: json.number,
      issueUrl: json.html_url,
      status: 201,
    };
  }

  const message = await response.text();
  console.error(`[feedback] ${requestId} GitHub error ${response.status}: ${message}`);

  return {
    ok: false,
    status: response.status,
    message,
  };
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

  if (payload.detailsMd.trim().length < MIN_DETAILS_LENGTH) {
    res.status(400).json({ ok: false, code: 'validation', message: 'Details too short', requestId });
    return;
  }

  const githubResult = await createGitHubIssue(payload, requestId);
  if (!githubResult) {
    res.status(500).json({ ok: false, code: 'server', message: 'GitHub configuration error', requestId });
    return;
  }

  if (githubResult.ok && githubResult.issueNumber && githubResult.issueUrl) {
    res.status(201).json({ ok: true, issueNumber: githubResult.issueNumber, issueUrl: githubResult.issueUrl, requestId });
    return;
  }

  if (githubResult.status === 401 || githubResult.status === 403) {
    res.status(403).json({ ok: false, code: 'auth', message: 'GitHub authentication/permission failed', requestId });
    return;
  }

  if (githubResult.status === 422) {
    res.status(422).json({ ok: false, code: 'validation', message: 'GitHub rejected the payload', requestId });
    return;
  }

  res.status(502).json({ ok: false, code: 'github', message: 'GitHub error', requestId });
}
