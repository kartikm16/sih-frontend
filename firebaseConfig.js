// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAqK_GGEUELDtQjh8Nw-ERDjoj3b1MTlA0",
  authDomain: "sih-tech810.firebaseapp.com",
  databaseURL: "https://sih-tech810-default-rtdb.firebaseio.com",
  projectId: "sih-tech810",
  storageBucket: "sih-tech810.firebasestorage.app",
  messagingSenderId: "271997109217",
  appId: "1:271997109217:web:022e233feaa668946308a0",
  measurementId: "G-JHJKQX3JXY"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
