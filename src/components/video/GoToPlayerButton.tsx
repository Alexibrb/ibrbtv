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
    const handleScroll = () => {
      if (playerRef.current) {
        // getBoundingClientRect().bottom will be negative when the entire element
        // is above the viewport.
        const isScrolledPast = playerRef.current.getBoundingClientRect().bottom < 0;
        setShowButton(isScrolledPast);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check in case the page loads already scrolled down
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
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
