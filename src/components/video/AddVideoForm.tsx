'use client';

import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { addVideoAction, type FormState } from '@/app/actions';
import type { Video } from '@/lib/types';
import { useFirebase, addDocumentNonBlocking, WithId, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, orderBy } from 'firebase/firestore';

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
  scheduledAt: z.string().optional(),
});

type Category = { name: string };
type Settings = {
  logoUrl: string;
  defaultSummary?: string;
};

export default function AddVideoForm() {
  const { firestore } = useFirebase();
  const initialState: FormState = { title: null, summary: null, error: null };
  const [state, formAction] = useActionState(addVideoAction, initialState);
  const processedUrl = useRef('');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories', orderBy('name'));
  const { data: settings } = useDoc<Settings>('settings/config');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: '',
      category: '',
      scheduledAt: '',
    },
  });

  const handleCategoryAdded = (newCategoryName: string) => {
    if (newCategoryName.trim() === '') return;

    const existingCategory = categories?.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase().trim());
    if (existingCategory) {
       toast({
         variant: 'destructive',
         title: 'Categoria já existe',
         description: `A categoria "${newCategoryName}" já está cadastrada.`,
       });
       return;
    }
    
    // Non-blocking write
    addDocumentNonBlocking(firestore, 'categories', { name: newCategoryName.trim() });
    
    toast({
      title: 'Categoria Adicionada',
      description: `A categoria "${newCategoryName}" foi adicionada com sucesso.`,
    });
    form.setValue('category', newCategoryName.trim(), { shouldValidate: true });
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

      const newVideo: Omit<Video, 'id' | 'createdAt'> = {
        youtubeUrl: state.youtubeUrl,
        title: state.title,
        summary: settings?.defaultSummary || '',
        isLive: false,
        category: state.category,
        scheduledAt: state.scheduledAt || '',
      };

      addDocumentNonBlocking(firestore, 'videos', newVideo);
      
      toast({
        title: 'Vídeo adicionado!',
        description: `"${state.title}" foi salvo no catálogo.`,
      });

      form.reset();
    }
  }, [state, form, firestore, settings]);

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
                   <input type="hidden" name={field.name} value={field.value || ''} />
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
