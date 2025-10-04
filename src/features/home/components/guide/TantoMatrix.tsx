import type { ReactElement } from 'react';
import { Fragment } from 'react';
import type { Locale } from '@shared/types';
import type { TantoCell } from '@shared/types/exam';
import { TANTO_COLUMNS, TANTO_ROWS } from '@shared/data/tantoTechniquesData';

type TantoMatrixProps = {
  locale: Locale;
  isDark?: boolean;
  onCellClick: (slug: string, attackKey: string) => void;
};

const CheckIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-circle-check-icon lucide-circle-check inline-block"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const TantoCellComponent = ({ cell }: { cell: TantoCell }): ReactElement | null => {
  if (cell.kind === 'empty') {
    return null;
  }

  if (cell.kind === 'check') {
    return <CheckIcon />;
  }

  return null;
};

export const TantoMatrix = ({ locale, onCellClick }: TantoMatrixProps): ReactElement => {
  return (
    <div className="space-y-4">
      {/* Table container with horizontal scroll on small screens */}
      <div className="overflow-x-auto rounded-xl border surface-border shadow-sm">
        <table role="grid" className="w-full border-collapse text-sm">
          <thead>
            {/* Column header row */}
            <tr className="surface border-b surface-border">
              <th className="md:sticky left-0 surface z-10 px-3 py-1 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border" style={{ minWidth: '160px', width: '160px' }}>
                {locale === 'en' ? 'Technique' : 'Technik'}
              </th>
              {TANTO_COLUMNS.map((col) => {
                const isTall = col.key === 'sode_dori_tanto_yoko_tsuki_soto';
                return (
                  <th
                    key={col.key}
                    className="px-1 py-4 text-center font-medium text-xs relative overflow-hidden border-r surface-border"
                    style={{ minWidth: '48px', width: '48px', height: isTall ? '240px' : '200px' }}
                  >
                    <div className="absolute inset-0 flex items-end justify-center px-1 py-2">
                      <span
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg) translateY(4px)' }}
                        className="leading-tight"
                      >
                        {col.label[locale]}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TANTO_ROWS.map((row) => {
              return (
                <Fragment key={row.id}>
                  <tr className="border-b surface-border">
                    {/* Row header (technique name) */}
                    <th
                      scope="row"
                      className="md:sticky left-0 surface z-10 px-3 py-2 text-left font-medium border-r surface-border whitespace-nowrap"
                      style={{ minWidth: '160px', width: '160px' }}
                    >
                      {row.label[locale]}
                    </th>

                    {/* Data cells */}
                    {TANTO_COLUMNS.map((col) => {
                      const cell = row.cells[col.key];
                      const isEmpty = cell.kind === 'empty';

                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-1 text-center transition-colors border-r surface-border ${
                            isEmpty ? '' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]'
                          }`}
                          onClick={() => !isEmpty && onCellClick(row.id, col.key)}
                          tabIndex={isEmpty ? -1 : 0}
                          role="gridcell"
                        >
                          <TantoCellComponent cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
