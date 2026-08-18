import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isPlaceholder = !apiKey || apiKey === 'your_api_key_here' || apiKey === '';

// Check if we are running in Mock Mode (no Firebase credentials provided)
export const isMockMode = isPlaceholder;

// Supply dummy/fallback config values to prevent SDK initialization errors
const firebaseConfig = {
  apiKey: isPlaceholder ? 'dummy-api-key-value-for-local-mocking' : apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mahi-handcraft.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mahi-handcraft',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mahi-handcraft.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
