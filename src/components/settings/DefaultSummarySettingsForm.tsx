'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useFirebase, useDoc, setDocumentNonBlocking } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  defaultSummary: z.string().optional(),
});

type Settings = {
  logoUrl: string;
  defaultSummary?: string;
};

export default function DefaultSummarySettingsForm() {
  const { firestore } = useFirebase();
  const { data: settings, loading } = useDoc<Settings>('settings/config');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultSummary: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ defaultSummary: settings.defaultSummary || '' });
    }
  }, [settings, form]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setDocumentNonBlocking(firestore, 'settings/config', { defaultSummary: data.defaultSummary || '' });
    toast({
      title: 'Resumo Padrão Atualizado!',
      description: 'O texto padrão para o resumo foi salvo com sucesso.',
    });
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">
            Resumo Padrão dos Vídeos
          </CardTitle>
          <CardDescription>
            Defina um texto padrão que será usado como resumo para novos vídeos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">
          Resumo Padrão dos Vídeos
        </CardTitle>
        <CardDescription>
          Defina um texto padrão que será usado como resumo para novos vídeos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="defaultSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto do Resumo Padrão</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Insira o texto que aparecerá por padrão no resumo de cada novo vídeo..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Resumo Padrão
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
