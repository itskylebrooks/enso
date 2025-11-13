import type { ReactElement } from 'react';
import { useEffect, useState, Fragment } from 'react';
import type { Locale } from '@shared/types';
import type { GradeCell } from '@shared/types/exam';
import { ATTACK_COLUMNS, MATRIX_ROWS, KATAME_ROWS } from '@shared/data/examMatrixData';
import { getGradeStyle } from '@shared/styles/belts';
import type { Copy } from '@shared/constants/i18n';
import { MoveHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { defaultEase } from '@shared/components/ui/motion';

type ExamMatrixProps = {
  locale: Locale;
  copy: Copy;
  isDark: boolean;
  onCellClick: (slug: string, attackKey: string) => void;
};

const GradeCellComponent = ({ cell, isDark }: { cell: GradeCell; isDark: boolean }): ReactElement | null => {
  if (cell.kind === 'empty') {
    return null;
  }

  if (cell.kind === 'kyu') {
    const gradeKey = `kyu${cell.kyu}` as const;
  const style = getGradeStyle(gradeKey, isDark);
    
    return (
      <span
        className="inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-semibold"
        style={{
          backgroundColor: style.backgroundColor,
          color: style.color,
        }}
      >
        {cell.kyu}
      </span>
    );
  }

  if (cell.kind === 'dan') {
  const style = getGradeStyle('dan1', isDark);
    
    return (
      <span
        className="inline-flex items-center justify-center rounded-full px-2 h-7 text-xs font-semibold"
        style={{
          backgroundColor: style.backgroundColor,
          color: style.color,
        }}
      >
        1.D.
      </span>
    );
  }

  if (cell.kind === 'count') {
    return (
      <span className="inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-semibold bg-cyan-500 text-white">
        {cell.value}
      </span>
    );
  }

  if (cell.kind === 'dot') {
    return (
      <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-700"></span>
    );
  }

  return null;
};

export const ExamMatrix = ({ locale, copy, isDark, onCellClick }: ExamMatrixProps): ReactElement => {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);

  // Restore width mode from session (defaults to page-width)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('examMatrixWidthMode');
      setIsFullWidth(saved === 'full');
    } catch {
      // no-op
    }
  }, []);

  const toggleWidth = () => {
    setIsFullWidth((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('examMatrixWidthMode', next ? 'full' : 'page');
      } catch {
        // no-op
      }
      return next;
    });
  };

  const allRows = [...MATRIX_ROWS, ...KATAME_ROWS];
  const insertKatameSeparator = MATRIX_ROWS.length;

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    let newRow = rowIndex;
    let newCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(allRows.length - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(-1, colIndex - 1); // -1 is for row header
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(ATTACK_COLUMNS.length - 1, colIndex + 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (colIndex !== -1) {
          // Cell clicked (skip row header)
          const attackKey = ATTACK_COLUMNS[colIndex].key;
          const cell = allRows[rowIndex].cells[attackKey];
          if (cell && cell.kind !== 'empty') {
            onCellClick(allRows[rowIndex].id, attackKey);
          }
        }
        return;
      default:
        return;
    }

    setFocusedCell({ row: newRow, col: newCol });
    // Focus will be set by useEffect or similar mechanism
  };

  return (
    <div className="space-y-4">
      {/* Lead text */}
      <p className="text-sm text-subtle leading-relaxed">{copy.examMatrixLead}</p>

      {/* Table container with horizontal scroll on small screens */}
      <motion.div layout transition={{ duration: 0.24, ease: defaultEase }} className={
        isFullWidth ? 'md:relative md:left-1/2 md:-ml-[50vw] md:w-screen' : ''
      }>
        <motion.div layout transition={{ duration: 0.24, ease: defaultEase }} className={
          isFullWidth
            ? 'relative md:max-w-[calc(100vw-48px)] md:mx-auto md:flex md:justify-center'
            : 'relative'
        }>
          {/* Framed card around the table */}
          <motion.div
            layout
            transition={{ duration: 0.24, ease: defaultEase }}
            className={
              isFullWidth
                ? 'relative inline-block rounded-xl border surface-border surface overflow-hidden shadow-sm'
                : 'relative rounded-xl border surface-border surface overflow-hidden shadow-sm'
            }
          >
            {/* Inner scroll container (collapsed mode) */}
            <div className={isFullWidth ? '' : 'overflow-x-auto'}>
          {/* Top-left width toggle (desktop only) */}
          <button
            type="button"
            onClick={toggleWidth}
            className="hidden md:inline-flex items-center justify-center gap-1 absolute top-2 left-2 z-20 px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            aria-pressed={isFullWidth}
            aria-label={isFullWidth ? (locale === 'de' ? 'Auf Seitenbreite begrenzen' : 'Constrain to page width') : (locale === 'de' ? 'Auf volle Breite erweitern' : 'Expand to full width')}
            title={isFullWidth ? (locale === 'de' ? 'Auf Seitenbreite begrenzen' : 'Constrain to page width') : (locale === 'de' ? 'Auf volle Breite erweitern' : 'Expand to full width')}
          >
            <MoveHorizontal className="w-4 h-4" aria-hidden />
            <span className="sr-only">{isFullWidth ? 'Page width' : 'Full width'}</span>
          </button>

              <table role="grid" className={`${isFullWidth ? 'w-max' : 'w-full'} border-collapse text-sm`}>
          <thead>
            <tr className="surface border-b surface-border">
              <th className="md:sticky left-0 surface z-10 px-3 py-1 text-left font-semibold text-xs uppercase tracking-wide border-r surface-border" style={{ minWidth: '220px', width: '220px' }}>
                {locale === 'en' ? 'Technique' : 'Technik'}
              </th>
              {ATTACK_COLUMNS.map((col) => {
                const isBoldSeparator = col.key === 'yoko_kubi_shime' || col.key === 'ushiro_kubi_shime';
                return (
                  <th
                    key={col.key}
                    className={`px-1 py-4 text-center font-medium text-xs relative overflow-hidden ${
                      isBoldSeparator ? 'border-r-2 surface-border' : 'border-r surface-border'
                    }`}
                    style={{ minWidth: '48px', width: '48px', height: '200px' }}
                  >
                    {/* Vertical header anchored to the bottom-left using writing-mode so it stays inside the cell */}
                    <div className="absolute inset-0 flex items-end justify-center px-1 py-2">
                      <span className="vertical-header leading-tight">{col.label[locale]}</span>
                    </div>
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center font-semibold text-xs uppercase tracking-wide border-l surface-border" style={{ minWidth: '50px' }}>
                {/* Section label column header - empty */}
              </th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, rowIndex) => {
              const isFirstNageRow = rowIndex === 0;
              const isFirstKatameRow = rowIndex === insertKatameSeparator;
              const isLastNageRow = rowIndex === MATRIX_ROWS.length - 1;
              
              return (
                <Fragment key={row.id}>
                  <tr className={`border-b surface-border ${isLastNageRow ? 'border-b-2' : ''}`}>
                    {/* Row header (technique name) */}
                    <th
                      scope="row"
                      className="md:sticky left-0 surface z-10 px-3 py-1 text-left font-medium border-r surface-border whitespace-nowrap"
                      style={{ minWidth: '220px', width: '220px' }}
                      role="gridcell"
                    >
                      {row.label[locale]}
                    </th>

                    {/* Data cells */}
                    {ATTACK_COLUMNS.map((col, colIndex) => {
                      const cell = row.cells[col.key] || { kind: 'empty' as const };
                      const isEmpty = cell.kind === 'empty';
                      const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
                      const isBoldSeparator = col.key === 'yoko_kubi_shime' || col.key === 'ushiro_kubi_shime';

                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-1 text-center transition-colors ${
                            isBoldSeparator ? 'border-r-2 surface-border' : 'border-r surface-border'
                          } ${
                            isEmpty ? '' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]'
                          } ${isFocused ? 'ring-2 ring-inset ring-[var(--color-text)]' : ''}`}
                          onClick={() => !isEmpty && onCellClick(row.id, col.key)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          tabIndex={isEmpty ? -1 : 0}
                          role="gridcell"
                        >
                          <GradeCellComponent cell={cell} isDark={isDark} />
                        </td>
                      );
                    })}

                    {/* Section label cell (with rowspan for first row of each section) */}
                    {isFirstNageRow && (
                      <td
                        rowSpan={MATRIX_ROWS.length}
                        className="border-l surface-border text-center font-semibold text-xs uppercase tracking-wide text-subtle relative"
                        style={{ minWidth: '50px' }}
                      >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center -rotate-90 whitespace-nowrap">
                          {copy.examMatrixSectionNage}
                        </div>
                      </td>
                    )}
                    {isFirstKatameRow && (
                      <td
                        rowSpan={KATAME_ROWS.length}
                        className="border-l surface-border text-center font-semibold text-xs uppercase tracking-wide text-subtle relative"
                        style={{ minWidth: '50px' }}
                      >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center -rotate-90 whitespace-nowrap">
                          {copy.examMatrixSectionKatameShort}
                        </div>
                      </td>
                    )}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
