import type { ReactElement } from 'react';
import { Fragment } from 'react';
import type { Locale } from '@shared/types';
import type { JoCell } from '@shared/types/exam';
import { JO_COLUMNS, JO_ROWS } from '@shared/data/joTechniquesData';
import { CircleCheck } from 'lucide-react';

type JoMatrixProps = {
  locale: Locale;
  isDark: boolean;
  onCellClick: (slug: string, attackKey: string) => void;
  copy: {
    joTechniquesLegendTitle: string;
    joTechniquesLegend1: string;
    joTechniquesLegend2: string;
    joTechniquesLegend3: string;
    joTechniquesLegend4: string;
  };
};

const JoCellComponent = ({ cell }: { cell: JoCell }): ReactElement | null => {
  if (cell.kind === 'empty') {
    return null;
  }

  if (cell.kind === 'check') {
    return <CircleCheck className="inline-block h-5 w-5" />;
  }

  return null;
};

export const JoMatrix = ({ locale, onCellClick, copy }: JoMatrixProps): ReactElement => {
  // Group columns by section
  const joNageWazaCols = JO_COLUMNS.filter(col => col.section === 'jo_nage_waza');
  const joToriCols = JO_COLUMNS.filter(col => col.section === 'jo_tori');

  return (
    <div className="space-y-4">
      {/* Table container with horizontal scroll on small screens */}
      <div className="overflow-x-auto rounded-xl border surface-border shadow-sm">
        <table role="grid" className="w-full border-collapse text-sm">
          <thead>
            {/* Section header row */}
            <tr className="surface border-b-2 surface-border">
              <th className="md:sticky left-0 surface z-10 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border" style={{ minWidth: '160px', width: '160px' }}>
                {/* Empty corner cell */}
              </th>
              <th 
                colSpan={joNageWazaCols.length} 
                className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide border-r-2 surface-border"
              >
                {locale === 'en' ? 'Jō Nage Waza' : 'Jō Nage Waza'}
              </th>
              <th 
                colSpan={joToriCols.length} 
                className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide"
              >
                {locale === 'en' ? 'Jō Tori' : 'Jō Tori'}
              </th>
            </tr>
            {/* Column header row */}
            <tr className="surface border-b surface-border">
              <th className="md:sticky left-0 surface z-10 px-3 py-1 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border" style={{ minWidth: '160px', width: '160px' }}>
                {locale === 'en' ? 'Technique' : 'Technik'}
              </th>
              {JO_COLUMNS.map((col, idx) => {
                const isLastInSection = col.section === 'jo_nage_waza' && idx === joNageWazaCols.length - 1;
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
            {JO_ROWS.map((row) => {
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
                    {JO_COLUMNS.map((col, colIndex) => {
                      const cell = row.cells[col.key];
                      const isEmpty = cell.kind === 'empty';
                      const isLastInSection = col.section === 'jo_nage_waza' && colIndex === joNageWazaCols.length - 1;
                      const isBoldSeparator = isLastInSection;

                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-1 text-center transition-colors ${
                            isBoldSeparator ? 'border-r-2 surface-border' : 'border-r surface-border'
                          } ${
                            isEmpty ? '' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]'
                          }`}
                          onClick={() => !isEmpty && onCellClick(row.id, col.key)}
                          tabIndex={isEmpty ? -1 : 0}
                          role="gridcell"
                        >
                          <JoCellComponent cell={cell} />
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

      {/* Legend */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">{copy.joTechniquesLegendTitle}</h3>
        <ul className="space-y-1 text-sm leading-relaxed">
          <li className="flex gap-2">
            <span aria-hidden className="text-base">•</span>
            <span>{copy.joTechniquesLegend1}</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-base">•</span>
            <span>{copy.joTechniquesLegend2}</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-base">•</span>
            <span>{copy.joTechniquesLegend3}</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-base">•</span>
            <span>{copy.joTechniquesLegend4}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
