'use client';

import VideoDashboard from '@/components/video/VideoDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryCounts } from '@/components/video/CategoryCounts';


export default function WatchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Tela Inicial
            </Link>
          </Button>
          <CategoryCounts />
       </div>
      <VideoDashboard />
    </div>
  );
}
