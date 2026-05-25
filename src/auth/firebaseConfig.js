import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const getAuthDomain = () => {
  if (typeof window === "undefined") return "teatr-b7904.firebaseapp.com";

  if (window.location.hostname === "khovdteatr-web-pied.vercel.app") {
    return window.location.hostname;
  }

  return "teatr-b7904.firebaseapp.com";
};

const firebaseConfig = {
  apiKey: "AIzaSyA9Aj_4W7LvkjHjqM8YU4Xe248MnKwkYlk",
  authDomain: getAuthDomain(),
  projectId: "teatr-b7904",
  storageBucket: "teatr-b7904.firebasestorage.app",
  messagingSenderId: "922943907436",
  appId: "1:922943907436:web:567130a9af38a69fd89a49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
