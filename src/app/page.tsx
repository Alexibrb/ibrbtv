import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CategoryCounts } from '@/components/video/CategoryCounts';

export default function LandingPage() {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center space-y-8 px-4 py-12 text-center">
      <div className="space-y-4">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Seja Bem-vindo
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-foreground/70 md:text-xl">
          Sua plataforma para evangelização através de transmissões ao vivo e replays.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild size="lg" variant="destructive" className="h-12 px-8 text-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
          <Link href="/watch">
            Assistir Agora
            <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12">
          <Link href="/admin/login">
            <LogIn className="mr-2 h-5 w-5" />
            Acesso Admin
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md pt-4">
        <CategoryCounts />
      </div>
    </div>
  );
}
