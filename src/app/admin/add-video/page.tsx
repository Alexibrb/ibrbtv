import AddVideoForm from '@/components/video/AddVideoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VideoListManager from '@/components/video/VideoListManager';

export default function AddVideoPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Adicionar Novo Vídeo</CardTitle>
          <CardDescription>
            Insira a URL de um vídeo do YouTube para gerar um resumo com IA e adicioná-lo ao catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddVideoForm />
        </CardContent>
      </Card>
      <VideoListManager />
    </div>
  );
}
