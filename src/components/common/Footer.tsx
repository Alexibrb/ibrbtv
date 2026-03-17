
'use client';

import { useDoc } from '@/firebase';
import Link from 'next/link';

type Settings = {
  websiteUrl?: string;
};

export function Footer() {
  const { data: settings } = useDoc<Settings>('settings/config');
  
  const fallbackUrl = 'https://www.ibrnobrasil.com.br';
  const websiteUrl = settings?.websiteUrl || fallbackUrl;

  return (
    <footer className="py-8 text-center bg-background border-t mt-12">
      <div className="container mx-auto px-4 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">
            Visite nosso site oficial:
          </p>
          <Link 
            href={websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-bold text-lg"
          >
            {websiteUrl.replace(/^https?:\/\//, '')}
          </Link>
        </div>
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
            Desenvolvido por: Alex Alves - 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
