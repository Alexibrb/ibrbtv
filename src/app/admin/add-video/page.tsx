'use client';
import AddVideoForm from '@/components/video/AddVideoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VideoListManager from '@/components/video/VideoListManager';
import { useCollection } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function AddVideoPage() {
  const { data: categories, loading, error } = useCollection('categories');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Teste de Conexão com o Banco de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Testando conexão...</p>}
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Falha na Conexão</AlertTitle>
              <AlertDescription>
                <p>Não foi possível conectar ao Firestore. Verifique as permissões e a configuração.</p>
                <p className="font-mono text-xs mt-2">{error.message}</p>
              </AlertDescription>
            </Alert>
          )}
          {categories && !error && (
             <Alert variant="default">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Conexão bem-sucedida!</AlertTitle>
              <AlertDescription>
                <p>Conectado ao Firestore com sucesso. Categorias encontradas:</p>
                <ul className="list-disc pl-5 mt-2">
                  {categories.map((c: any) => <li key={c.id}>{c.name}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}
           {!loading && !error && !categories?.length && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Conexão bem-sucedida, mas sem dados.</AlertTitle>
              <AlertDescription>
                A coleção 'categories' está vazia. Adicione uma categoria para começar.
              </AlertDescription>
            </Alert>
           )}
        </CardContent>
      </Card>

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
