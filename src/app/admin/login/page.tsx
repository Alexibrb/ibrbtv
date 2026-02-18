'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel de administração.',
      });
      // A rota do admin layout irá redirecionar automaticamente
      router.push('/admin/add-video');
    } catch (err: any) {
      let friendlyMessage = 'Ocorreu um erro ao tentar fazer login.';
      // Handles invalid credentials (user not found, wrong password)
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'E-mail ou senha incorretos. Por favor, tente novamente.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'O formato do e-mail é inválido.';
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail no campo acima para redefinir a senha.');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Verifique seu e-mail',
        description: 'Se sua conta existir, um link para redefinição de senha foi enviado.',
      });
    } catch (err: any) {
      // Don't reveal if user exists. The generic message is safer.
       toast({
        title: 'Verifique seu e-mail',
        description: 'Se sua conta existir, um link para redefinição de senha foi enviado.',
      });
    } finally {
      setIsResetting(false);
    }
  };

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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isResetting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isResetting}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
              <Button
                type="button"
                variant="link"
                className="px-0 font-normal text-muted-foreground"
                onClick={handlePasswordReset}
                disabled={isResetting || isLoading}
              >
                {isResetting ? 'Enviando e-mail...' : 'Esqueceu a senha?'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
