import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Provisioned Firebase configuration for this project
export const firebaseConfig = {
  projectId: "plexiform-collector-mxjsq",
  appId: "1:564360075572:web:538cd09f0f5c3a8e86ad61",
  apiKey: "AIzaSyDBBMpHeO9ZYnfh7CH0Inth8wzxbFB8384",
  authDomain: "plexiform-collector-mxjsq.firebaseapp.com",
  storageBucket: "plexiform-collector-mxjsq.firebasestorage.app",
  messagingSenderId: "564360075572",
  measurementId: "",
  oAuthClientId: "564360075572-cfi2jhk6i4hcg0r0rt7mv86qe2bhtssn.apps.googleusercontent.com",
};

// Explicit Firestore Database ID configured for this project
export const FIRESTORE_DATABASE_ID = "ai-studio-stitchtrackpro-cac50c02-fc31-4d4e-86f5-e248039348ad";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add Google Sheets and Drive scopes to provider for automated spreadsheet sync
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Initialize Firestore pointing to the active provisioned database
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

export default app;
