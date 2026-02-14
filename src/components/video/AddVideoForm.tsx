'use client';

import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { addVideoAction, type FormState } from '@/app/actions';
import type { Video } from '@/lib/types';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AddCategoryDialog from '@/components/category/AddCategoryDialog';

const formSchema = z.object({
  youtubeUrl: z.string().url('Por favor, insira uma URL válida do YouTube.'),
  category: z.string().min(1, 'Por favor, selecione uma categoria.'),
});

const CATEGORIES_STORAGE_KEY = 'video_categories';
const defaultCategories = ["Domingo de Manhã", "Estudo", "Evento Especial"];

export default function AddVideoForm() {
  const initialState: FormState = { title: null, summary: null, error: null };
  const [state, formAction] = useActionState(addVideoAction, initialState);
  const processedUrl = useRef('');
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: '',
      category: '',
    },
  });

  useEffect(() => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed)) {
          setCategories(parsed.filter((c): c is string => typeof c === 'string'));
        }
      } else {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories(defaultCategories);
    }
  }, []);

  const handleCategoryAdded = (newCategory: string) => {
    if (!categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory].sort();
      setCategories(updatedCategories);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
      form.setValue('category', newCategory, { shouldValidate: true });
      window.dispatchEvent(new CustomEvent('categories-updated'));
    }
    setIsCategoryModalOpen(false);
  };

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: state.error,
      });
    }

    if (state.title && state.youtubeUrl && state.category && state.youtubeUrl !== processedUrl.current) {
      processedUrl.current = state.youtubeUrl;
      const newVideo: Video = {
        id: new Date().toISOString(),
        youtubeUrl: state.youtubeUrl,
        title: state.title,
        summary: '', // O resumo estará vazio inicialmente
        isLive: false,
        category: state.category,
      };

      try {
        const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const updatedVideos = [newVideo, ...storedVideos];
        localStorage.setItem('videos', JSON.stringify(updatedVideos));
        
        window.dispatchEvent(new CustomEvent('videos-updated'));
        
        toast({
          title: 'Vídeo adicionado!',
          description: `"${state.title}" foi salvo no catálogo.`,
        });

        form.reset();

      } catch (error) {
        console.error('Failed to save video to localStorage', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar o vídeo localmente.',
        });
      }
    }
  }, [state, form]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form action={formAction} className="space-y-4">
          <FormField
            control={form.control}
            name="youtubeUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Vídeo do YouTube</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
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
                 {/* This hidden input ensures the 'category' value is included in the form submission */}
                <input type="hidden" name={field.name} value={field.value || ''} />
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton>Buscar Título e Adicionar</SubmitButton>
        </form>
      </Form>

      <AddCategoryDialog 
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        onCategoryAdded={handleCategoryAdded}
      />

      {state.error && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Falha ao Adicionar</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
         </Alert>
      )}
    </div>
  );
}
