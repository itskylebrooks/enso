import type { Copy } from '@shared/constants/i18n';
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

  return (
    <section className="pt-0 pb-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            {copy.syncPage.title}
          </h1>
        </header>

        <div className="space-y-4">{renderParagraphs(copy.syncPage.intro)}</div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.whatItWillDoTitle}</h2>
          {renderParagraphs(copy.syncPage.whatItWillDoBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.whatItWillNotDoTitle}</h2>
          {renderParagraphs(copy.syncPage.whatItWillNotDoBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.localFirstTitle}</h2>
          {renderParagraphs(copy.syncPage.localFirstBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.exportImportTitle}</h2>
          {renderParagraphs(copy.syncPage.exportImportBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.paidFeatureTitle}</h2>
          {renderParagraphs(copy.syncPage.paidFeatureBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.syncPage.statusTitle}</h2>
          {renderParagraphs(copy.syncPage.statusBody)}
        </div>
      </div>
    </section>
  );
};
