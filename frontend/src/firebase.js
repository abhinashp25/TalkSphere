// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwtqBQyPzZ6WyEXxF6IagyC-BIPl1zKtY",
  authDomain: "realtime-chat-app-1b5af.firebaseapp.com",
  projectId: "realtime-chat-app-1b5af",
  storageBucket: "realtime-chat-app-1b5af.firebasestorage.app",
  messagingSenderId: "1044241114935",
  appId: "1:1044241114935:web:3522cfee409e1d737e9cb2",
  measurementId: "G-T23Q1PWVJG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();