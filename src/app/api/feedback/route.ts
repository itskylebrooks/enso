import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  FeedbackSubmissionSchema,
  type ParsedFeedbackSubmission,
} from '@shared/schemas/feedback';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_000_000;

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

  const result = FeedbackSubmissionSchema.safeParse(parsed);
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

  const makeIssueBody = (p: ParsedFeedbackSubmission): string => {
    const lines: string[] = [];
    lines.push(`**Kind:** ${p.kind}`);
    if (p.kind === 'content') {
      lines.push(`**Content:** ${p.target.mode} ${p.target.entityType}`);
      if (p.target.entityId) lines.push(`**Entity:** ${escapeInline(p.target.entityId)}`);
      if (p.target.variantKey) {
        const variant = p.target.variantKey;
        lines.push(
          `**Variant:** ${variant.hanmi} · ${variant.direction} · ${variant.weapon} · ${
            variant.versionId || 'base'
          }`,
        );
      }
    } else if (p.kind === 'idea' && p.area) {
      lines.push(`**Area:** ${escapeInline(p.area)}`);
    } else if (p.kind === 'bug' && p.location) {
      lines.push(`**Location:** ${escapeInline(p.location)}`);
    }
    lines.push(`**Locale:** ${p.locale}`);
    lines.push(`**From:** ${escapeInline(p.name)}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(p.details);

    if (p.kind === 'bug' && p.reproduction) {
      lines.push('');
      lines.push('### Steps to reproduce');
      lines.push(p.reproduction);
    }

    if (p.kind === 'content' && p.structured) {
      const structured = p.structured;
      if (structured.contentName) {
        lines.push('');
        lines.push(`**Proposed name:** ${escapeInline(structured.contentName)}`);
      }
      const taxonomy = [
        structured.attack ? `Attack: ${structured.attack}` : '',
        structured.category ? `Category: ${structured.category}` : '',
        structured.level ? `Level: ${structured.level}` : '',
        structured.routineCategory ? `Routine category: ${structured.routineCategory}` : '',
        structured.estimatedMinutes
          ? `Estimated duration: ${structured.estimatedMinutes} minutes`
          : '',
      ].filter(Boolean);
      if (taxonomy.length > 0) {
        lines.push('');
        lines.push('### Classification');
        taxonomy.forEach((item) => lines.push(`- ${item}`));
      }
      const addList = (heading: string, values?: string[]) => {
        if (!values?.length) return;
        lines.push('');
        lines.push(`### ${heading}`);
        values.forEach((value, index) => lines.push(`${index + 1}. ${value}`));
      };
      addList('Steps', structured.steps);
      addList('Exercise plan', structured.routineExercises);
      addList('Key points', structured.keyPoints);
      addList('Common mistakes', structured.commonMistakes);
      if (structured.uke) {
        lines.push('', '### Uke guidance', structured.uke);
      }
      if (structured.context) {
        lines.push('', '### Context', structured.context);
      }
      if (structured.attribution) {
        lines.push('', '### Attribution', structured.attribution);
      }
    }

    const media = p.kind === 'content' ? p.structured?.media : p.media;
    if (media && media.length > 0) {
      lines.push('');
      lines.push('**Media:**');
      for (const item of media) {
        lines.push(
          `- ${item.type}: ${item.url}${item.title ? ` (${escapeInline(item.title)})` : ''}`,
        );
      }
    }
    lines.push('');
    lines.push('---');
    lines.push(`Client version: ${p.clientVersion ?? 'unknown'}`);
    return lines.join('\n');
  };

  const issueTitle = `[feedback:${payload.kind}] ${String(payload.summary).slice(0, 120)}`;
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
