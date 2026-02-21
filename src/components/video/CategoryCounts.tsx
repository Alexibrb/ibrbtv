'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { Video } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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
        <div className="flex items-center flex-wrap gap-2">
            <Skeleton key="total" className="h-6 w-20 rounded-full" />
            <Skeleton key="cat1" className="h-6 w-24 rounded-full" />
            <Skeleton key="cat2" className="h-6 w-28 rounded-full" />
            <Skeleton key="cat3" className="h-6 w-20 rounded-full" />
        </div>
    );
  }

  if (!categoryStats || Object.keys(categoryStats.counts).length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default" className="text-sm">
          Total de Vídeos: <span className="font-bold ml-1.5">{categoryStats.totalVideos}</span>
      </Badge>
      {Object.entries(categoryStats.counts).sort((a, b) => a[0].localeCompare(b[0])).map(([category, count]) => (
        <Badge key={category} variant="secondary" className="font-normal">
          {category}: <span className="font-bold ml-1.5">{count}</span>
        </Badge>
      ))}
    </div>
  );
}
