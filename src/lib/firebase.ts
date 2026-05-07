import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore to enable long-polling which is more reliable in some proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection as required by integration instructions
export async function testConnection() {
  try {
    // Only log if it's a genuine connection error, not just a missing document
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('the client is offline')) {
      console.error("Firestore connection attempt failed. This might be a temporary network issue or the database is still provisioning.");
    }
  }
}

testConnection();

export { 
  collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot,
  signInWithPopup, signOut
};
