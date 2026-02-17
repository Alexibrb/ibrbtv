
'use client';

import VideoDashboard from '@/components/video/VideoDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WatchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
       <Button asChild variant="outline" className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à Tela Inicial
          </Link>
        </Button>
      <VideoDashboard />
    </div>
  );
}
