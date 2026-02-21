'use client';
import AddVideoForm from '@/components/video/AddVideoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VideoListManager from '@/components/video/VideoListManager';
import LogoSettingsForm from '@/components/settings/LogoSettingsForm';
import DefaultSummarySettingsForm from '@/components/settings/DefaultSummarySettingsForm';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { LogOut, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CategoryCounts } from '@/components/video/CategoryCounts';

export default function AddVideoPage() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com segurança.',
    });
    router.push('/');
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
           <h1 className="text-2xl font-bold">Painel de Administração</h1>
           <p className="text-muted-foreground text-sm">Logado como: {user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
      
      <Accordion type="single" collapsible className="w-full border rounded-lg shadow-lg px-6">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger>
            <h2 className="flex items-center text-xl font-semibold font-headline">
              <Settings className="mr-3 h-6 w-6" />
              Configurações Gerais
            </h2>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <LogoSettingsForm />
            <DefaultSummarySettingsForm />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Adicionar Novo Vídeo</CardTitle>
          <CardDescription>
            Insira a URL de um vídeo do YouTube para buscar o título e adicioná-lo ao catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddVideoForm />
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Resumo do Catálogo</CardTitle>
          <CardDescription>
            Total de vídeos cadastrados por categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryCounts />
        </CardContent>
      </Card>
      
      <VideoListManager />
    </div>
  );
}
