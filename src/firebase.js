// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaYz8tcIDhmZLs1ubtKIlHQXLxzjVDsTY",
  authDomain: "legal-meet-e8009.firebaseapp.com",
  projectId: "legal-meet-e8009",
  storageBucket: "legal-meet-e8009.appspot.com", // ✅ note the .appspot.com
  messagingSenderId: "533984328904",
  appId: "1:533984328904:web:bac56b30111032c23639fd",
  measurementId: "G-QM5D1KJMGD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// AUTH (if you need login elsewhere)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// FIRESTORE (used in AboutUs.jsx)
export const db = getFirestore(app);
