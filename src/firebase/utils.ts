
import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore } from './provider';

// Note: These are non-blocking and do not await the result.
// This is for optimistic UI updates.

export const addDocumentNonBlocking = (path: string, data: any) => {
  const firestore = useFirestore();
  addDoc(collection(firestore, path), {
    ...data,
    createdAt: serverTimestamp(),
  }).catch((error) => {
    console.error(`Error adding document to ${path}:`, error);
  });
};

export const setDocumentNonBlocking = (path: string, data: any) => {
  const firestore = useFirestore();
  setDoc(doc(firestore, path), data, { merge: true }).catch((error) => {
    console.error(`Error setting document at ${path}:`, error);
  });
};

export const deleteDocumentNonBlocking = (path: string) => {
  const firestore = useFirestore();
  deleteDoc(doc(firestore, path)).catch((error) => {
    console.error(`Error deleting document at ${path}:`, error);
  });
};
