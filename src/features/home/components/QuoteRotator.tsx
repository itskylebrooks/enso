import { useState, useEffect, useRef, type ReactElement } from 'react';

interface Quote {
  text: string;
  author: string;
}

interface QuoteRotatorProps {
  quotes: Quote[];
}

export const QuoteRotator = ({ quotes }: QuoteRotatorProps): ReactElement => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsVisible(true);
      }, 250); // Half of transition duration
    }, 12000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (quotes.length > 1) {
      startInterval();
    }
    return () => stopInterval();
  }, [quotes.length]);

  const handleMouseEnter = () => {
    stopInterval();
  };

  const handleMouseLeave = () => {
    if (quotes.length > 1) {
      startInterval();
    }
  };

  if (quotes.length === 0) {
    return <div className="text-white/60">No quotes available</div>;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <div
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="space-y-4"
    >
      <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <blockquote className="text-base md:text-lg leading-6 md:leading-7 text-white/90 italic">
          "{currentQuote.text}"
        </blockquote>
        <div className="border-t border-white/10 my-4"></div>
        <figcaption className="text-sm text-white/70">
          — {currentQuote.author}
        </figcaption>
      </div>
    </div>
  );
};