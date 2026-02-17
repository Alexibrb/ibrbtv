'use client';
import { useState, useEffect } from 'react';
import { FirebaseProvider, type FirebaseProviderProps } from './provider';
import { initializeFirebase } from './init';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseProviderProps | null>(null);

  useEffect(() => {
    const init = async () => {
      const firebaseInstance = await initializeFirebase();
      setFirebase(firebaseInstance);
    };
    init();
  }, []);

  if (!firebase) {
    // You can render a loading state here
    return <div>Loading Firebase...</div>;
  }

  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
