import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment12345678",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grade-glow-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grade-glow-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grade-glow-hub.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "", 
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