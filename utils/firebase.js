import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLPwMu01GaslUvTnaMMqo5dLxKVYRydVE",
  authDomain: "komisi-f547f.firebaseapp.com",
  projectId: "komisi-f547f",
  storageBucket: "komisi-f547f.firebasestorage.app",
  messagingSenderId: "581906009884",
  appId: "1:581906009884:web:b9d07112cdfff8efaf34d9",
  measurementId: "G-M6M71Z83LE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
