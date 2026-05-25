import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '../api/firebase';

export type GoogleProfile = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  providerId: string;
};

const cleanId = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith('YOUR_') ? trimmed : undefined;
};

const GOOGLE_WEB_CLIENT_ID = cleanId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
const GOOGLE_IOS_CLIENT_ID = cleanId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
const GOOGLE_ANDROID_CLIENT_ID = cleanId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  profileImageSize: 256,
});

const isMobileWeb = () => {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

const makeProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

const getGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Google profile could not be loaded.');
  }

  const profile = await res.json();
  if (!profile.email) {
    throw new Error('Google account did not provide an email address.');
  }

  return {
    name: profile.name || profile.email,
    email: profile.email,
    avatarUrl: profile.picture ?? null,
    providerId: profile.id,
  };
};

type GoogleIdentityTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleIdentityTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleIdentityTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => GoogleIdentityTokenClient;
        };
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google login is not available outside a browser.'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google login script failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google login script failed to load.'));
      document.head.appendChild(script);
    });
  }

  return googleIdentityScriptPromise;
};

const requestGoogleIdentityAccessToken = async (clientId: string) => {
  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google login script is not ready.');
  }

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid profile email',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error('Google access token was not returned.'));
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(error instanceof Error ? error : new Error('Google login popup failed.'));
      },
    });

    client.requestAccessToken({ prompt: 'select_account' });
  });
};

export const useGoogleAuth = (
  onSuccess: (profile: GoogleProfile) => Promise<void>,
) => {
  const [loading, setLoading] = useState(false);
  const syncedFirebaseUidRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const handleFirebaseUser = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.email) {
      throw new Error('Google account did not provide an email address.');
    }

    await onSuccessRef.current({
      name: firebaseUser.displayName || firebaseUser.email,
      email: firebaseUser.email,
      avatarUrl: firebaseUser.photoURL ?? null,
      providerId: firebaseUser.uid,
    });
  }, []);

  const syncFirebaseUser = useCallback(async (firebaseUser: User) => {
    if (syncedFirebaseUidRef.current === firebaseUser.uid) return;

    setLoading(true);
    try {
      await handleFirebaseUser(firebaseUser);
      syncedFirebaseUidRef.current = firebaseUser.uid;
    } finally {
      setLoading(false);
    }
  }, [handleFirebaseUser]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let alive = true;
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (!alive || !result?.user) return;
        await syncFirebaseUser(result.user);
      })
      .catch((err: any) => {
        if (alive) {
          Alert.alert('Aldaa', err?.message || 'Google login failed.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [syncFirebaseUser]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let alive = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!alive || !firebaseUser) return;

      syncFirebaseUser(firebaseUser).catch((err: any) => {
        if (alive) {
          Alert.alert('Aldaa', err?.message || 'Google login failed.');
        }
      });
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [syncFirebaseUser]);

  const startNativeAuth = async () => {
    const clientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;
    if (!clientId || !GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Google OAuth config missing',
        'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and the platform Google client ID in .env.',
      );
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      await GoogleSignin.signOut().catch(() => {});
      const result = await GoogleSignin.signIn();
      const user = result.data?.user;

      if (!user?.email) {
        throw new Error('Google account did not provide an email address.');
      }

      await onSuccessRef.current({
        name: user.name || user.email,
        email: user.email,
        avatarUrl: user.photo ?? null,
        providerId: user.id,
      });
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Aldaa', err?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const startWebAuth = async () => {
    setLoading(true);
    try {
      if (isMobileWeb() && GOOGLE_WEB_CLIENT_ID) {
        const accessToken = await requestGoogleIdentityAccessToken(GOOGLE_WEB_CLIENT_ID);
        const profile = await getGoogleProfile(accessToken);
        await onSuccessRef.current(profile);
        return;
      }

      if (isMobileWeb()) {
        await signInWithRedirect(firebaseAuth, makeProvider());
        return;
      }

      const result = await signInWithPopup(firebaseAuth, makeProvider());
      if (result.user) {
        await syncFirebaseUser(result.user);
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        return;
      }
      Alert.alert('Aldaa', err?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const startGoogleAuth = useCallback(() => {
    if (Platform.OS === 'web') return startWebAuth();
    return startNativeAuth();
  }, [syncFirebaseUser]);

  return { startGoogleAuth, googleLoading: loading };
};
