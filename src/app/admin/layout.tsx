'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login page.
    // We also make sure we are not already on the login page to avoid a redirect loop.
    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
     // If the user is logged in and tries to access the login page, redirect them to the dashboard.
    if (!loading && user && pathname === '/admin/login') {
      router.push('/admin/add-video');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg font-medium text-foreground">
          Verificando autenticação...
        </p>
      </div>
    );
  }
  
  // Render children if the user is authenticated, or if they are on the login page.
  // This prevents non-authenticated users from seeing anything other than the login page.
  if (user || pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // This state is briefly visible while the redirect is in flight.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg font-medium text-foreground">
          Redirecionando...
        </p>
      </div>
  );
}
