'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditVideoDialog from './EditVideoDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES_STORAGE_KEY = 'video_categories';
const ALL_CATEGORIES = 'Todas as Categorias';

export default function VideoListManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoToEdit, setVideoToEdit] = useState<Video | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New states for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [categories, setCategories] = useState<string[]>([ALL_CATEGORIES]);

  const loadVideosAndCategories = () => {
    setIsLoading(true);
    try {
      const storedVideosRaw = localStorage.getItem('videos');
      const loadedVideos = storedVideosRaw ? JSON.parse(storedVideosRaw) : [];
      setVideos(loadedVideos);

      const storedCategoriesRaw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const storedCategories = storedCategoriesRaw ? JSON.parse(storedCategoriesRaw) : [];
      
      const videoCategories = loadedVideos
        .map((v: Video) => v.category)
        .filter((c: string | undefined): c is string => !!c);

      const uniqueCategories = [...new Set([...storedCategories, ...videoCategories])].sort();
      setCategories([ALL_CATEGORIES, ...uniqueCategories]);

    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideosAndCategories();
    window.addEventListener('videos-updated', loadVideosAndCategories);
    window.addEventListener('categories-updated', loadVideosAndCategories);
    return () => {
      window.removeEventListener('videos-updated', loadVideosAndCategories);
      window.removeEventListener('categories-updated', loadVideosAndCategories);
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

  const filteredVideos = useMemo(() => {
    return videos
      .filter(video => {
        if (selectedCategory === ALL_CATEGORIES) return true;
        return video.category === selectedCategory;
      })
      .filter(video => {
        if (!searchTerm) return true;
        return video.title.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [videos, selectedCategory, searchTerm]);

  return (
    <>
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Gerenciar Vídeos</CardTitle>
          <CardDescription>Visualize, edite e remova vídeos cadastrados. Use os filtros para encontrar vídeos específicos.</CardDescription>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Input
              placeholder="Filtrar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-1/2">
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
          {isLoading ? (
            <p>Carregando vídeos...</p>
          ) : filteredVideos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum vídeo encontrado com os filtros atuais.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <ul className="space-y-4 pr-4">
                {filteredVideos.map((video) => (
                  <li key={video.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-3 rounded-lg border">
                    <div className="min-w-0">
                       <p className="font-semibold truncate">{video.title}</p>
                       <p className="text-sm text-muted-foreground">{video.category} - {video.isLive ? 'AO VIVO' : 'Replay'}</p>
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
