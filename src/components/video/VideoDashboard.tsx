'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const router = useRouter();


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
  
  const handleSelectVideo = useCallback((video: WithId<Video>) => {
    setCurrentVideo(currentVideo => {
        // Prevent re-rendering if the same video is selected
        if(currentVideo?.id === video.id) return currentVideo;
        
        let videoToPlay = video;
        if (!video.isLive && video.youtubeUrl && !video.youtubeUrl.includes('autoplay=1')) {
          try {
            const urlWithAutoplay = new URL(video.youtubeUrl);
            urlWithAutoplay.searchParams.set('autoplay', '1');
            videoToPlay = { ...video, youtubeUrl: urlWithAutoplay.toString() };
          } catch (e) {
            // Ignore invalid URL
          }
        }
        return videoToPlay;
    });
    
    setFinishedCountdownIds(prev => {
        if (prev.includes(video.id)) {
            return prev.filter(id => id !== video.id);
        }
        return prev;
    });
  }, []); // Stable function due to empty dependency array and functional state updates


  const handleWatchNow = (video: WithId<Video>) => {
    handleSelectVideo(video);
  };


  const { liveVideo, scheduledVideos, pastVideos, allVisibleVideos } = useMemo(() => {
    if (!allVideos) {
      return { liveVideo: null, scheduledVideos: [], pastVideos: [], allVisibleVideos: [] };
    }

    const live = allVideos.find(v => v.isLive) || null;

    // Videos for the "Upcoming" card: future scheduled OR just became available
    const upcomingOrAvailable = allVideos.filter(v => {
      if (v.isLive) return false;
      const isFuture = v.scheduledAt && new Date(v.scheduledAt) > now;
      const isAvailable = finishedCountdownIds.includes(v.id);
      return isFuture || isAvailable;
    });

    // The rest are "past" videos for the main catalog
    const upcomingOrAvailableIds = new Set(upcomingOrAvailable.map(v => v.id));
    const past = allVideos.filter(v => v.id !== live?.id && !upcomingOrAvailableIds.has(v.id));

    // Apply category and search term filters
    let filteredUpcoming = upcomingOrAvailable;
    let filteredPast = past;

    if (selectedCategory !== ALL_CATEGORIES) {
      filteredUpcoming = filteredUpcoming.filter(v => v.category === selectedCategory);
      filteredPast = filteredPast.filter(v => v.category === selectedCategory);
    }
    if (searchTerm) {
      filteredUpcoming = filteredUpcoming.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));
      filteredPast = filteredPast.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort the "Upcoming" list: available first, then by date
    filteredUpcoming.sort((a, b) => {
      const aIsAvailable = finishedCountdownIds.includes(a.id);
      const bIsAvailable = finishedCountdownIds.includes(b.id);
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      return new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime();
    });
    
    // Shuffle "past" videos only if "Todos" is selected
    const finalPastVideos = selectedCategory === ALL_CATEGORIES
      ? [...filteredPast].sort(() => Math.random() - 0.5)
      : filteredPast;

    const allVisible = [
      ...(live ? [live] : []),
      ...finalPastVideos,
      ...filteredUpcoming,
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    return {
      liveVideo: live,
      scheduledVideos: filteredUpcoming,
      pastVideos: finalPastVideos,
      allVisibleVideos: allVisible
    };
  }, [allVideos, now, finishedCountdownIds, selectedCategory, searchTerm]);
  
  
  useEffect(() => {
    if (videosLoading || !allVideos) return;

    const videoIdFromUrl = searchParams.get('videoId');
    if (videoIdFromUrl) {
        const videoFromUrl = allVideos.find(v => v.id === videoIdFromUrl);
        if (videoFromUrl && currentVideo?.id !== videoFromUrl.id) {
            handleSelectVideo(videoFromUrl);
            if (videoFromUrl.category && categories.includes(videoFromUrl.category)) {
              setSelectedCategory(videoFromUrl.category);
            }
            return;
        }
    }
    
    // Don't auto-select if a video is already playing unless it disappeared from the visible list
    if (currentVideo && allVisibleVideos.some(v => v.id === currentVideo.id)) {
        return;
    }

    // Auto-select logic
    if (allVisibleVideos.length > 0) {
        const live = allVisibleVideos.find(v => v.isLive);
        if (live) {
            handleSelectVideo(live);
            return;
        }
        // Select from the 'past' list, not 'allVisible' to avoid auto-playing a scheduled video
        const firstPlayable = pastVideos.find(v => !v.scheduledAt || new Date(v.scheduledAt) <= now);
        if (firstPlayable) {
             handleSelectVideo(firstPlayable);
        } else {
            setCurrentVideo(null); // Clear player if only scheduled videos are visible
        }
    } else {
        setCurrentVideo(null);
    }
  }, [allVisibleVideos, pastVideos, currentVideo, now, searchParams, allVideos, videosLoading, categories, handleSelectVideo]);


  if (videosLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }


  const renderVideoItem = (video: WithId<Video>) => {
    const isFinishedCountdown = finishedCountdownIds.includes(video.id);
    
    // This state is for videos in the "Upcoming" card that are now available
    if (isFinishedCountdown) {
      return (
        <div key={video.id} className="group flex flex-col items-start gap-2 rounded-lg border-2 border-destructive bg-destructive/5 p-3 text-left">
          <p className="font-semibold text-card-foreground">{video.title}</p>
          <Badge variant="destructive" className="mt-1">DISPONÍVEL AGORA</Badge>
          <Button variant="destructive" onClick={() => handleWatchNow(video)} size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Assistir agora
          </Button>
        </div>
      );
    }
    
    // This state is for future scheduled videos in the "Upcoming" card
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
            className="w-full text-lg font-mono text-foreground"
          />
        </div>
      );
    }

    // This state is for regular, past videos in the main catalog
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
  };

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

      <div className="lg:col-span-1 flex flex-col gap-8">
        {scheduledVideos.length > 0 && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        Próximas Transmissões
                    </CardTitle>
                    <CardDescription>
                        Vídeos agendados que começarão em breve ou que acabaram de ficar disponíveis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="max-h-64">
                        <div className="flex flex-col gap-4 pr-4">
                            {scheduledVideos.map(renderVideoItem)}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
        <Card className="shadow-lg flex-1">
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
          <CardContent className="h-full flex flex-col">
            <ScrollArea className="flex-1 h-[40vh] -mx-6 px-6">
              <div className="flex flex-col gap-4 pr-4">
                {liveVideo && renderVideoItem(liveVideo)}
                {pastVideos.length > 0 
                  ? pastVideos.map(renderVideoItem) 
                  : (liveVideo ? null : <p className="text-sm text-muted-foreground text-center pt-4">Nenhum vídeo nesta categoria.</p>)
                }
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
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
                <Card className="h-full">
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                          <Skeleton className="h-10 w-full sm:w-1/2" />
                          <Skeleton className="h-10 w-full sm:w-1/2" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {Array.from({ length: 5 }).map((_, i) => (
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
