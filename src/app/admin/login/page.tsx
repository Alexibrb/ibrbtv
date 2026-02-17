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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'E-mail ou senha incorretos. Por favor, tente novamente.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'O formato do e-mail é inválido.';
      }
      setError(friendlyMessage);
      console.error('Firebase Login Error:', err);
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
      console.error('Firebase Password Reset Error:', err);
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
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@exemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isResetting}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Button
                      type="button"
                      variant="link"
                      className="ml-auto inline-block h-auto p-0 text-sm"
                      onClick={handlePasswordReset}
                      disabled={isLoading || isResetting || !email}
                  >
                      {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Esqueceu a senha?"}
                  </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isResetting}
              />
            </div>
             {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Falha na Operação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || isResetting}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogIn />
              )}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
