// const firebase_key='AIzaSyDTwymf17u3DX7ZEtnNDSrQQyEI9NKlviM'

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyDTwymf17u3DX7ZEtnNDSrQQyEI9NKlviM",
  authDomain: "chat-clone-476fc.firebaseapp.com",
  databaseURL: "https://chat-clone-476fc-default-rtdb.firebaseio.com",
  projectId: "chat-clone-476fc",
  storageBucket: "chat-clone-476fc.firebasestorage.app",
  messagingSenderId: "868830980940",
  appId: "1:868830980940:web:2d13480e9d09913277fde9",
  measurementId: "G-PTRKQT486Y",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)
