import type { Copy } from '@shared/constants/i18n';
import { HandHeart, Server, Video, Zap } from 'lucide-react';
import type { ReactElement } from 'react';

type SupportPageProps = {
  copy: Copy;
};

export const SupportPage = ({ copy }: SupportPageProps): ReactElement => {
  const renderParagraphs = (text: string) =>
    text.split('\n').map((paragraph, index) => (
      <p key={index} className="text-base leading-relaxed">
        {paragraph}
      </p>
    ));

  const cards = [
    {
      title: copy.supportPage.speedCardTitle,
      body: copy.supportPage.speedCardBody,
      icon: Zap,
    },
    {
      title: copy.supportPage.hostingCardTitle,
      body: copy.supportPage.hostingCardBody,
      icon: Server,
    },
    {
      title: copy.supportPage.videoCardTitle,
      body: copy.supportPage.videoCardBody,
      icon: Video,
    },
  ];

  return (
    <section className="pt-0 pb-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="rounded-2xl border surface-border bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-amber-500/10 p-6 md:p-8 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {copy.supportPage.title}
            </h1>
            <HandHeart className="w-7 h-7 text-subtle shrink-0" aria-hidden />
          </div>
          <div className="space-y-3 text-base md:text-lg text-muted leading-relaxed">
            {renderParagraphs(copy.supportPage.intro)}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {cards.map(({ title, body, icon: Icon }) => (
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.supportPage.futureTitle}</h2>
          {renderParagraphs(copy.supportPage.futureBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.supportPage.impactTitle}</h2>
          {renderParagraphs(copy.supportPage.impactBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.supportPage.statusTitle}</h2>
          {renderParagraphs(copy.supportPage.statusBody)}
        </div>
      </div>
    </section>
  );
};
