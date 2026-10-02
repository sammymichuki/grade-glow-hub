import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "***REMOVED***",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grade-grow-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grade-glow-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grade-grow-hub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "949733365590",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:949733365590:web:c3c868a9c1ec099a4de8f7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1VG6VLVE9W", 
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only if supported and configured
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {
    // Analytics is optional and unsupported in some browser contexts
  });
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;