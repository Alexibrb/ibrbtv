'use client';

import { useState, useEffect } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VideoListManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVideos = () => {
    setIsLoading(true);
    try {
      const storedVideos = localStorage.getItem('videos');
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      }
    } catch (error) {
      console.error('Failed to load videos from localStorage', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // Listen for updates from the AddVideoForm component
    window.addEventListener('videos-updated', loadVideos);
    return () => {
      window.removeEventListener('videos-updated', loadVideos);
    };
  }, []);

  const handleDelete = (videoId: string) => {
    try {
      const updatedVideos = videos.filter((video) => video.id !== videoId);
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);

      // Notify other components (like the dashboard)
      window.dispatchEvent(new CustomEvent('videos-updated'));
      
      toast({
        title: 'Vídeo removido!',
        description: 'O vídeo foi removido do catálogo.',
      });
    } catch (error) {
      console.error('Failed to delete video from localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover o vídeo.',
      });
    }
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Gerenciar Vídeos</CardTitle>
        <CardDescription>Visualize e remova vídeos cadastrados.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando vídeos...</p>
        ) : videos.length === 0 ? (
          <p className="text-muted-foreground">Nenhum vídeo cadastrado.</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <ul className="space-y-4 pr-4">
              {videos.map((video) => (
                <li key={video.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                     <p className="font-semibold truncate">{video.title}</p>
                     <p className="text-sm text-muted-foreground truncate">{video.isLive ? 'AO VIVO' : 'Replay'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(video.id)}
                    aria-label={`Remover vídeo ${video.title}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
