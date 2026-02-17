'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditVideoDialog from './EditVideoDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { useFirebase, useCollection, useMemoFirebase, deleteDocumentNonBlocking, WithId } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';


const ALL_CATEGORIES = 'Todas as Categorias';
type Category = { name: string };

export default function VideoListManager() {
  const { firestore } = useFirebase();
  const [videoToEdit, setVideoToEdit] = useState<WithId<Video> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const videosQuery = useMemoFirebase(
    () => query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: videos, loading: videosLoading } = useCollection<Video>(videosQuery.path);
  
  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>('categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(categoriesData?.map(c => c.name) || [])].sort();
    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [categoriesData]);

  const handleOpenEditDialog = (video: WithId<Video>) => {
    setVideoToEdit(video);
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    // This will be handled by EditVideoDialog now
    setIsEditDialogOpen(false);
    setVideoToEdit(null);
  };

  const handleDelete = (videoId: string) => {
    try {
      deleteDocumentNonBlocking(`videos/${videoId}`);
      toast({
        title: 'Vídeo removido!',
        description: 'O vídeo foi removido do catálogo.',
      });
    } catch (error) {
      console.error('Failed to delete video', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover o vídeo.',
      });
    }
  };

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    return videos
      .filter(video => {
        if (selectedCategory === ALL_CATEGORIES) return true;
        return video.category === selectedCategory;
      })
      .filter(video => {
        if (!searchTerm) return true;
        return video.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
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
          {videosLoading ? (
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
                       {video.scheduledAt && (
                         <Badge variant="outline" className="mt-2 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Agendado: {new Date(video.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                         </Badge>
                       )}
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
