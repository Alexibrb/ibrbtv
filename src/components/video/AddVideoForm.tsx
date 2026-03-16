

'use client';

import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { addVideoAction, type FormState } from '@/app/actions';
import type { Video } from '@/lib/types';
import { useFirebase, addDocumentNonBlocking, useCollection, useDoc } from '@/firebase';
import { orderBy } from 'firebase/firestore';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PlusCircle, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AddCategoryDialog from '@/components/category/AddCategoryDialog';

const formSchema = z.object({
  videoUrl: z.string().url('Por favor, insira uma URL válida.'),
  category: z.string().min(1, 'Por favor, selecione uma categoria.'),
  scheduledAt: z.string().optional(),
  manualTitle: z.string().optional(),
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
  const [showManualTitle, setShowManualTitle] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: '',
      category: '',
      scheduledAt: '',
      manualTitle: '',
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
    addDocumentNonBlocking(firestore, 'categories', { name: newCategoryName.trim() });
    toast({ title: 'Categoria Adicionada', description: `A categoria "${newCategoryName}" foi adicionada com sucesso.` });
    form.setValue('category', newCategoryName.trim(), { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  useEffect(() => {
    if (state.needsManualTitle) {
      setShowManualTitle(true);
      toast({
        title: 'Título Necessário',
        description: 'Não conseguimos identificar o título. Por favor, digite-o abaixo.',
      });
    }

    if (state.error && !state.needsManualTitle) {
      toast({ variant: 'destructive', title: 'Erro', description: state.error });
    }

    if (state.title && state.videoUrl && state.category && state.videoUrl !== processedUrl.current) {
      processedUrl.current = state.videoUrl;

      const newVideo: Omit<Video, 'id' | 'createdAt'> = {
        youtubeUrl: state.videoUrl, 
        title: state.title,
        summary: settings?.defaultSummary || '',
        isLive: false,
        category: state.category,
        scheduledAt: state.scheduledAt || '',
        viewCount: 0,
        // Usamos timestamp negativo para que novos vídeos apareçam no topo por padrão
        // na ordenação ascendente por 'order'
        order: Date.now() * -1,
      };

      addDocumentNonBlocking(firestore, 'videos', newVideo);
      toast({ title: 'Vídeo adicionado!', description: `"${state.title}" foi salvo no catálogo.` });
      form.reset();
      setShowManualTitle(false);
      processedUrl.current = '';
    }
  }, [state, form, firestore, settings]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form action={formAction} className="space-y-4">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Vídeo (YouTube, Facebook ou Instagram)</FormLabel>
                <FormControl>
                  <Input placeholder="Cole o link do vídeo aqui..." {...field} />
                </FormControl>
                <div className="flex gap-2 mt-2 opacity-50 text-[10px] uppercase font-bold">
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> YouTube</span>
                  <span>•</span>
                  <span>Facebook</span>
                  <span>•</span>
                  <span>Instagram</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {showManualTitle && (
            <FormField
              control={form.control}
              name="manualTitle"
              render={({ field }) => (
                <FormItem className="bg-primary/5 p-4 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <FormLabel>Título do Vídeo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do vídeo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
          <SubmitButton className="w-full">
            {showManualTitle ? 'Confirmar e Adicionar' : 'Processar e Adicionar'}
          </SubmitButton>
        </form>
      </Form>

      <AddCategoryDialog isOpen={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen} onCategoryAdded={handleCategoryAdded} />

      {state.error && !state.needsManualTitle && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Falha ao Adicionar</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
         </Alert>
      )}
    </div>
  );
}
