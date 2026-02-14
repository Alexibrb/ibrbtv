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

const formSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  summary: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
});

const CATEGORIES_STORAGE_KEY = 'video_categories';
const defaultCategories = ["Domingo de Manhã", "Estudo", "Evento Especial"];

type EditVideoDialogProps = {
  video: Video | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updatedVideo: Video) => void;
};

export default function EditVideoDialog({ video, isOpen, onOpenChange, onSave }: EditVideoDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      category: '',
    }
  });
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadCategories = () => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories(defaultCategories);
    }
  };

  useEffect(() => {
    loadCategories();
    window.addEventListener('categories-updated', loadCategories);
    return () => {
      window.removeEventListener('categories-updated', loadCategories);
    };
  }, []);

  const handleCategoryAdded = (newCategory: string) => {
    if (!categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory].sort();
      setCategories(updatedCategories);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
      form.setValue('category', newCategory, { shouldValidate: true });
    }
    setIsCategoryModalOpen(false);
  };

  useEffect(() => {
    if (video) {
      form.reset({
        title: video.title,
        summary: video.summary,
        category: video.category,
      });
    }
  }, [video, form, isOpen]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (video) {
      onSave({
        ...video,
        title: data.title,
        summary: data.summary || '',
        category: data.category,
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
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
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
