
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  Query,
  DocumentReference,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from './provider';

export type WithId<T> = T & { id: string };

export function useCollection<T>(path: string, ...queryConstraints: QueryConstraint[]) {
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const q = useMemo(
    () => query(collection(firestore, path), ...queryConstraints),
    [firestore, path, JSON.stringify(queryConstraints)]
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WithId<T>)
        );
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}

export function useDoc<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemo(() => doc(firestore, path), [firestore, path]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as WithId<T>);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
