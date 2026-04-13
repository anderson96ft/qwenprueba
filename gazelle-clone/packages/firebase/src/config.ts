/**
 * Configuración de Firebase para Gazelle Clone
 * Proyecto: telfi-ef311
 * https://console.firebase.google.com/project/telfi-ef311
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Configuración hardcodeada del proyecto telfi-ef311
const firebaseConfig = {
  apiKey: "AIzaSyDv1ec6Ae3w5vK7fhFnSf4QgRtvY1M6DhE",
  authDomain: "telfi-ef311.firebaseapp.com",
  projectId: "telfi-ef311",
  storageBucket: "telfi-ef311.firebasestorage.app",
  messagingSenderId: "323182658211",
  appId: "1:323182658211:web:20e88bb10e8293a0fff516",
  measurementId: "G-PCLVLNX6WC"
};

// Inicializar Firebase (solo si no está ya inicializado)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Servicios de Firebase
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Analytics (solo en cliente - SSR safe)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
