import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Acesso Admin</CardTitle>
          <CardDescription>
            Faça login para gerenciar os vídeos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@exemplo.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required />
            </div>
            {/* Em uma aplicação real, aqui haveria uma server action para autenticar. */}
            {/* Por enquanto, o botão apenas navega para a página de adicionar vídeo. */}
            <Button type="submit" className="w-full" asChild>
              <Link href="/admin/add-video">Entrar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
