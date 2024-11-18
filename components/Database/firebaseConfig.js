// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAUmPWMOmENxc3AiwojQvCCMj7HBKWafC4",
    authDomain: "appfirebase1-d1c0a.firebaseapp.com",
    databaseURL: "https://appfirebase1-d1c0a-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "appfirebase1-d1c0a",
    storageBucket: "appfirebase1-d1c0a.appspot.com",
    messagingSenderId: "sender-id",
    appId: "app-id",
    measurementId: "G-measurement-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestoreDb = getFirestore(app);

export { database, firestoreDb };