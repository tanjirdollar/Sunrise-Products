import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel, Firestore } from 'firebase/firestore';

// Configured Firebase project (scanne-bijoy)
export const firebaseConfig = {
  apiKey: "AIzaSyDnb1i8POqU5lu8AJ8DVsjBqTGkPlciLhQ",
  authDomain: "scanne-bijoy.firebaseapp.com",
  projectId: "scanne-bijoy",
  storageBucket: "scanne-bijoy.firebasestorage.app",
  messagingSenderId: "858072248658",
  appId: "1:858072248658:web:2f06c03f10b55a6c80ca8b"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add Google Sheets and Drive scopes to provider for automated spreadsheet sync
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Suppress non-critical Firestore network reconnection notices in client console
try {
  setLogLevel('error');
} catch {
  // Ignore in environments where setLogLevel is restricted
}

// Initialize Firestore with auto-detect long polling to prevent [code=unavailable] WebChannel stream disconnects
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

export default app;
