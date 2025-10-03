import { useState, useEffect, type ReactElement } from 'react';
import type { Quote } from '@shared/data/quotes';

interface QuoteRotatorProps {
  quotes: Quote[];
}

export const QuoteRotator = ({ quotes }: QuoteRotatorProps): ReactElement => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (quotes.length > 0) {
      // Pick a random quote on mount
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
    }
  }, [quotes]);

  if (quotes.length === 0 || !currentQuote) {
    return <div className="text-subtle">No quotes available</div>;
  }

  return (
    <div className="space-y-4">
      <blockquote className="text-sm md:text-base leading-6 md:leading-7 text-subtle italic">
        "{currentQuote.quote}"
      </blockquote>
      <figcaption className="text-sm text-subtle">
        — {currentQuote.author}
      </figcaption>
    </div>
  );
};
