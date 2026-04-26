import type { LearnCard, LearnOrder, LearnQueueState } from './types';

export const shuffleLearnCards = (
  cards: LearnCard[],
  random: () => number = Math.random,
): LearnCard[] => {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const orderLearnCards = (
  cards: LearnCard[],
  order: LearnOrder,
  random: () => number = Math.random,
): LearnCard[] => (order === 'random' ? shuffleLearnCards(cards, random) : [...cards]);

export const createLearnQueueState = (cards: LearnCard[]): LearnQueueState => ({
  queue: [...cards],
  rememberedCount: 0,
  missedCount: 0,
  totalCount: cards.length,
});

export const answerCurrentLearnCard = (
  state: LearnQueueState,
  remembered: boolean,
): LearnQueueState => {
  const [current, ...rest] = state.queue;
  if (!current) return state;

  if (remembered) {
    return {
      ...state,
      queue: rest,
      rememberedCount: state.rememberedCount + 1,
    };
  }

  return {
    ...state,
    queue: [...rest, current],
    missedCount: state.missedCount + 1,
  };
};
