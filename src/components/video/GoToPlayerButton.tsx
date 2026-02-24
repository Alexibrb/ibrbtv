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
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Mostra o botão se o player não estiver visível (ou seja, rolado para fora da tela por cima)
        setShowButton(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        root: null, // Observa em relação ao viewport
        threshold: 0.1, // O botão aparece quando menos de 10% do player está visível
      }
    );

    const currentRef = playerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
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
