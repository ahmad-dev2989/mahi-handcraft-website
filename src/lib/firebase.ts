import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isPlaceholder = !apiKey || apiKey === 'your_api_key_here' || apiKey === '';

// Check if we are running in Mock Mode (no Firebase credentials provided)
export const isMockMode = isPlaceholder;

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
const dynamicAuthDomain = currentHost && (currentHost.includes('web.app') || currentHost.includes('firebaseapp.com'))
  ? currentHost
  : (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mahi-handwoven.web.app');

// Supply dummy/fallback config values to prevent SDK initialization errors
const firebaseConfig = {
  apiKey: isPlaceholder ? 'dummy-api-key-value-for-local-mocking' : apiKey,
  authDomain: dynamicAuthDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mahi-handcrafts',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mahi-handcrafts.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '672287528166',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:672287528166:web:e3d8b89a37c88748d41727'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
