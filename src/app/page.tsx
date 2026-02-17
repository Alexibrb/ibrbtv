
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center space-y-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Bem-vindo à I.B.R.B TV
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
          Sua plataforma para evangelização através de transmissões ao vivo e replays.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/watch">
            Assistir Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/admin/login">
            <LogIn className="mr-2 h-5 w-5" />
            Acesso Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
