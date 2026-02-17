
import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// Note: These are non-blocking and do not await the result.
// This is for optimistic UI updates.

export const addDocumentNonBlocking = (firestore: Firestore, path: string, data: any) => {
  addDoc(collection(firestore, path), {
    ...data,
    createdAt: serverTimestamp(),
  }).catch((error) => {
    console.error(`Error adding document to ${path}:`, error);
  });
};

export const setDocumentNonBlocking = (firestore: Firestore, path: string, data: any) => {
  setDoc(doc(firestore, path), data, { merge: true }).catch((error) => {
    console.error(`Error setting document at ${path}:`, error);
  });
};

export const deleteDocumentNonBlocking = (firestore: Firestore, path: string) => {
  deleteDoc(doc(firestore, path)).catch((error) => {
    console.error(`Error deleting document at ${path}:`, error);
  });
};
