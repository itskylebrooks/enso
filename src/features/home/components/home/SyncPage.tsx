import type { Copy } from '@shared/constants/i18n';
import { Gift, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';

type SyncPageProps = {
  copy: Copy;
};

export const SyncPage = ({ copy }: SyncPageProps): ReactElement => {
  const renderParagraphs = (text: string) =>
    text.split('\n').map((paragraph, index) => (
      <p key={index} className="text-base leading-relaxed">
        {paragraph}
      </p>
    ));

  const featureCards = [
    {
      title: copy.syncPage.paidFeatureTitle,
      body: copy.syncPage.paidFeatureBody,
      icon: ShieldCheck,
    },
    {
      title: copy.syncPage.localFirstTitle,
      body: copy.syncPage.localFirstBody,
      icon: Lock,
    },
    {
      title: copy.syncPage.exportImportTitle,
      body: copy.syncPage.exportImportBody,
      icon: Gift,
    },
  ];

  return (
    <section className="pt-0 pb-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="rounded-2xl border surface-border bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-blue-500/10 p-6 md:p-8 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {copy.syncPage.title}
            </h1>
            <Sparkles className="w-7 h-7 text-subtle shrink-0" aria-hidden />
          </div>
          <div className="space-y-3 text-base md:text-lg text-muted leading-relaxed">
            {renderParagraphs(copy.syncPage.intro)}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {featureCards.map(({ title, body, icon: Icon }) => (
            <article
              key={title}
              className="rounded-xl border surface-border surface p-4 space-y-2 card-hover-shadow"
            >
              <Icon className="w-5 h-5 text-subtle" aria-hidden />
              <h2 className="text-base font-semibold leading-tight">{title}</h2>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          {renderParagraphs(copy.syncPage.statusBody)}
        </div>
      </div>
    </section>
  );
};
