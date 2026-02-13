import Link from 'next/link';
import { UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild>
            <Link href="/admin/login">
              <UserCog />
              <span>Admin</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
