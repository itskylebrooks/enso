'use client';

import { motion } from 'motion/react';
import { useMemo, type ReactElement } from 'react';

type ConfettiPiece = {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
};

const COLORS = ['#f97316', '#14b8a6', '#eab308', '#38bdf8', '#f43f5e', '#22c55e'];

const randomBetween = (min: number, max: number): number => Math.random() * (max - min) + min;

const createPieces = (count: number): ConfettiPiece[] =>
  Array.from({ length: count }, (_, id) => ({
    id,
    left: randomBetween(2, 98),
    size: randomBetween(6, 11),
    delay: randomBetween(0, 0.25),
    duration: randomBetween(1.5, 2.2),
    drift: randomBetween(-110, 110),
    rotate: randomBetween(360, 900),
    color: COLORS[id % COLORS.length],
  }));

export const ConfettiBurst = (): ReactElement => {
  const pieces = useMemo(() => createPieces(42), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute block rounded-[2px]"
          style={{
            left: `${piece.left}%`,
            top: '-12vh',
            width: `${piece.size}px`,
            height: `${Math.round(piece.size * 0.58)}px`,
            backgroundColor: piece.color,
          }}
          initial={{ y: '-8vh', x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: '112vh',
            x: piece.drift,
            rotate: piece.rotate,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut',
            times: [0, 0.12, 0.84, 1],
          }}
        />
      ))}
    </div>
  );
};
