import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

declare const require: (moduleName: string) => {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const { getReactNativePersistence } = require('@firebase/auth');

const getWebAuthDomain = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return 'teatr-b7904.firebaseapp.com';
  }

  const configuredAuthDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (configuredAuthDomain) return configuredAuthDomain;

  const hostname = window.location.hostname;
  if (hostname.endsWith('.vercel.app')) return hostname;

  return 'teatr-b7904.firebaseapp.com';
};

const firebaseConfig = {
  apiKey: 'AIzaSyA9Aj_4W7LvkjHjqM8YU4Xe248MnKwkYlk',
  authDomain: getWebAuthDomain(),
  projectId: 'teatr-b7904',
  storageBucket: 'teatr-b7904.firebasestorage.app',
  messagingSenderId: '922943907436',
  appId: '1:922943907436:web:567130a9af38a69fd89a49',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const getFirebaseAuth = () => {
  if (Platform.OS === 'web') return getAuth(app);

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
};

export const firebaseAuth = getFirebaseAuth();
