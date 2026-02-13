'use client';

import { useState } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio } from 'lucide-react';
import { Badge } from '../ui/badge';

interface VideoDashboardProps {
  liveVideo: Video;
  pastVideos: Video[];
}

export default function VideoDashboard({ liveVideo, pastVideos }: VideoDashboardProps) {
  const [currentVideo, setCurrentVideo] = useState<Video>(liveVideo);

  const allVideos = [liveVideo, ...pastVideos];

  const handleSelectVideo = (video: Video) => {
    // For non-live videos, we add autoplay. For the live one, it's already in the URL.
    if (!video.isLive && !video.youtubeUrl.includes('autoplay=1')) {
      const urlWithAutoplay = new URL(video.youtubeUrl);
      urlWithAutoplay.searchParams.set('autoplay', '1');
      setCurrentVideo({ ...video, youtubeUrl: urlWithAutoplay.toString() });
    } else {
      setCurrentVideo(video);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
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
                      currentVideo.id === video.id && 'bg-accent/80'
                    )}
                    aria-current={currentVideo.id === video.id}
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
