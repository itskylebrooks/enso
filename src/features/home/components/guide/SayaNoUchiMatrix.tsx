import type { ReactElement } from 'react';
import { Fragment } from 'react';
import type { Locale } from '@shared/types';
import type { SayaNoUchiCell } from '@shared/types/exam';
import { SAYA_NO_UCHI_COLUMNS, SAYA_NO_UCHI_ROWS } from '@shared/data/sayaNoUchiData';
import { CircleCheck } from 'lucide-react';

type SayaNoUchiMatrixProps = {
  locale: Locale;
  isDark: boolean;
  onCellClick: (slug: string, attackKey: string) => void;
};

const SayaNoUchiCellComponent = ({ cell }: { cell: SayaNoUchiCell }): ReactElement | null => {
  if (cell.kind === 'empty') {
    return null;
  }

  if (cell.kind === 'check') {
    return <CircleCheck className="inline-block h-5 w-5" />;
  }

  return null;
};

export const SayaNoUchiMatrix = ({ locale, onCellClick }: SayaNoUchiMatrixProps): ReactElement => {
  // Group columns by section
  const tachiWazaCols = SAYA_NO_UCHI_COLUMNS.filter((col) => col.section === 'tachi_waza');
  const hanmiHantachiCols = SAYA_NO_UCHI_COLUMNS.filter((col) => col.section === 'hanmi_hantachi');
  const bukiWazaCols = SAYA_NO_UCHI_COLUMNS.filter((col) => col.section === 'buki_waza');

  return (
    <div className="space-y-4">
      {/* Table container with horizontal scroll on small screens */}
      <div className="overflow-x-auto rounded-xl border surface-border shadow-sm">
        <table role="grid" className="w-full border-collapse text-sm">
          <thead>
            {/* Section header row */}
            <tr className="surface border-b-2 surface-border">
              <th
                className="md:sticky left-0 surface z-10 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border"
                style={{ minWidth: '160px', width: '160px' }}
              >
                {/* Empty corner cell */}
              </th>
              <th
                colSpan={tachiWazaCols.length}
                className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide border-r-2 surface-border"
              >
                {locale === 'en' ? 'Tachi Waza' : 'Tachi Waza'}
              </th>
              <th
                colSpan={hanmiHantachiCols.length}
                className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide border-r-2 surface-border"
              >
                {locale === 'en' ? 'Hanmi Hantachi' : 'Hanmi Hantachi'}
              </th>
              <th
                colSpan={bukiWazaCols.length}
                className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide"
              >
                {locale === 'en' ? 'Buki Waza' : 'Buki Waza'}
              </th>
            </tr>
            {/* Column header row */}
            <tr className="surface border-b surface-border">
              <th
                className="md:sticky left-0 surface z-10 px-3 py-1 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border"
                style={{ minWidth: '160px', width: '160px' }}
              >
                {locale === 'en' ? 'Technique' : 'Technik'}
              </th>
              {SAYA_NO_UCHI_COLUMNS.map((col, idx) => {
                const isLastInSection =
                  (col.section === 'tachi_waza' && idx === tachiWazaCols.length - 1) ||
                  (col.section === 'hanmi_hantachi' &&
                    idx === tachiWazaCols.length + hanmiHantachiCols.length - 1);
                const isBoldSeparator = isLastInSection;

                return (
                  <th
                    key={col.key}
                    className={`px-1 py-4 text-center font-medium text-xs relative overflow-hidden ${
                      isBoldSeparator ? 'border-r-2 surface-border' : 'border-r surface-border'
                    }`}
                    style={{ minWidth: '48px', width: '48px', height: '200px' }}
                  >
                    <div className="absolute inset-0 flex items-end justify-center px-1 py-2">
                      <span className="vertical-header leading-tight">{col.label[locale]}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SAYA_NO_UCHI_ROWS.map((row) => {
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
                    {SAYA_NO_UCHI_COLUMNS.map((col, colIndex) => {
                      const cell = row.cells[col.key];
                      const isEmpty = cell.kind === 'empty';
                      const isLastInSection =
                        (col.section === 'tachi_waza' && colIndex === tachiWazaCols.length - 1) ||
                        (col.section === 'hanmi_hantachi' &&
                          colIndex === tachiWazaCols.length + hanmiHantachiCols.length - 1);
                      const isBoldSeparator = isLastInSection;

                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-1 text-center transition-colors ${
                            isBoldSeparator
                              ? 'border-r-2 surface-border'
                              : 'border-r surface-border'
                          } ${
                            isEmpty ? '' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]'
                          }`}
                          onClick={() => !isEmpty && onCellClick(row.id, col.key)}
                          tabIndex={isEmpty ? -1 : 0}
                          role="gridcell"
                        >
                          <SayaNoUchiCellComponent cell={cell} />
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
