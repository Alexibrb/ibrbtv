'use client';

import Link from 'next/link';
import Image from 'next/image';

import { useDoc } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

type Settings = {
  logoUrl: string;
};

export function Header() {
  const { data: settings, loading } = useDoc<Settings>('settings/config');

  // Fallback logo if nothing is configured in Firestore
  const fallbackLogoUrl =
    'https://www.ibrnobrasil.com.br/files/2025/06/logopngradioweb2025400x200.png';

  const logoUrl = settings?.logoUrl || fallbackLogoUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-52 items-center justify-center">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-48 w-96" />
            ) : (
              <Image
                src={logoUrl}
                alt="I.B.R.B TV Logo"
                width={400}
                height={200}
                priority
                className="h-48 w-auto"
              />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
