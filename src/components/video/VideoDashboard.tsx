'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Button } from '../ui/button';
import CountdownTimer from './CountdownTimer';
import { useFirebase, useCollection, WithId } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import GoToPlayerButton from './GoToPlayerButton';


const ALL_CATEGORIES = 'Todos';
type Category = { name: string };

const getSafeDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (typeof dateVal.toDate === 'function') return dateVal.toDate();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export default function VideoDashboard() {
  const { firestore } = useFirebase();
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const { data: fetchedVideos, loading: videosLoading } = useCollection<Video>('videos');
  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>('categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(categoriesData?.map(c => c.name) || [])].sort();
    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [categoriesData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentVideoId && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset expansion when changing video
      setIsDescriptionExpanded(false);
    }
  }, [currentVideoId]);
  
  const handleClickVideo = (video: WithId<Video>) => {
    if (currentVideoId === video.id) {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    const videoRef = doc(firestore, 'videos', video.id);
    updateDoc(videoRef, { viewCount: increment(1) }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: videoRef.path,
            operation: 'update',
            requestResourceData: { viewCount: 'increment(1)' },
        }));
    });
    setCurrentVideoId(video.id);
  };
  
  const allVideosSorted = useMemo(() => fetchedVideos ? [...fetchedVideos] : null, [fetchedVideos]);

  const { scheduledVideos, catalogVideos } = useMemo(() => {
    if (!allVideosSorted) return { scheduledVideos: [], catalogVideos: [] };
    const scheduled = allVideosSorted.filter(v => {
      const date = getSafeDate(v.scheduledAt);
      return date && date > now;
    }).sort((a, b) => (getSafeDate(a.scheduledAt)?.getTime() || 0) - (getSafeDate(b.scheduledAt)?.getTime() || 0));
    const catalog = allVideosSorted.filter(v => {
      const date = getSafeDate(v.scheduledAt);
      return !date || date <= now;
    });
    return { scheduledVideos: scheduled, catalogVideos: catalog };
  }, [allVideosSorted, now]);

  const processedCatalog = useMemo(() => {
    let filtered = catalogVideos.filter(v => {
      const matchCategory = selectedCategory === ALL_CATEGORIES || v.category === selectedCategory;
      const matchSearch = !searchTerm || v.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });

    // Only apply shuffle when "Todos" is selected
    if (selectedCategory !== ALL_CATEGORIES) {
      return filtered.sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return (getSafeDate(b.createdAt)?.getTime() || 0) - (getSafeDate(a.createdAt)?.getTime() || 0);
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayVideos = filtered.filter(v => {
      const videoDate = getSafeDate(v.createdAt) || getSafeDate(v.scheduledAt);
      return videoDate && videoDate.getTime() >= todayStart.getTime();
    }).sort((a, b) => (getSafeDate(b.createdAt)?.getTime() || 0) - (getSafeDate(a.createdAt)?.getTime() || 0));

    const olderVideos = filtered.filter(v => {
      const videoDate = getSafeDate(v.createdAt) || getSafeDate(v.scheduledAt);
      return !videoDate || videoDate.getTime() < todayStart.getTime();
    });

    const shuffledOld = [...olderVideos];
    for (let i = shuffledOld.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOld[i], shuffledOld[j]] = [shuffledOld[j], shuffledOld[i]];
    }

    return [...todayVideos, ...shuffledOld];
  }, [catalogVideos, selectedCategory, searchTerm]);

  const { liveVideo, pastVideos, newlyAvailableVideoIds } = useMemo(() => {
    const live = processedCatalog.find(v => v.isLive) || null;
    let past = [...processedCatalog.filter(v => !v.isLive)];
    const newlyAvailableIds = new Set<string>();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    processedCatalog.forEach(v => {
      const videoDate = getSafeDate(v.createdAt) || getSafeDate(v.scheduledAt);
      if (videoDate && videoDate.getTime() >= todayStart.getTime()) newlyAvailableIds.add(v.id);
    });

    if (currentVideoId) {
      const index = past.findIndex(v => v.id === currentVideoId);
      if (index > 0) {
        const [selected] = past.splice(index, 1);
        past.unshift(selected);
      }
    }
    return { liveVideo: live, pastVideos: past, newlyAvailableVideoIds: newlyAvailableIds };
  }, [processedCatalog, currentVideoId]);
  
  const currentVideo = useMemo(() => {
    if (!currentVideoId || !allVideosSorted) return null;
    const video = allVideosSorted.find(v => v.id === currentVideoId);
    if (!video) return null;
    if (video.youtubeUrl.includes('youtube.com') && !video.youtubeUrl.includes('autoplay=1')) {
      try {
        const url = new URL(video.youtubeUrl);
        url.searchParams.set('autoplay', '1');
        return { ...video, youtubeUrl: url.toString() };
      } catch (e) {}
    }
    return video;
  }, [currentVideoId, allVideosSorted]);

  const allVisibleCatalogVideos = useMemo(() => {
    const combined = [...(liveVideo ? [liveVideo] : []), ...pastVideos];
    return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [liveVideo, pastVideos]);

  useEffect(() => {
    if (videosLoading) return;
    if (currentVideoId && allVisibleCatalogVideos.some(v => v.id === currentVideoId)) return;
    if (allVisibleCatalogVideos.length > 0) {
      setCurrentVideoId((allVisibleCatalogVideos.find(v => v.isLive) || allVisibleCatalogVideos[0]).id);
    } else {
      setCurrentVideoId(null);
    }
  }, [allVisibleCatalogVideos, videosLoading, currentVideoId]);

  if (videosLoading || categoriesLoading) return <DashboardSkeleton />;

  const isVertical = currentVideo?.youtubeUrl.includes('facebook.com') || currentVideo?.youtubeUrl.includes('instagram.com');

  const summary = currentVideo?.summary || '';
  const needsExpansion = summary.length > 250;
  const displayedSummary = isDescriptionExpanded || !needsExpansion 
    ? summary 
    : summary.slice(0, 250) + '...';

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
                  <div className="space-y-3">
                    <CardDescription className="text-base leading-relaxed text-foreground/70 whitespace-pre-wrap transition-all">
                      {displayedSummary}
                    </CardDescription>
                    {needsExpansion && (
                      <Button 
                        variant="link" 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="p-0 h-auto text-primary font-bold hover:no-underline flex items-center gap-1"
                      >
                        {isDescriptionExpanded ? (
                          <>Ocultar <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Ler mais <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </>
            ) : (
               <CardContent className="flex h-[60vh] items-center justify-center">
                  <div className="text-center">
                      <h2 className="font-headline text-2xl">Nenhum vídeo encontrado</h2>
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
                                  <div key={video.id} className="group flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-secondary/10 p-3">
                                      <p className="font-semibold text-sm">{video.title}</p>
                                      <div className="w-full flex justify-between items-center mt-1">
                                          <span className="text-[10px] text-muted-foreground font-mono uppercase">Começa em:</span>
                                          <CountdownTimer targetDate={video.scheduledAt!} onComplete={() => {}} className="text-sm font-bold font-mono text-primary" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </ScrollArea>
                  </CardContent>
              </Card>
          )}
          <Card className="shadow-xl border-none bg-card/50">
            <CardHeader className="pb-4">
               <CardTitle className="font-headline text-2xl">Catálogo</CardTitle>
               <div className="flex flex-col gap-3 pt-4">
                  <Input 
                    placeholder="Filtrar por nome..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="h-10 text-sm bg-background/50 w-full" 
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-10 text-sm w-full">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                  </Select>
               </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[30rem] -mx-4 px-4">
                <div className="flex flex-col gap-3 pr-4">
                  {allVisibleCatalogVideos.map(video => {
                    const isActive = currentVideoId === video.id;
                    const isNew = newlyAvailableVideoIds.has(video.id);
                    return (
                      <button key={video.id} onClick={() => handleClickVideo(video)} className={cn(
                        'flex items-center gap-4 rounded-xl p-3 text-left transition-all border border-transparent',
                        isActive ? 'bg-success text-success-foreground' : 'bg-secondary/20 border-border/40 hover:bg-accent/50'
                      )}>
                        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-white/20' : 'bg-destructive text-white')}>
                          {video.isLive ? <Radio className="h-6 w-6 animate-pulse" /> : <Play className="h-6 w-6 fill-current" />}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <p className="font-semibold truncate">{isNew && '✨ '}{video.title}</p>
                          <div className="flex items-center text-[10px] mt-1 gap-1 opacity-80">
                            <Eye className="h-3 w-3" />
                            <span>{(video.viewCount ?? 0).toLocaleString('pt-BR')}</span>
                            {isNew && <span className="ml-1 text-primary-foreground bg-primary px-1 rounded-[2px] font-bold">NOVO</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
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
            <div className="lg:col-span-2 space-y-4"><Skeleton className="aspect-video w-full" /></div>
            <div className="lg:col-span-1"><Skeleton className="h-96 w-full" /></div>
        </div>
    );
}
