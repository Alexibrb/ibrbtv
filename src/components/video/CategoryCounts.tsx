'use client';

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
import type { Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Category = { name: string };

export function CategoryCounts() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: videos, loading: videosLoading } = useCollection<Video>('videos');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');

  const categoryStats = useMemo(() => {
    if (!videos || !categories) return null;

    const counts: { [key: string]: number } = {};
    
    categories.forEach(cat => {
      counts[cat.name] = 0;
    });

    videos.forEach(video => {
      if (video.category && counts.hasOwnProperty(video.category)) {
        counts[video.category]++;
      }
    });
    
    const totalVideos = videos.length;

    return { counts, totalVideos };
  }, [videos, categories]);

  if (videosLoading || categoriesLoading) {
    return (
        <div className="flex items-center gap-2 py-2">
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
  }

  if (!categoryStats || Object.keys(categoryStats.counts).length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between bg-muted/20 p-3 rounded-xl border border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-md">
            <span className="text-xs font-bold uppercase mr-3 opacity-90 whitespace-nowrap">Total de Vídeos</span>
            <span className="text-lg font-black">{categoryStats.totalVideos}</span>
          </div>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 gap-2 hover:bg-primary/10 hover:text-primary transition-colors px-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold hidden sm:inline">
              {isOpen ? 'Ocultar Detalhes' : 'Ver Estatísticas'}
            </span>
            {isOpen ? <ChevronUp className="h-5 w-5 opacity-50" /> : <ChevronDown className="h-5 w-5 opacity-50" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-background/40 rounded-xl border border-border/10 shadow-inner">
          {Object.entries(categoryStats.counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([category, count]) => (
              <div key={category} className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/10 border border-border/5 hover:bg-secondary/20 transition-colors shadow-sm min-h-[100px]">
                <span className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-tight text-center w-full mb-2 px-1 leading-tight line-clamp-2">
                  {category}
                </span>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {count}
                </span>
              </div>
            ))
          }
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
