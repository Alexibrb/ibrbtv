'use client';

import { useEffect, useRef } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const formSchema = z.object({
  youtubeUrl: z.string().url('Por favor, insira uma URL válida do YouTube.'),
});

export default function AddVideoForm() {
  const initialState: FormState = { title: null, summary: null, error: null };
  const [state, formAction] = useActionState(addVideoAction, initialState);
  const processedUrl = useRef('');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: '',
    },
  });

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: state.error,
      });
    }

    if (state.summary && state.title && state.youtubeUrl && state.youtubeUrl !== processedUrl.current) {
      processedUrl.current = state.youtubeUrl;
      const newVideo: Video = {
        id: new Date().toISOString(),
        youtubeUrl: state.youtubeUrl,
        title: state.title,
        summary: state.summary,
        isLive: false,
      };

      try {
        const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const updatedVideos = [newVideo, ...storedVideos];
        localStorage.setItem('videos', JSON.stringify(updatedVideos));
        
        // Dispara um evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('videos-updated'));
        
        toast({
          title: 'Vídeo adicionado!',
          description: 'O vídeo foi salvo e adicionado ao catálogo.',
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
          <SubmitButton>Gerar Resumo e Adicionar</SubmitButton>
        </form>
      </Form>

      {state.summary && state.title && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Resumo Gerado por IA</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold">{state.title}</h3>
            <p className="text-muted-foreground mt-2">{state.summary}</p>
          </CardContent>
        </Card>
      )}

      {state.error && !state.summary && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Falha na Geração</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
         </Alert>
      )}
    </div>
  );
}
