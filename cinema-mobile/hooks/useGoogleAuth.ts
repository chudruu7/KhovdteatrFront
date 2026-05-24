import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '../api/firebase';

WebBrowser.maybeCompleteAuthSession();

export type GoogleProfile = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  providerId: string;
};

const cleanId = (value?: string): string | undefined => {
  const t = value?.trim();
  return t && !t.startsWith('YOUR_') ? t : undefined;
};

const googleOAuthExtra = Constants.expoConfig?.extra?.googleOAuth as
  | {
      webClientId?: string;
      iosClientId?: string;
      androidClientId?: string;
    }
  | undefined;

const CLIENT_IDS = {
  web:
    cleanId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) ||
    cleanId(googleOAuthExtra?.webClientId),
  ios:
    cleanId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
    cleanId(googleOAuthExtra?.iosClientId),
  android:
    cleanId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
    cleanId(googleOAuthExtra?.androidClientId),
};

const PLACEHOLDER = 'missing-client-id.apps.googleusercontent.com';

const getGoogleRedirectUri = (clientId?: string) => {
  const prefix = clientId?.replace('.apps.googleusercontent.com', '');
  return prefix ? `com.googleusercontent.apps.${prefix}:/oauthredirect` : undefined;
};

const isMobileWeb = () => {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

const restoreMobilePublicPath = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const publicPath = (window as unknown as { __CINEMA_MOBILE_PUBLIC_PATH__?: string })
    .__CINEMA_MOBILE_PUBLIC_PATH__;
  if (publicPath && window.location.pathname === '/') {
    window.history.replaceState(
      null,
      '',
      `${publicPath}${window.location.search}${window.location.hash}`,
    );
  }
};

const getNativeClientId = (): string | undefined => {
  if (Platform.OS === 'ios') return CLIENT_IDS.ios;
  if (Platform.OS === 'android') return CLIENT_IDS.android;
  return CLIENT_IDS.web;
};

const nativeRedirectUri = getGoogleRedirectUri(getNativeClientId());

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

const makeProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

export const useGoogleAuth = (
  onSuccess: (profile: GoogleProfile) => Promise<void>,
) => {
  const [loading, setLoading] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  const syncedFirebaseUidRef = useRef<string | null>(null);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     CLIENT_IDS.web     || PLACEHOLDER,
    iosClientId:     CLIENT_IDS.ios     || PLACEHOLDER,
    androidClientId: CLIENT_IDS.android || PLACEHOLDER,
    redirectUri: Platform.OS === 'web' ? undefined : nativeRedirectUri,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

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

  // ── Native: promptAsync response ──────────────────────────────────────────
  useEffect(() => {
    if (!response) return;

    const handle = async () => {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setLoading(false);
        return;
      }

      if (response.type === 'error') {
        setLoading(false);
        Alert.alert('Aldaa', response.error?.message || 'Google login error.');
        return;
      }

      if (response.type !== 'success') {
        setLoading(false);
        const params = 'params' in response ? response.params : undefined;
        Alert.alert(
          'Aldaa',
          params?.error_description || params?.error || 'Google login failed.',
        );
        return;
      }

      try {
        const accessToken = response.authentication?.accessToken;
        if (!accessToken) {
          throw new Error(
            'Google access token was not returned. Check OAuth client ID and redirect URI settings.',
          );
        }
        const profile = await getGoogleProfile(accessToken);
        await onSuccessRef.current(profile);
      } catch (err: any) {
        Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
      } finally {
        setLoading(false);
      }
    };

    void handle();
  }, [response]);

  // ── Web: signInWithPopup ──────────────────────────────────────────────────
  const startWebAuth = async () => {
    setLoading(true);
    try {
      if (isMobileWeb() && CLIENT_IDS.web) {
        restoreMobilePublicPath();
        await promptAsync({
          preferEphemeralSession: false,
          windowName: '_self',
        });
        return;
      }

      if (isMobileWeb()) {
        restoreMobilePublicPath();
        await signInWithRedirect(firebaseAuth, makeProvider());
        return;
      }

      const result = await signInWithPopup(firebaseAuth, makeProvider());
      if (result.user) {
        await syncFirebaseUser(result.user);
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      // Хэрэглэгч popup хаавал чимээгүй гарна
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

  // ── Native: expo-auth-session ─────────────────────────────────────────────
  const startNativeAuth = async () => {
    if (!getNativeClientId()) {
      const envKey =
        Platform.OS === 'ios'
          ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
          : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
      Alert.alert('Google OAuth config missing', `Set ${envKey} in .env.`);
      return;
    }

    if (!request) {
      Alert.alert('Google OAuth', 'Google login is still loading. Try again in a moment.');
      return;
    }

    setLoading(true);
    try {
      await promptAsync();
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Aldaa', err?.message || 'Could not open Google login.');
    }
  };

  const startGoogleAuth = useCallback(() => {
    if (Platform.OS === 'web') return startWebAuth();
    return startNativeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, promptAsync, syncFirebaseUser]);

  return { startGoogleAuth, googleLoading: loading, googleRequest: request };
};
