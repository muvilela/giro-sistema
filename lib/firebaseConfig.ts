"use client";

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCXKd8qENzlzfezZy5ECe7PsEp7k9G5C6E",
  authDomain: "giro-sistema-5bc37.firebaseapp.com",
  projectId: "giro-sistema-5bc37",
  storageBucket: "giro-sistema-5bc37.firebasestorage.app",
  messagingSenderId: "341855560527",
  appId: "1:341855560527:web:d2b11eed8f2cb02426db3a",
  measurementId: "G-V2JSZG445V"
};

const app = initializeApp(firebaseConfig)

// Inicializa os serviços
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
