// Firebase config for Node.js scripts (like seeding)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBtY9Uw9o7AZyvb9xXc9jkvpwA18YNQ0l0",
  authDomain: "interviewx-82f75.firebaseapp.com",
  projectId: "interviewx-82f75",
  storageBucket: "interviewx-82f75.firebasestorage.app",
  messagingSenderId: "669977321579",
  appId: "1:669977321579:web:ba104387ac9ec754c4112e",
  measurementId: "G-NSV9NNCN66"
};
// between app restarts. This can be fixed later with proper React Native persistence setup.
const auth = getAuth(app);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db,auth as Firebase};

