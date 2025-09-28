import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';

type AboutPageProps = {
  copy: Copy;
};

export const AboutPage = ({ copy }: AboutPageProps): ReactElement => (
  <section className="py-12 px-6">
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.aboutTitle}</h1>
      <p className="text-base text-subtle leading-relaxed">{copy.aboutBody}</p>
    </div>
  </section>
);
