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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  logoUrl: z.string().url('Por favor, insira uma URL válida.'),
});

type Settings = {
  logoUrl: string;
};

export default function LogoSettingsForm() {
  const { firestore } = useFirebase();
  const { data: settings, loading } = useDoc<Settings>('settings/config');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ logoUrl: settings.logoUrl });
    }
  }, [settings, form]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setDocumentNonBlocking(firestore, 'settings/config', data);
    toast({
      title: 'Logo Atualizado!',
      description: 'A URL do logo foi salva com sucesso.',
    });
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">
            Configurações do Logo
          </CardTitle>
          <CardDescription>
            Gerencie a imagem do logo exibida no cabeçalho do site.
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
          Configurações do Logo
        </CardTitle>
        <CardDescription>
          Gerencie a imagem do logo exibida no cabeçalho do site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem do Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar URL do Logo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
