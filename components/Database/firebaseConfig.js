// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBk1bsPhrBViDMYsUJNgHrb_eT4hA1frVs",
    authDomain: "iotnhom5-8942c.firebaseapp.com",
    databaseURL: "https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iotnhom5-8942c",
    storageBucket: "iotnhom5-8942c.appspot.com",
    messagingSenderId: "sender-id",
    appId: "app-id",
    measurementId: "G-measurement-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };