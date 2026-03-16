'use client';

import VideoDashboard, { DashboardSkeleton } from '@/components/video/VideoDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryCounts } from '@/components/video/CategoryCounts';
import { Suspense } from 'react';


export default function WatchPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
       <div className="mb-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <Button asChild variant="outline" size="sm" className="h-8">
               <Link href="/">
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 <span className="hidden sm:inline">Voltar à Tela Inicial</span>
                 <span className="sm:hidden">Início</span>
               </Link>
             </Button>
          </div>
          <CategoryCounts />
       </div>
       <Suspense fallback={<DashboardSkeleton />}>
        <VideoDashboard />
       </Suspense>
    </div>
  );
}
