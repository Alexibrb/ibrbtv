'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export type FirebaseProviderProps = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  children: React.ReactNode;
};

const FirebaseContext = createContext<Omit<
  FirebaseProviderProps,
  'children'
> | null>(null);

export function FirebaseProvider({
  children,
  ...props
}: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={props}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
