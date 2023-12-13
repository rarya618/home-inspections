// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0_PKdIrndnwmgl1pq62AiUUUwLNVM1Rw",
  authDomain: "russ-home-search.firebaseapp.com",
  projectId: "russ-home-search",
  storageBucket: "russ-home-search.appspot.com",
  messagingSenderId: "320768596407",
  appId: "1:320768596407:web:55bb063a9f60318bfb3032",
  measurementId: "G-BMGWS3NMGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);