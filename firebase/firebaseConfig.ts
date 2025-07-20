import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBtY9Uw9o7AZyvb9xXc9jkvpwA18YNQ0l0",
  authDomain: "interviewx-82f75.firebaseapp.com",
  projectId: "interviewx-82f75",
  storageBucket: "interviewx-82f75.firebasestorage.app",
  messagingSenderId: "669977321579",
  appId: "1:669977321579:web:ba104387ac9ec754c4112e",
  measurementId: "G-NSV9NNCN66"
};

const app = initializeApp(firebaseConfig);

// Note: Using getAuth() for now. The warning about AsyncStorage persistence
// is just a warning - authentication will still work, but sessions won't persist
// between app restarts. This can be fixed later with proper React Native persistence setup.
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

