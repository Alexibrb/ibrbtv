
import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
  type SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';


// Note: These are non-blocking and do not await the result.
// This is for optimistic UI updates.

export const addDocumentNonBlocking = (firestore: Firestore, path: string, data: any) => {
    const dataWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
    };
    const collectionRef = collection(firestore, path);
    addDoc(collectionRef, dataWithTimestamp).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataWithTimestamp,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

export const setDocumentNonBlocking = (firestore: Firestore, path: string, data: any, options?: SetOptions) => {
  const docRef = doc(firestore, path);
  setDoc(docRef, data, { merge: true, ...options }).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update', // With merge:true it's effectively an update
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
  });
};

export const deleteDocumentNonBlocking = (firestore: Firestore, path: string) => {
    const docRef = doc(firestore, path);
    deleteDoc(docRef).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};
