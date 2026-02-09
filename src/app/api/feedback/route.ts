import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

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
    category: z.enum([
      'suggestion',
      'bug',
      'edit',
      'new-version',
      'new-variation',
      'new-technique',
    ]),
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

const escapeInline = (value: string): string => {
  const normalized = value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .join(' ');
  return ['*', '[', ']', '`'].reduce((acc, ch) => acc.split(ch).join(`\\${ch}`), normalized);
};

const validateOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host = request.headers.get('host');
    return Boolean(host && originUrl.host === host);
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID?.() ?? `req-${Date.now()}`;

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return NextResponse.json(
      {
        ok: false,
        code: 'format',
        message: 'Content-Type must be application/json',
        requestId,
      },
      { status: 415 },
    );
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'origin',
        message: 'Cross-origin requests are not allowed',
        requestId,
      },
      { status: 403 },
    );
  }

  let raw = '';
  try {
    raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, code: 'size', message: 'Payload too large', requestId },
        { status: 413 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'size',
        message: 'Failed to read body',
        requestId,
      },
      { status: 413 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'json',
        message: 'Invalid JSON payload',
        requestId,
      },
      { status: 400 },
    );
  }

  const result = FeedbackSchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        code: 'validation',
        message: 'Invalid feedback payload',
        requestId,
        issues: result.error.issues,
      },
      { status: 400 },
    );
  }

  const payload = result.data;

  if ((payload.honeypot ?? '').trim() !== '') {
    return NextResponse.json(
      {
        ok: false,
        code: 'spam',
        message: 'Spam detected',
        requestId,
      },
      { status: 400 },
    );
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
  const ownerEnv = process.env.GITHUB_OWNER?.trim();
  const repoEnv = process.env.GITHUB_REPO?.trim();

  let repoOwner = ownerEnv ?? undefined;
  let repoName = repoEnv ?? undefined;

  if (repoEnv && repoEnv.includes('/')) {
    const [repoOwnerFromSlug, repoNameFromSlug] = repoEnv.split('/', 2);
    if (!repoOwner) repoOwner = repoOwnerFromSlug || undefined;
    repoName = repoNameFromSlug || undefined;
  }

  if (repoOwner && repoOwner.includes('/')) {
    repoOwner = repoOwner.split('/')[0] || repoOwner;
  }

  if (repoName && repoName.includes('/')) {
    repoName = repoName.split('/').pop() || repoName;
  }

  if (!GITHUB_TOKEN || !repoOwner || !repoName) {
    return NextResponse.json(
      { ok: true, requestId, warning: 'github_not_configured' },
      { status: 201 },
    );
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
      for (const media of p.media) {
        lines.push(
          `- ${media.type}: ${media.url}${media.title ? ` (${escapeInline(media.title)})` : ''}`,
        );
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
      return NextResponse.json(
        {
          ok: false,
          code: 'github',
          message: 'Failed to create GitHub issue',
          requestId,
          details: ghText,
        },
        { status: 502 },
      );
    }

    const ghJson = JSON.parse(ghText) as { number?: number; html_url?: string };
    return NextResponse.json(
      {
        ok: true,
        requestId,
        issueNumber: ghJson.number,
        issueUrl: ghJson.html_url,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'github_fetch',
        message: 'Failed to contact GitHub',
        requestId,
      },
      { status: 502 },
    );
  }
}
