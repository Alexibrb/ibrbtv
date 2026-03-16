'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type Category = { name: string };

export function CategoryCounts() {
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
        <div className="flex items-center gap-2 overflow-hidden py-1">
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            <Skeleton className="h-6 w-24 rounded-full shrink-0" />
        </div>
    );
  }

  if (!categoryStats || Object.keys(categoryStats.counts).length === 0) {
    return null;
  }

  return (
    <div className="w-full flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-border/30">
      <div className="shrink-0 flex items-center bg-primary text-primary-foreground px-2.5 py-1 rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase mr-1.5 opacity-80">Total</span>
          <span className="text-xs font-black">{categoryStats.totalVideos}</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth">
        {Object.entries(categoryStats.counts)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([category, count]) => (
            <div key={category} className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-md bg-background/40 border border-border/10">
              <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap uppercase tracking-tight">{category}</span>
              <span className="text-[10px] font-bold text-foreground/70">{count}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
