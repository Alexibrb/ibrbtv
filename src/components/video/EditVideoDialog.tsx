'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import AddCategoryDialog from '../category/AddCategoryDialog';
import { useFirebase, useCollection, setDocumentNonBlocking, WithId, addDocumentNonBlocking } from '@/firebase';
import { orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';


const formSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  summary: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  scheduledAt: z.string().optional(),
});

type Category = { name: string };

type EditVideoDialogProps = {
  video: WithId<Video> | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updatedVideo: WithId<Video>) => void;
};

export default function EditVideoDialog({ video, isOpen, onOpenChange, onSave }: EditVideoDialogProps) {
  const { firestore } = useFirebase();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      category: '',
      scheduledAt: '',
    }
  });

  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories', orderBy('name'));
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleCategoryAdded = (newCategory: string) => {
     if (newCategory.trim()) {
      addDocumentNonBlocking(firestore, 'categories', { name: newCategory.trim() });
      toast({
        title: 'Categoria adicionada!',
        description: `A categoria "${newCategory}" foi salva.`,
      });
      form.setValue('category', newCategory.trim(), { shouldValidate: true });
    }
    setIsCategoryModalOpen(false);
  };

  useEffect(() => {
    if (video) {
      const scheduledValue = video.scheduledAt ? video.scheduledAt.substring(0, 16) : '';
      form.reset({
        title: video.title,
        summary: video.summary,
        category: video.category,
        scheduledAt: scheduledValue,
      });
    }
  }, [video, form, isOpen]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (video) {
      const payload: Partial<Video> = {
        title: data.title,
        summary: data.summary || '',
        category: data.category,
        scheduledAt: data.scheduledAt || '',
      };
      
      const updatedVideo: WithId<Video> = {
          ...video,
          ...payload
      };

      setDocumentNonBlocking(firestore, `videos/${video.id}`, payload);
      onSave(updatedVideo);
      toast({
        title: 'Vídeo atualizado!',
        description: 'As informações do vídeo foram salvas.',
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Vídeo</DialogTitle>
            <DialogDescription>
              Atualize as informações do vídeo. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Um resumo conciso do vídeo." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <div className="flex items-center gap-2">
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={categoriesLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryModalOpen(true)} aria-label="Adicionar nova categoria">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agendar Horário (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AddCategoryDialog 
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        onCategoryAdded={handleCategoryAdded}
      />
    </>
  );
}
