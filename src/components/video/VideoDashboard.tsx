'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Play, Radio } from 'lucide-react';
import { Badge } from '../ui/badge';
import { liveVideo as initialLiveVideo, pastVideos as initialPastVideos } from '@/lib/videos';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const STORAGE_KEY = 'videos';
const CATEGORIES_STORAGE_KEY = 'video_categories';
const ALL_CATEGORIES = 'Todos';

export default function VideoDashboard() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [categories, setCategories] = useState<string[]>([ALL_CATEGORIES]);

  const loadCategories = () => {
    try {
        const storedCategoriesRaw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        const storedCategories = storedCategoriesRaw ? JSON.parse(storedCategoriesRaw) : [];

        const videoCategories = allVideos
            .filter(v => v.category && v.category !== 'Ao Vivo')
            .map(v => v.category);

        const combined = [...storedCategories, ...videoCategories];
        const unique = [...new Set(combined)].sort();

        setCategories([ALL_CATEGORIES, ...unique]);
    } catch (error) {
        console.error("Failed to load or parse categories", error);
        // Fallback to just video categories
        const videoCats = allVideos
            .filter(v => v.category && v.category !== 'Ao Vivo')
            .map(v => v.category);
        setCategories([ALL_CATEGORIES, ...[...new Set(videoCats)].sort()]);
    }
  };


  useEffect(() => {
    function loadVideos() {
      setIsLoading(true);
      try {
        const storedVideosRaw = localStorage.getItem(STORAGE_KEY);
        if (storedVideosRaw) {
          const parsedVideos = JSON.parse(storedVideosRaw);
          setAllVideos(parsedVideos);
        } else {
          // Seed local storage with initial data if it's empty
          const initialVideos = [initialLiveVideo, ...initialPastVideos];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialVideos));
          setAllVideos(initialVideos);
        }
      } catch (error) {
        console.error("Failed to load videos from localStorage", error);
        // Fallback to initial data if localStorage fails
        const initialData = [initialLiveVideo, ...initialPastVideos];
        setAllVideos(initialData);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVideos();

    const handleVideosUpdated = () => loadVideos();
    window.addEventListener('videos-updated', handleVideosUpdated);

    return () => {
      window.removeEventListener('videos-updated', handleVideosUpdated);
    };
  }, []);

  useEffect(() => {
    loadCategories();
    window.addEventListener('categories-updated', loadCategories);
    return () => {
      window.removeEventListener('categories-updated', loadCategories);
    };
  }, [allVideos]); // Rerun when videos change to derive categories
  
  const filteredVideos = useMemo(() => {
    const liveVideo = allVideos.find(v => v.isLive);
    const past = allVideos.filter(v => !v.isLive);
    
    const sortedPast = past.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    
    const displayList = liveVideo ? [liveVideo, ...sortedPast] : sortedPast;

    if (selectedCategory === ALL_CATEGORIES) {
      return displayList;
    }
    
    return displayList.filter(video => video.isLive || video.category === selectedCategory);
  }, [allVideos, selectedCategory]);

  useEffect(() => {
    if (filteredVideos.length > 0 && !currentVideo) {
      const live = filteredVideos.find(v => v.isLive);
      if (live) {
        setCurrentVideo(live);
      } else {
        setCurrentVideo(filteredVideos[0] || null);
      }
    } else if (filteredVideos.length > 0 && currentVideo) {
        // If current video is no longer in the filtered list, update it
        if (!filteredVideos.some(v => v.id === currentVideo.id)) {
            setCurrentVideo(filteredVideos[0]);
        }
    } else if (filteredVideos.length === 0) {
        setCurrentVideo(null);
    }
  }, [filteredVideos, currentVideo]);


  const handleSelectVideo = (video: Video) => {
    if (!video.isLive && video.youtubeUrl && !video.youtubeUrl.includes('autoplay=1')) {
      try {
        const urlWithAutoplay = new URL(video.youtubeUrl);
        urlWithAutoplay.searchParams.set('autoplay', '1');
        setCurrentVideo({ ...video, youtubeUrl: urlWithAutoplay.toString() });
      } catch (e) {
        // Fallback for invalid URL
        setCurrentVideo(video);
      }
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
             <div className="pt-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtrar por categoria" />
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
            <ScrollArea className="h-[52vh] pr-4">
              <div className="flex flex-col gap-4">
                {filteredVideos.map((video) => (
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
                    <div className="min-w-0 flex-grow">
                      <p className="font-semibold text-card-foreground truncate">{video.title}</p>
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
                        <div className='pt-2'>
                          <Skeleton className="h-10 w-full" />
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
