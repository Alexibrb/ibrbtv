import Link from 'next/link';
import Image from 'next/image';
import { UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const logoUrl = "https://www.ibrnobrasil.com.br/files/2025/06/logopngradioweb2025400x200.png";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={logoUrl}
              alt="I.B.R.B TV Logo"
              width={200}
              height={100}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild>
            <Link href="/admin/login">
              <UserCog />
              <span>Admin</span>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
