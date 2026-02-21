'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '../ui/input';
import CountdownTimer from './CountdownTimer';
import { Button } from '../ui/button';
import { useCollection, WithId } from '@/firebase';
import { orderBy } from 'firebase/firestore';


const ALL_CATEGORIES = 'Todos';
type Category = { name: string };

export default function VideoDashboard() {
  const [currentVideo, setCurrentVideo] = useState<WithId<Video> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [finishedCountdownIds, setFinishedCountdownIds] = useState<string[]>([]);
  const [now, setNow] = useState(new Date());
  const [shuffledPastVideos, setShuffledPastVideos] = useState<WithId<Video>[]>([]);

  const { data: allVideos, loading: videosLoading } = useCollection<Video>('videos', orderBy('createdAt', 'desc'));

  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>('categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(categoriesData?.map(c => c.name) || [])].sort();
    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [categoriesData]);
  

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000); // every minute
    return () => clearInterval(timer);
  }, []);
  
  const handleCountdownComplete = (videoId: string) => {
    setFinishedCountdownIds(prev => [...new Set([...prev, videoId])]);
  };
  
  const liveVideo = allVideos?.find(v => v.isLive);
  
  const scheduledVideos = useMemo(() => 
    allVideos
      ?.filter(v => !v.isLive && v.scheduledAt && new Date(v.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()) || [],
    [allVideos, now]
  );

  const pastVideos = useMemo(() =>
    allVideos?.filter(v => !v.isLive && (!v.scheduledAt || new Date(v.scheduledAt) <= now)) || [],
    [allVideos, now]
  );
  
  useEffect(() => {
    // This effect runs only on the client-side after hydration to prevent
    // hydration mismatch errors from using Math.random(). It shuffles the
    // list of past videos to display them in a random order on each page load
    // or when the list of videos changes.
    setShuffledPastVideos([...pastVideos].sort(() => Math.random() - 0.5));
  }, [pastVideos]);
  
  const filteredList = useMemo(() => {
    const basePastList = selectedCategory === ALL_CATEGORIES ? shuffledPastVideos : pastVideos;
    
    let list = [...scheduledVideos, ...basePastList];

    if (selectedCategory !== ALL_CATEGORIES) {
      list = list.filter(video => video.category === selectedCategory);
    }

    if (searchTerm) {
      list = list.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return list;
  }, [scheduledVideos, pastVideos, shuffledPastVideos, selectedCategory, searchTerm]);

  const filteredVideos = liveVideo ? [liveVideo, ...filteredList] : filteredList;

  useEffect(() => {
    const isCurrentVideoVisible = currentVideo && filteredVideos.some(v => v.id === currentVideo.id);

    if (filteredVideos.length > 0 && !isCurrentVideoVisible) {
      const live = filteredVideos.find(v => v.isLive);
      if (live) {
        setCurrentVideo(live);
      } else {
        const firstPlayable = filteredVideos.find(v => !v.scheduledAt || new Date(v.scheduledAt) <= now);
        setCurrentVideo(firstPlayable || null);
      }
    } else if (filteredVideos.length === 0) {
        setCurrentVideo(null);
    }
  }, [filteredVideos, currentVideo, now]);


  const handleSelectVideo = (video: WithId<Video>) => {
    if (!video.isLive && video.youtubeUrl && !video.youtubeUrl.includes('autoplay=1')) {
      try {
        const urlWithAutoplay = new URL(video.youtubeUrl);
        urlWithAutoplay.searchParams.set('autoplay', '1');
        setCurrentVideo({ ...video, youtubeUrl: urlWithAutoplay.toString() });
      } catch (e) {
        setCurrentVideo(video);
      }
    } else {
      setCurrentVideo(video);
    }
  };

  if (videosLoading || categoriesLoading) {
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
                    <p className="text-muted-foreground mt-2">Tente selecionar outra categoria ou adicione um vídeo na área de administração.</p>
                </div>
             </CardContent>
          )}
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle className="font-headline">Catálogo de Vídeos</CardTitle>
             <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Input
                  placeholder="Filtrar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-1/2"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={categoriesLoading}>
                    <SelectTrigger className="w-full sm:w-1/2">
                        <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Filtrar por categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[46vh] pr-4">
              <div className="flex flex-col gap-4">
                {filteredVideos.map((video) => {
                  const isFinishedCountdown = finishedCountdownIds.includes(video.id);

                  if (isFinishedCountdown) {
                    return (
                        <div key={video.id} className="group flex flex-col items-start gap-2 rounded-lg border border-primary/50 bg-primary/5 p-3 text-left">
                            <p className="font-semibold text-card-foreground">{video.title}</p>
                            <Badge variant="default" className="mt-1">DISPONÍVEL AGORA</Badge>
                            <Button onClick={() => window.location.reload()} size="sm" className="mt-2">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Atualizar para assistir
                            </Button>
                        </div>
                    );
                  }
                  
                  const isScheduledFuture = !video.isLive && video.scheduledAt && new Date(video.scheduledAt) > now;
                  if (isScheduledFuture) {
                      return (
                          <div key={video.id} className="group flex flex-col items-start gap-2 rounded-lg border p-3 text-left">
                              <p className="font-semibold text-card-foreground">{video.title}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>Começa em:</span>
                              </div>
                              <CountdownTimer
                                  targetDate={video.scheduledAt!}
                                  onComplete={() => handleCountdownComplete(video.id)}
                                  className="w-full text-lg font-mono text-primary"
                              />
                          </div>
                      );
                  }


                  return (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className={cn(
                        'group flex items-center gap-4 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
                        currentVideo?.id === video.id && 'bg-success text-success-foreground hover:bg-success/90'
                      )}
                      aria-current={currentVideo?.id === video.id}
                    >
                      <div className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-md',
                        currentVideo?.id === video.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                      )}>
                        {video.isLive ? (
                          <Radio className="h-6 w-6 animate-pulse" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-semibold">{video.title}</p>
                        {video.isLive && (
                          <Badge variant="destructive" className="mt-1 animate-pulse">
                            AO VIVO
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
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
                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                          <Skeleton className="h-10 w-full sm:w-1/2" />
                          <Skeleton className="h-10 w-full sm:w-1/2" />
                        </div>
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
