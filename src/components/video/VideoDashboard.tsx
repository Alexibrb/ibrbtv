'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio, Clock, Eye } from 'lucide-react';
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
import { useFirebase, useCollection, WithId } from '@/firebase';
import { orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { Button } from '../ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import GoToPlayerButton from './GoToPlayerButton';


const ALL_CATEGORIES = 'Todos';
type Category = { name: string };

export default function VideoDashboard() {
  const { firestore } = useFirebase();
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());
  const [completedTimers, setCompletedTimers] = useState<string[]>([]);
  const playerRef = useRef<HTMLDivElement>(null);


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

  useEffect(() => {
    // When a new video is selected, scroll the player into view.
    // This is more reliable than calling it directly in the click handler.
    if (currentVideoId && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentVideoId]);
  
  const handleClickVideo = (video: WithId<Video>) => {
    if (currentVideoId === video.id) return;

    // Increment view count in Firestore, non-blocking
    const videoRef = doc(firestore, 'videos', video.id);
    updateDoc(videoRef, { viewCount: increment(1) }).catch(err => {
        const permissionError = new FirestorePermissionError({
            path: videoRef.path,
            operation: 'update',
            requestResourceData: { viewCount: 'increment(1)' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
    setCurrentVideoId(video.id);
  };
  
  const currentVideo = useMemo(() => {
    if (!currentVideoId || !allVideos) return null;
    const video = allVideos.find(v => v.id === currentVideoId);
    if (!video) return null;
    
    let videoToPlay = video;
    // Add autoplay for non-live videos
    if (!video.isLive && video.youtubeUrl && !video.youtubeUrl.includes('autoplay=1')) {
      try {
        const urlWithAutoplay = new URL(video.youtubeUrl);
        urlWithAutoplay.searchParams.set('autoplay', '1');
        videoToPlay = { ...video, youtubeUrl: urlWithAutoplay.toString() };
      } catch (e) {
        // Ignore invalid URL, play without autoplay
      }
    }
    return videoToPlay;
  }, [currentVideoId, allVideos]);

  const { scheduledVideos, catalogVideos } = useMemo(() => {
    if (!allVideos) {
      return { scheduledVideos: [], catalogVideos: [] };
    }

    const scheduled = allVideos.filter(v => v.scheduledAt && new Date(v.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
      
    const catalog = allVideos.filter(v => !v.scheduledAt || new Date(v.scheduledAt) <= now);
    
    return {
      scheduledVideos: scheduled,
      catalogVideos: catalog,
    };
  }, [allVideos, now]);

  const { liveVideo, pastVideos, newlyAvailableVideoIds } = useMemo(() => {
    // Filter catalog videos based on UI controls
    const filteredCatalogVideos = catalogVideos
      .filter(v => {
        if (selectedCategory === ALL_CATEGORIES) return true;
        return v.category === selectedCategory;
      })
      .filter(v => {
        if (!searchTerm) return true;
        return v.title.toLowerCase().includes(searchTerm.toLowerCase());
      });

    const live = filteredCatalogVideos.find(v => v.isLive) || null;
    const past = filteredCatalogVideos.filter(v => !v.isLive);
    const newlyAvailableIds = new Set<string>();
    
    const finalPastVideos = (() => {
      if (selectedCategory !== ALL_CATEGORIES || searchTerm) {
        return past;
      }
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const newlyAvailable = past.filter(v =>
        v.scheduledAt && new Date(v.scheduledAt).getTime() >= todayStart.getTime()
      );
      newlyAvailable.forEach(v => newlyAvailableIds.add(v.id));

      const olderVideos = past.filter(v =>
        !v.scheduledAt || new Date(v.scheduledAt).getTime() < todayStart.getTime()
      );
      
      newlyAvailable.sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime());
      
      const shuffledOlderVideos = [...olderVideos].sort(() => Math.random() - 0.5);

      return [...newlyAvailable, ...shuffledOlderVideos];
    })();

    return {
      liveVideo: live,
      pastVideos: finalPastVideos,
      newlyAvailableVideoIds: newlyAvailableIds,
    };
  }, [catalogVideos, selectedCategory, searchTerm]);
  
  
  const allVisibleCatalogVideos = useMemo(() => {
    return [
     ...(liveVideo ? [liveVideo] : []),
     ...pastVideos,
   ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
 }, [liveVideo, pastVideos]);

  useEffect(() => {
    if (videosLoading) return;

    const isCurrentVideoVisible = allVisibleCatalogVideos.some(v => v.id === currentVideoId);

    // If a video is selected and it's still in the visible list, do nothing.
    if (currentVideoId && isCurrentVideoVisible) {
      return;
    }

    // If there are visible videos in the catalog, select one.
    if (allVisibleCatalogVideos.length > 0) {
      const videoToSelect = allVisibleCatalogVideos.find(v => v.isLive) || allVisibleCatalogVideos[0];
      setCurrentVideoId(videoToSelect.id);
    } 
    // If there are no visible videos...
    else {
      setCurrentVideoId(null);
    }
  }, [allVisibleCatalogVideos, videosLoading, currentVideoId]);


  if (videosLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }


  const renderVideoItem = (video: WithId<Video>) => {
    const isNew = newlyAvailableVideoIds.has(video.id);
    return (
      <button
        key={video.id}
        onClick={() => handleClickVideo(video)}
        className={cn(
          'group flex items-center gap-4 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
          currentVideoId === video.id && 'bg-success text-success-foreground hover:bg-success/90'
        )}
        aria-current={currentVideoId === video.id}
      >
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-md',
          currentVideoId === video.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
        )}>
          {video.isLive ? (
            <Radio className="h-6 w-6 animate-pulse" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <p className="font-semibold">
            {isNew && !video.isLive && '✨ '}
            {video.title}
          </p>
           <div className="flex items-center text-xs text-muted-foreground mt-1">
            {video.isLive ? (
              <Badge variant="destructive" className="animate-pulse">
                AO VIVO
              </Badge>
            ) : (
                <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{(video.viewCount ?? 0).toLocaleString('pt-BR')}</span>
                </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" ref={playerRef}>
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
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-2">
                      <Eye className="h-4 w-4" />
                      <span>{(currentVideo.viewCount ?? 0).toLocaleString('pt-BR')} visualizações</span>
                  </div>
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
                          Vídeos que começarão em breve. Fique de olho na contagem regressiva!
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ScrollArea className="max-h-64">
                          <div className="flex flex-col gap-4 pr-4">
                              {scheduledVideos.map(video => (
                                  <div key={video.id} className="group flex flex-col items-start gap-2 rounded-lg border p-3 text-left">
                                      <p className="font-semibold text-card-foreground">{video.title}</p>
                                      
                                      {completedTimers.includes(video.id) ? (
                                          <Button onClick={() => window.location.reload()} className="w-full mt-2" variant="destructive">
                                              Atualizar para assistir
                                          </Button>
                                      ) : (
                                          <>
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                  <Clock className="h-4 w-4" />
                                                  <span>Começa em:</span>
                                              </div>
                                              <CountdownTimer
                                                  targetDate={video.scheduledAt!}
                                                  onComplete={() => {
                                                      setCompletedTimers(prev => [...prev, video.id]);
                                                  }}
                                                  className="w-full text-lg font-mono text-foreground"
                                              />
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </ScrollArea>
                  </CardContent>
              </Card>
          )}
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
              <ScrollArea className="h-[28rem] -mx-6 px-6">
                <div className="flex flex-col gap-4 pr-4">
                  {liveVideo && renderVideoItem(liveVideo)}
                  {pastVideos.length > 0 
                    ? pastVideos.map(video => renderVideoItem(video)) 
                    : (liveVideo ? null : <p className="text-sm text-muted-foreground text-center pt-4">Nenhum vídeo nesta categoria.</p>)
                  }
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      <GoToPlayerButton playerRef={playerRef} />
    </>
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

    

    

    

    