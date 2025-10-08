import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';

type FooterProps = {
  copy: Copy;
};

export const Footer = ({ copy }: FooterProps): ReactElement => {
  const year = new Date().getFullYear();

  const imprint = 'https://itskylebrooks.vercel.app/imprint';
  const privacy = 'https://itskylebrooks.vercel.app/privacy';
  const license = 'https://itskylebrooks.vercel.app/license';

  const labels = copy as unknown as Record<string, string>;
  const imprintLabel = labels.footerImprint ?? 'Imprint';
  const privacyLabel = labels.footerPrivacy ?? 'Privacy Policy';
  const licenseLabel = labels.footerLicense ?? 'License';

  return (
    <footer className="w-full">
      <div className="w-full bg-transparent">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 text-sm">
          <div className="text-neutral-600 dark:text-neutral-400">
            {/* Mobile: stack links on top, copyright below. Desktop: single-line with justify-between */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 items-center">
              <div className="flex items-center gap-4 justify-center md:justify-end shrink-0 whitespace-nowrap md:order-2">
                <a className="underline text-neutral-600 dark:text-neutral-400" href={imprint} target="_blank" rel="noopener noreferrer">{imprintLabel}</a>
                <a className="underline text-neutral-600 dark:text-neutral-400" href={privacy} target="_blank" rel="noopener noreferrer">{privacyLabel}</a>
                <a className="underline text-neutral-600 dark:text-neutral-400" href={license} target="_blank" rel="noopener noreferrer">{licenseLabel}</a>
              </div>

              <div className="truncate text-center md:text-left md:order-1">© {year} Kyle Brooks. {copy.copyrightReserved}</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
