// ============================================================
// FIREBASE CONFIGURATION
// החלף את הערכים האלה עם ה-config שלך מ-Firebase Console
// הוראות: https://console.firebase.google.com
// Project Settings → Your Apps → SDK setup and configuration
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDIlT8gXFLXDF0qC4F1jl14bglFcsaJyIY",
  authDomain: "nutrifit-pro-8e99b.firebaseapp.com",
  projectId: "nutrifit-pro-8e99b",
  storageBucket: "nutrifit-pro-8e99b.firebasestorage.app",
  messagingSenderId: "526917231875",
  appId: "1:526917231875:web:c84a9a07dfea934ae67536",
};

// COACH EMAILS - הוסף פה את המייל שלך
export const COACH_EMAILS = [
  'yogevsport@gmail.com',
  'yogevmarkanti@gmail.com',
];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
