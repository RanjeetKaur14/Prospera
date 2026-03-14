// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASafNKN4GxXCaKOsCR5KAK55LFDZnXkZc",
  authDomain: "prospera-2c43a.firebaseapp.com",
  databaseURL: "https://prospera-2c43a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prospera-2c43a",
  storageBucket: "prospera-2c43a.firebasestorage.app",
  messagingSenderId: "79794422683",
  appId: "1:79794422683:web:448550a604690151a2973e",
  measurementId: "G-QPNP7Q43VT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (optional)
const analytics = getAnalytics(app);