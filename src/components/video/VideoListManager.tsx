'use client';

import { useState, useEffect } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditVideoDialog from './EditVideoDialog';

export default function VideoListManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoToEdit, setVideoToEdit] = useState<Video | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    window.addEventListener('videos-updated', loadVideos);
    return () => {
      window.removeEventListener('videos-updated', loadVideos);
    };
  }, []);

  const handleOpenEditDialog = (video: Video) => {
    setVideoToEdit(video);
    setIsEditDialogOpen(true);
  };

  const handleSave = (updatedVideo: Video) => {
    try {
      const updatedVideos = videos.map((video) =>
        video.id === updatedVideo.id ? updatedVideo : video
      );
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);

      window.dispatchEvent(new CustomEvent('videos-updated'));
      
      toast({
        title: 'Vídeo atualizado!',
        description: 'As informações do vídeo foram salvas.',
      });
      setIsEditDialogOpen(false);
      setVideoToEdit(null);
    } catch (error) {
      console.error('Failed to update video in localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as alterações.',
      });
    }
  };

  const handleDelete = (videoId: string) => {
    try {
      const updatedVideos = videos.filter((video) => video.id !== videoId);
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);

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
    <>
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Gerenciar Vídeos</CardTitle>
          <CardDescription>Visualize, edite e remova vídeos cadastrados.</CardDescription>
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
                  <li key={video.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-3 rounded-lg border">
                    <div className="min-w-0">
                       <p className="font-semibold truncate">{video.title}</p>
                       <p className="text-sm text-muted-foreground">{video.isLive ? 'AO VIVO' : 'Replay'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(video)}
                        aria-label={`Editar vídeo ${video.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(video.id)}
                        aria-label={`Remover vídeo ${video.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <EditVideoDialog
        video={videoToEdit}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}
