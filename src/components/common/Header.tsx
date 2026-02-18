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
    <header className="w-full border-b bg-background">
      <div className="container flex h-32 items-center justify-center">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-24 w-48" />
            ) : (
              <Image
                src={logoUrl}
                alt="I.B.R.B TV Logo"
                width={200}
                height={100}
                priority
                className="h-24 w-auto"
              />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
