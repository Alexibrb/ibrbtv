'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from './provider';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export type WithId<T> = T & { id: string };

export function useCollection<T>(path: string, ...queryConstraints: QueryConstraint[]) {
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const q = useMemo(
    () => query(collection(firestore, path), ...queryConstraints),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firestore, path, JSON.stringify(queryConstraints)]
  );

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    };
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WithId<T>)
        );
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
        const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
          });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [q, path]);

  return { data, loading, error };
}

export function useDoc<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemo(() => {
    if (!path) return null;
    return doc(firestore, path);
  }, [firestore, path]);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    };
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as WithId<T>);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
        const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'get',
          });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [docRef, path]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
