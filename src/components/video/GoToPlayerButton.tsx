'use client';

import { useState, useEffect, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpToLine } from 'lucide-react';
import { cn } from '@/lib/utils';

type GoToPlayerButtonProps = {
  playerRef: RefObject<HTMLDivElement>;
};

export default function GoToPlayerButton({ playerRef }: GoToPlayerButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const element = playerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isAboveScreen = entry.boundingClientRect.top < 0;
        const isOutOfView = !entry.isIntersecting;

        if (isOutOfView && isAboveScreen) {
          setShowButton(true);
        } else {
          setShowButton(false);
        }
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [playerRef]);

  const scrollToPlayer = () => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 transition-opacity duration-300',
        showButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <Button
        onClick={scrollToPlayer}
        size="lg"
        className="shadow-xl rounded-full"
        aria-label="Ir para o player"
      >
        <ArrowUpToLine className="mr-2 h-5 w-5" />
        Ir para o Player
      </Button>
    </div>
  );
}
