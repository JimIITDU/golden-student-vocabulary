// ═══════════════════════════════════════════
// FIREBASE CONFIGURATION
// Replace the values below with YOUR Firebase
// project credentials from Firebase Console
// ═══════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔴 REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG
// Go to: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey: "AIzaSyAl3frbAoV4bqumzfJR3Zb_h1VdGCOrb7U",
  authDomain: "golden-student-vocabulary.firebaseapp.com",
  projectId: "golden-student-vocabulary",
  storageBucket: "golden-student-vocabulary.firebasestorage.app",
  messagingSenderId: "1022645477573",
  appId: "1:1022645477573:web:0cdb4a3fcbc93fb5a9d0ac",
  measurementId: "G-VGG1LG8QSE"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
export default app;
