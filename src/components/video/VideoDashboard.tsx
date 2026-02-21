'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio, Clock } from 'lucide-react';
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
import { orderBy, doc, setDoc } from 'firebase/firestore';


const ALL_CATEGORIES = 'Todos';
type Category = { name: string };

export default function VideoDashboard() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [currentVideo, setCurrentVideo] = useState<WithId<Video> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());


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
  
  const handleSelectVideo = (video: WithId<Video>) => {
    setCurrentVideo(currentVideo => {
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
  };

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

  const { liveVideo, pastVideos } = useMemo(() => {
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
    
    const finalPastVideos = (selectedCategory === ALL_CATEGORIES && !searchTerm)
      ? [...past].sort(() => Math.random() - 0.5)
      : past;

    return {
      liveVideo: live,
      pastVideos: finalPastVideos,
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

    // Don't change video if the current one is still visible
    if (currentVideo && allVisibleCatalogVideos.some(v => v.id === currentVideo.id)) {
        return;
    }
    
    // Don't select a video from the catalog if there are none and there are scheduled videos
    if(allVisibleCatalogVideos.length === 0 && scheduledVideos.length > 0) {
        return;
    }

    // Select a video if one isn't selected or the current one disappeared
    if (allVisibleCatalogVideos.length > 0) {
        const live = allVisibleCatalogVideos.find(v => v.isLive);
        if (live) {
            handleSelectVideo(live);
        } else {
            handleSelectVideo(allVisibleCatalogVideos[0]);
        }
    } else {
        // Clear video if no videos are visible
        setCurrentVideo(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVisibleCatalogVideos, scheduledVideos, videosLoading]);


  if (videosLoading || categoriesLoading) {
    return <DashboardSkeleton />;
  }


  const renderVideoItem = (video: WithId<Video>) => {
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
                        Vídeos que começarão em breve. Fique de olho na contagem regressiva!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="max-h-64">
                        <div className="flex flex-col gap-4 pr-4">
                            {scheduledVideos.map(video => (
                                <div key={video.id} className="group flex flex-col items-start gap-2 rounded-lg border p-3 text-left">
                                    <p className="font-semibold text-card-foreground">{video.title}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Começa em:</span>
                                    </div>
                                    <CountdownTimer
                                        targetDate={video.scheduledAt!}
                                        onComplete={() => {
                                            router.refresh();
                                        }}
                                        className="w-full text-lg font-mono text-foreground"
                                    />
                                </div>
                            ))}
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
                  ? pastVideos.map(video => renderVideoItem(video)) 
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
