
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


  // Buscamos ordenado por 'order' (ascendente) para respeitar a escolha do admin
  const { data: allVideos, loading: videosLoading } = useCollection<Video>('videos', orderBy('order', 'asc'));
  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>('categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(categoriesData?.map(c => c.name) || [])].sort();
    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [categoriesData]);
  

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentVideoId && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentVideoId]);
  
  const handleClickVideo = (video: WithId<Video>) => {
    if (currentVideoId === video.id) {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

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
    // Autoplay apenas para YouTube
    if (video.youtubeUrl.includes('youtube.com') && !video.youtubeUrl.includes('autoplay=1')) {
      try {
        const urlWithAutoplay = new URL(video.youtubeUrl);
        urlWithAutoplay.searchParams.set('autoplay', '1');
        videoToPlay = { ...video, youtubeUrl: urlWithAutoplay.toString() };
      } catch (e) {}
    }
    return videoToPlay;
  }, [currentVideoId, allVideos]);

  const { scheduledVideos, catalogVideos } = useMemo(() => {
    if (!allVideos) return { scheduledVideos: [], catalogVideos: [] };

    const scheduled = allVideos.filter(v => v.scheduledAt && new Date(v.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
      
    const catalog = allVideos.filter(v => !v.scheduledAt || new Date(v.scheduledAt) <= now);
    
    return { scheduledVideos: scheduled, catalogVideos: catalog };
  }, [allVideos, now]);

  const { liveVideo, pastVideos, newlyAvailableVideoIds } = useMemo(() => {
    let filteredCatalogVideos = [...catalogVideos]
      .filter(v => {
        if (selectedCategory === ALL_CATEGORIES) return true;
        return v.category === selectedCategory;
      })
      .filter(v => {
        if (!searchTerm) return true;
        return v.title.toLowerCase().includes(searchTerm.toLowerCase());
      });

    // Se a categoria for "Todos" e não houver busca, aplicamos a lógica aleatória
    // que você solicitou anteriormente, mas mantendo o vídeo atual no topo
    if (selectedCategory === ALL_CATEGORIES && !searchTerm) {
      for (let i = filteredCatalogVideos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredCatalogVideos[i], filteredCatalogVideos[j]] = [filteredCatalogVideos[j], filteredCatalogVideos[i]];
      }
    }

    const live = filteredCatalogVideos.find(v => v.isLive) || null;
    let past = filteredCatalogVideos.filter(v => !v.isLive);
    const newlyAvailableIds = new Set<string>();

    // Garante que o vídeo atual esteja no topo da lista se for selecionado
    if (currentVideoId) {
      const selectedVideoIndex = past.findIndex(v => v.id === currentVideoId);
      if (selectedVideoIndex > 0) {
        const [selectedVideo] = past.splice(selectedVideoIndex, 1);
        past.unshift(selectedVideo);
      }
    }
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const newlyAvailable = past.filter(v =>
      v.scheduledAt && new Date(v.scheduledAt).getTime() >= todayStart.getTime()
    );
    newlyAvailable.forEach(v => newlyAvailableIds.add(v.id));

    return { liveVideo: live, pastVideos: past, newlyAvailableVideoIds: newlyAvailableIds };
  }, [catalogVideos, selectedCategory, searchTerm, currentVideoId]);
  
  const allVisibleCatalogVideos = useMemo(() => {
    return [
     ...(liveVideo ? [liveVideo] : []),
     ...pastVideos,
   ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
 }, [liveVideo, pastVideos]);

  useEffect(() => {
    if (videosLoading) return;
    const isCurrentVideoVisible = allVisibleCatalogVideos.some(v => v.id === currentVideoId);
    if (currentVideoId && isCurrentVideoVisible) return;

    if (allVisibleCatalogVideos.length > 0) {
      const videoToSelect = allVisibleCatalogVideos.find(v => v.isLive) || allVisibleCatalogVideos[0];
      setCurrentVideoId(videoToSelect.id);
    } else {
      setCurrentVideoId(null);
    }
  }, [allVisibleCatalogVideos, videosLoading, currentVideoId]);


  if (videosLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }

  const getPlatformIcon = (url: string) => {
    if (url.includes('facebook.com')) return <span className="text-[10px] font-black">FB</span>;
    if (url.includes('instagram.com')) return <span className="text-[10px] font-black">IG</span>;
    return <Play className="h-6 w-6 fill-current" />;
  };

  const renderVideoItem = (video: WithId<Video>) => {
    const isNew = newlyAvailableVideoIds.has(video.id);
    const isActive = currentVideoId === video.id;
    return (
      <button
        key={video.id}
        onClick={() => handleClickVideo(video)}
        className={cn(
          'group flex items-center gap-4 rounded-xl p-3 text-left transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring border border-transparent',
          isActive ? 'bg-success text-success-foreground' : 'bg-secondary/20 border-border/40'
        )}
        aria-current={isActive}
      >
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm',
          isActive ? 'bg-white/20' : video.isLive ? 'bg-primary/20 text-primary' : 'bg-destructive text-white'
        )}>
          {video.isLive ? <Radio className="h-6 w-6 animate-pulse" /> : getPlatformIcon(video.youtubeUrl)}
        </div>
        <div className="min-w-0 flex-grow">
          <p className={cn("font-semibold truncate", isActive ? "text-white" : "text-foreground")}>
            {isNew && !video.isLive && '✨ '}{video.title}
          </p>
           <div className={cn("flex items-center text-[10px] mt-1 gap-1", isActive ? "text-white/80" : "text-muted-foreground")}>
            {video.isLive ? (
              <Badge variant="destructive" className="animate-pulse h-4 px-1 text-[8px]">AO VIVO</Badge>
            ) : (
                <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{(video.viewCount ?? 0).toLocaleString('pt-BR')}</span>
                    <span className="ml-1 opacity-50">• {video.youtubeUrl.includes('facebook') ? 'Facebook' : video.youtubeUrl.includes('instagram') ? 'Instagram' : 'YouTube'}</span>
                </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const isVertical = currentVideo?.youtubeUrl.includes('facebook.com') || currentVideo?.youtubeUrl.includes('instagram.com');

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" ref={playerRef}>
          <Card className="overflow-hidden shadow-2xl bg-card/50 border-none">
            {currentVideo ? (
              <>
                <div className={cn(
                  "w-full bg-black relative mx-auto transition-all duration-500 overflow-hidden",
                  isVertical ? "aspect-[9/16] max-w-[400px]" : "aspect-video"
                )}>
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
                <CardHeader className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <CardTitle className="font-headline text-3xl md:text-4xl leading-tight">{currentVideo.title}</CardTitle>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80 font-medium">
                          <Eye className="h-4 w-4" />
                          <span>{(currentVideo.viewCount ?? 0).toLocaleString('pt-BR')} visualizações</span>
                          <span className="mx-1">•</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {currentVideo.youtubeUrl.includes('facebook') ? 'Facebook' : currentVideo.youtubeUrl.includes('instagram') ? 'Instagram' : 'YouTube'}
                          </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-base leading-relaxed text-foreground/70 whitespace-pre-wrap">
                    {currentVideo.summary}
                  </CardDescription>
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
              <Card className="shadow-lg border-none bg-card/50">
                  <CardHeader><CardTitle className="font-headline flex items-center gap-2 text-xl"><Clock className="h-5 w-5 text-primary" /> Próximas Transmissões</CardTitle></CardHeader>
                  <CardContent>
                      <ScrollArea className="max-h-64">
                          <div className="flex flex-col gap-3 pr-4">
                              {scheduledVideos.map(video => (
                                  <div key={video.id} className="group flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-secondary/10 p-3 text-left">
                                      <p className="font-semibold text-card-foreground text-sm">{video.title}</p>
                                      {completedTimers.includes(video.id) ? (
                                          <Button onClick={() => window.location.reload()} className="w-full mt-2 h-8" variant="destructive">Atualizar para assistir</Button>
                                      ) : (
                                          <div className="w-full flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono"><Clock className="h-3 w-3" /><span>COMEÇA EM:</span></div>
                                              <CountdownTimer targetDate={video.scheduledAt!} onComplete={() => setCompletedTimers(prev => [...prev, video.id])} className="text-sm font-bold font-mono text-primary" />
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </ScrollArea>
                  </CardContent>
              </Card>
          )}
          <Card className="shadow-xl border-none bg-card/50">
            <CardHeader className="pb-4">
               <CardTitle className="font-headline text-2xl">Catálogo de Vídeos</CardTitle>
               <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <Input placeholder="Filtrar por título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 text-sm bg-background/50 border-border/40" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={categoriesLoading}>
                      <SelectTrigger className="h-9 text-sm bg-background/50 border-border/40 w-[120px]"><SelectValue placeholder="Cat." /></SelectTrigger>
                      <SelectContent>{categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent>
                  </Select>
               </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[30rem] -mx-4 px-4">
                <div className="flex flex-col gap-3 pr-4">
                  {liveVideo && renderVideoItem(liveVideo)}
                  {pastVideos.length > 0 ? pastVideos.map(video => renderVideoItem(video)) : (liveVideo ? null : <p className="text-sm text-muted-foreground text-center pt-8">Nenhum vídeo disponível.</p>)}
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
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="space-y-2 px-2"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
            </div>
            <div className="lg:col-span-1">
                <Card className="h-full border-none bg-card/50">
                    <CardHeader><Skeleton className="h-7 w-48" /><div className="flex flex-col gap-4 pt-4 sm:flex-row"><Skeleton className="h-9 w-full sm:w-1/2" /><Skeleton className="h-9 w-full sm:w-1/2" /></div></CardHeader>
                    <CardContent className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4 p-3 bg-secondary/5 rounded-xl"><Skeleton className="h-12 w-12 rounded-lg" /><div className="flex-grow space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/4" /></div></div>))}</CardContent>
                </Card>
            </div>
        </div>
    );
}
