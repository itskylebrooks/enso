import type { Copy } from '@shared/constants/i18n';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { answerCurrentLearnCard, createLearnQueueState } from '../session';
import type { LearnQueueState, LearnSession } from '../types';

type LearnSessionPageProps = {
  copy: Copy;
  session: LearnSession | null;
  onBack: () => void;
  onOpenBookmarks: () => void;
  onOpenGuide: () => void;
};

export const LearnSessionPage = ({
  copy,
  session,
  onBack,
  onOpenBookmarks,
  onOpenGuide,
}: LearnSessionPageProps): ReactElement => {
  const [queueState, setQueueState] = useState<LearnQueueState>(() =>
    createLearnQueueState(session?.cards ?? []),
  );
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setQueueState(createLearnQueueState(session?.cards ?? []));
    setRevealed(false);
  }, [session]);

  if (!session || session.cards.length === 0) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{copy.learnNoSessionTitle}</h1>
          <p className="text-sm text-muted leading-relaxed">{copy.learnNoSessionBody}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenBookmarks}
              className="inline-flex items-center justify-center rounded-lg border btn-contrast px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.backToBookmarks}
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center justify-center rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.backToGuide}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentCard = queueState.queue[0];
  const isComplete = !currentCard;
  const answeredCount = queueState.totalCount - queueState.queue.length;
  const visibleProgress = Math.min(answeredCount + 1, queueState.totalCount);

  const handleAnswer = (remembered: boolean) => {
    setQueueState((current) => answerCurrentLearnCard(current, remembered));
    setRevealed(false);
  };

  const restart = () => {
    setQueueState(createLearnQueueState(session.cards));
    setRevealed(false);
  };

  if (isComplete) {
    return (
      <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-0 pb-10">
        <div className="space-y-6 rounded-2xl border surface-border surface p-6 text-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              {copy.learnCompleteEyebrow}
            </p>
            <h1 className="text-2xl font-semibold">{copy.learnCompleteTitle}</h1>
            <p className="text-sm text-muted">
              {copy.learnCompleteStats
                .replace('{remembered}', String(queueState.rememberedCount))
                .replace('{missed}', String(queueState.missedCount))}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center justify-center gap-2 rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span>{copy.learnRestart}</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-lg border btn-contrast px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span>{session.sourceLabel}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const frontText =
    session.options.frontMode === 'title' ? currentCard.title : currentCard.definition;
  const backText =
    session.options.frontMode === 'title' ? currentCard.definition : currentCard.title;

  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-0 pb-10 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded text-sm text-subtle transition hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>{session.sourceLabel}</span>
        </button>
        <p className="text-sm text-subtle">
          {copy.learnProgress
            .replace('{current}', String(visibleProgress))
            .replace('{total}', String(queueState.totalCount))}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        disabled={revealed}
        className="min-h-[320px] w-full rounded-2xl border surface-border surface p-6 text-left card-hover-shadow disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
      >
        <div className="flex h-full min-h-[272px] flex-col justify-center gap-6">
          {session.options.showTags && currentCard.tagLabel && (
            <span
              className="inline-flex w-fit rounded-full border border-transparent px-3 py-1 text-xs font-semibold"
              style={currentCard.tagStyle}
            >
              {currentCard.tagLabel}
            </span>
          )}
          <div className="space-y-4">
            <div className="text-2xl font-semibold leading-snug">{frontText}</div>
            {revealed && <p className="text-base leading-relaxed text-muted">{backText}</p>}
          </div>
        </div>
      </button>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="inline-flex w-full items-center justify-center rounded-lg border btn-contrast px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {copy.learnReveal}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border btn-tonal surface-hover px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          >
            <X className="h-4 w-4" aria-hidden />
            <span>{copy.learnForgot}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border btn-contrast px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          >
            <Check className="h-4 w-4" aria-hidden />
            <span>{copy.learnRemembered}</span>
          </button>
        </div>
      )}
    </section>
  );
};
