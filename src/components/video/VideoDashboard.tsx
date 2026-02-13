'use client';

import { useState, useEffect } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio } from 'lucide-react';
import { Badge } from '../ui/badge';
import { liveVideo as initialLiveVideo, pastVideos as initialPastVideos } from '@/lib/videos';
import { Skeleton } from '../ui/skeleton';

const STORAGE_KEY = 'videos';

export default function VideoDashboard() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadVideos() {
      setIsLoading(true);
      try {
        const storedVideosRaw = localStorage.getItem(STORAGE_KEY);
        if (storedVideosRaw) {
          setAllVideos(JSON.parse(storedVideosRaw));
        } else {
          // Seed local storage with initial data if it's empty
          const initialVideos = [initialLiveVideo, ...initialPastVideos];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialVideos));
          setAllVideos(initialVideos);
        }
      } catch (error) {
        console.error("Failed to load videos from localStorage", error);
        // Fallback to initial data if localStorage fails
        setAllVideos([initialLiveVideo, ...initialPastVideos]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVideos();

    // Listen for custom event to update video list
    window.addEventListener('videos-updated', loadVideos);

    return () => {
      window.removeEventListener('videos-updated', loadVideos);
    };
  }, []);

  useEffect(() => {
    if (allVideos.length > 0) {
      const live = allVideos.find(v => v.isLive);
      if (live) {
        setCurrentVideo(live);
      } else {
        // Find the most recent non-live video
        const sorted = [...allVideos].filter(v => !v.isLive).sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        setCurrentVideo(sorted[0] || null);
      }
    } else {
        setCurrentVideo(null);
    }
  }, [allVideos]);


  const handleSelectVideo = (video: Video) => {
    if (!video.isLive && !video.youtubeUrl.includes('autoplay=1')) {
      const urlWithAutoplay = new URL(video.youtubeUrl);
      urlWithAutoplay.searchParams.set('autoplay', '1');
      setCurrentVideo({ ...video, youtubeUrl: urlWithAutoplay.toString() });
    } else {
      setCurrentVideo(video);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
          {currentVideo ? (
            <>
              <div className="aspect-video w-full bg-card">
                <iframe
                  key={currentVideo.id}
                  width="100%"
                  height="100%"
                  src={currentVideo.youtubeUrl}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="border-0"
                ></iframe>
              </div>
              <CardHeader>
                <CardTitle className="font-headline text-3xl">{currentVideo.title}</CardTitle>
                <CardDescription className="pt-2">{currentVideo.summary}</CardDescription>
              </CardHeader>
            </>
          ) : (
             <CardContent className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="font-headline text-2xl">Nenhum vídeo encontrado</h2>
                    <p className="text-muted-foreground mt-2">Adicione um vídeo na área de administração para começar.</p>
                </div>
             </CardContent>
          )}
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Catálogo de Vídeos</CardTitle>
            <CardDescription>Selecione um vídeo para assistir</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="flex flex-col gap-4">
                {allVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={cn(
                      'group flex items-center gap-4 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
                      currentVideo?.id === video.id && 'bg-accent/80'
                    )}
                    aria-current={currentVideo?.id === video.id}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {video.isLive ? (
                        <Radio className="h-6 w-6 animate-pulse" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-card-foreground">{video.title}</p>
                      {video.isLive && (
                        <Badge variant="destructive" className="mt-1 animate-pulse">
                          AO VIVO
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <Skeleton className="aspect-video w-full" />
                <div className="space-y-2 px-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="flex items-center gap-4 p-3">
                            <Skeleton className="h-12 w-12 rounded-md" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-4 w-full" />
                            </div>
                         </div>
                       ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
