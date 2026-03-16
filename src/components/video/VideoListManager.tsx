
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Eye, GripVertical, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditVideoDialog from './EditVideoDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { useFirebase, useCollection, WithId, setDocumentNonBlocking } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';


const ALL_CATEGORIES = 'Todas as Categorias';
type Category = { name: string };

export default function VideoListManager() {
  const { firestore } = useFirebase();
  const [videoToEdit, setVideoToEdit] = useState<WithId<Video> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [orderedVideos, setOrderedVideos] = useState<WithId<Video>[]>([]);
  const [enabled, setEnabled] = useState(false);

  // Buscamos sem orderBy para evitar que vídeos antigos sem o campo sumam
  const { data: videos, loading: videosLoading } = useCollection<Video>('videos');
  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>('categories');

  // Fix para o dnd no React 18 + Next.js
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  useEffect(() => {
    if (videos) {
      // Ordenamos em memória de forma estrita para o Admin
      const sorted = [...videos].sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) {
          return (a.order ?? 0) - (b.order ?? 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrderedVideos(sorted);
    }
  }, [videos]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(categoriesData?.map(c => c.name) || [])].sort();
    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [categoriesData]);

  const handleOpenEditDialog = (video: WithId<Video>) => {
    setVideoToEdit(video);
    setIsEditDialogOpen(true);
  };

  const handleSave = (updatedVideo: WithId<Video>) => {
    setIsEditDialogOpen(false);
    setVideoToEdit(null);
  };

  const handleDelete = async (videoId: string) => {
    try {
      await deleteDoc(doc(firestore, 'videos', videoId));
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedVideos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedVideos(items);

    // Atualiza a ordem no Firestore para todos os itens afetados
    items.forEach((video, index) => {
      const newOrder = index * 10;
      if (video.order !== newOrder) {
        setDocumentNonBlocking(firestore, `videos/${video.id}`, { order: newOrder });
      }
    });

    toast({
      title: 'Ordem atualizada',
      description: 'A nova sequência dos vídeos foi salva.',
    });
  };

  const filteredVideos = useMemo(() => {
    return orderedVideos
      .filter(video => {
        if (selectedCategory === ALL_CATEGORIES) return true;
        return video.category === selectedCategory;
      })
      .filter(video => {
        if (!searchTerm) return true;
        return video.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [orderedVideos, selectedCategory, searchTerm]);

  // Desabilita drag and drop se houver filtros ativos
  const isFiltering = searchTerm !== '' || selectedCategory !== ALL_CATEGORIES;

  if (!enabled) return null;

  return (
    <>
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Gerenciar Vídeos</CardTitle>
          <CardDescription>
            Visualize e organize a ordem dos vídeos no seu catálogo.
          </CardDescription>
          
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

          {isFiltering && (
            <Alert className="mt-4 bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs text-primary/80">
                A reordenação manual (arrastar) está desativada enquanto filtros de busca ou categoria estiverem ativos.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {videosLoading ? (
            <p>Carregando vídeos...</p>
          ) : filteredVideos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum vídeo encontrado.</p>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="videos-list" isDropDisabled={isFiltering}>
                {(provided) => (
                  <ScrollArea className="h-[500px]">
                    <ul 
                      {...provided.droppableProps} 
                      ref={provided.innerRef} 
                      className="space-y-4 pr-4 py-2"
                    >
                      {filteredVideos.map((video, index) => (
                        <Draggable 
                          key={video.id} 
                          draggableId={video.id} 
                          index={index}
                          isDragDisabled={isFiltering}
                        >
                          {(provided, snapshot) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3 rounded-lg border bg-card transition-all",
                                snapshot.isDragging && "shadow-2xl border-primary ring-2 ring-primary/20 z-50 bg-accent/5 scale-[1.02]"
                              )}
                            >
                              <div 
                                {...provided.dragHandleProps} 
                                className={cn(
                                  "p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors bg-secondary/20 rounded",
                                  isFiltering && "opacity-20 cursor-not-allowed"
                                )}
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{video.title}</p>
                                <div className="flex items-center gap-x-3 text-sm text-muted-foreground flex-wrap">
                                  <span>{video.category}</span>
                                  <span className="text-gray-400">&middot;</span>
                                  <div className="flex items-center gap-1.5">
                                    <Eye className="h-4 w-4" />
                                    <span>{(video.viewCount ?? 0).toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </ScrollArea>
                )}
              </Droppable>
            </DragDropContext>
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
