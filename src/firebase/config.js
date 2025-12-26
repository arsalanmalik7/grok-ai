import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAyGVCglzZLiNzlVHwyo83hqgxnOPckzPY",
  authDomain: "grok-ai-3dcf2.firebaseapp.com",
  projectId: "grok-ai-3dcf2",
  storageBucket: "grok-ai-3dcf2.firebasestorage.app",
  messagingSenderId: "888952984192",
  appId: "1:888952984192:web:13c41d76926f63e5d4cc65",
  measurementId: "G-XEH0H0X86M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);

export default app;

