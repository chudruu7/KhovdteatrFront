import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  getRedirectResult,
  GoogleAuthProvider,
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

// ── Debug: client ID-үүд ачаалах үед харагдана ────────────────────────────
console.log('[GoogleAuth] CLIENT_IDS:', {
  web:     CLIENT_IDS.web     ? '✓ set' : '✗ missing',
  ios:     CLIENT_IDS.ios     ? '✓ set' : '✗ missing',
  android: CLIENT_IDS.android ? '✓ set' : '✗ missing',
});

const PLACEHOLDER = 'missing-client-id.apps.googleusercontent.com';

const getNativeClientId = (): string | undefined => {
  if (Platform.OS === 'ios') return CLIENT_IDS.ios;
  if (Platform.OS === 'android') return CLIENT_IDS.android;
  return CLIENT_IDS.web;
};

const getGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  console.log('[GoogleAuth] Fetching Google profile...');
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error('[GoogleAuth] Profile fetch failed:', res.status, res.statusText);
    throw new Error('Google profile could not be loaded.');
  }

  const profile = await res.json();
  console.log('[GoogleAuth] Profile fetched:', {
    email: profile.email,
    name: profile.name,
    hasId: !!profile.id,
  });

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

const restoreMobilePublicPathForRedirect = () => {
  if (typeof window === 'undefined') return;
  const publicPath = (window as any).__CINEMA_MOBILE_PUBLIC_PATH__;
  if (publicPath && window.location.pathname === '/') {
    window.history.replaceState(null, '', publicPath);
  }
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
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     CLIENT_IDS.web     || PLACEHOLDER,
    iosClientId:     CLIENT_IDS.ios     || PLACEHOLDER,
    androidClientId: CLIENT_IDS.android || PLACEHOLDER,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // ── Debug: request бэлэн болсон эсэх ──────────────────────────────────────
  useEffect(() => {
    console.log('[GoogleAuth] request ready:', !!request);
    if (request) {
      console.log('[GoogleAuth] redirect URI:', request.url);
    }
  }, [request]);

  const handleFirebaseUser = useCallback(async (firebaseUser: User) => {
    console.log('[GoogleAuth] handleFirebaseUser:', firebaseUser.email);
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

  // ── Web: redirect буцаж ирэх ──────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let active = true;
    const completeRedirect = async () => {
      try {
        console.log('[GoogleAuth] Checking redirect result (web)...');
        const result = await getRedirectResult(firebaseAuth);
        console.log('[GoogleAuth] Redirect result:', result ? 'user found' : 'no result');
        if (active && result?.user) {
          setLoading(true);
          await handleFirebaseUser(result.user);
        }
      } catch (err: any) {
        console.error('[GoogleAuth] Redirect error:', err?.code, err?.message);
        if (active) {
          Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void completeRedirect();
    return () => { active = false; };
  }, [handleFirebaseUser]);

  // ── Native: promptAsync response ──────────────────────────────────────────
  useEffect(() => {
    if (!response || Platform.OS === 'web') return;

    console.log('[GoogleAuth] promptAsync response type:', response.type);

    const handle = async () => {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        console.warn(
          '[GoogleAuth] Auth dismissed/cancelled.\n' +
          'Шалгах зүйлс:\n' +
          '1. app.json дотор "scheme" тохируулсан уу?\n' +
          '2. Google Cloud Console-д redirect URI нэмсэн үү?\n' +
          '   Expo Go: https://auth.expo.io/@<username>/<slug>\n' +
          '   Dev build: <scheme>://'
        );
        setLoading(false);
        return;
      }

      if (response.type === 'error') {
        console.error('[GoogleAuth] response error:', response.error);
        setLoading(false);
        Alert.alert('Aldaa', response.error?.message || 'Google login error.');
        return;
      }

      if (response.type !== 'success') {
        console.warn('[GoogleAuth] Unexpected response type:', response.type);
        setLoading(false);
        const params = 'params' in response ? response.params : undefined;
        const message =
          params?.error_description ||
          params?.error ||
          'Google login failed.';
        Alert.alert('Aldaa', message);
        return;
      }

      // ── Success ──────────────────────────────────────────────────────────
      console.log('[GoogleAuth] Auth success, getting access token...');
      try {
        const accessToken = response.authentication?.accessToken;
        console.log('[GoogleAuth] accessToken present:', !!accessToken);

        if (!accessToken) {
          throw new Error(
            'Google access token was not returned.\n' +
            'Check OAuth client ID and redirect URI settings.',
          );
        }

        const profile = await getGoogleProfile(accessToken);
        console.log('[GoogleAuth] Calling onSuccess with profile:', profile.email);
        await onSuccessRef.current(profile);
        console.log('[GoogleAuth] onSuccess completed.');
      } catch (err: any) {
        console.error('[GoogleAuth] Error after success response:', err?.message);
        Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
      } finally {
        setLoading(false);
      }
    };

    void handle();
  }, [response]);

  // ── Web sign-in ───────────────────────────────────────────────────────────
  const startWebAuth = async () => {
    console.log('[GoogleAuth] Starting web auth (redirect)...');
    setLoading(true);
    try {
      restoreMobilePublicPathForRedirect();
      await signInWithRedirect(firebaseAuth, makeProvider());
    } catch (err: any) {
      const code = err?.code ?? '';
      console.error('[GoogleAuth] Web auth error:', code, err?.message);
      if (code === 'auth/cancelled-popup-request') return;
      Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Native sign-in ────────────────────────────────────────────────────────
  const startNativeAuth = async () => {
    console.log('[GoogleAuth] Starting native auth...');
    console.log('[GoogleAuth] Platform:', Platform.OS);
    console.log('[GoogleAuth] Native client ID present:', !!getNativeClientId());
    console.log('[GoogleAuth] request ready:', !!request);

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
      console.log('[GoogleAuth] Calling promptAsync...');
      const result = await promptAsync();
      console.log('[GoogleAuth] promptAsync result type:', result.type);
    } catch (err: any) {
      console.error('[GoogleAuth] promptAsync threw:', err?.message);
      setLoading(false);
      Alert.alert('Aldaa', err?.message || 'Could not open Google login.');
    }
  };

  const startGoogleAuth = useCallback(() => {
    if (Platform.OS === 'web') return startWebAuth();
    return startNativeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, promptAsync, handleFirebaseUser]);

  return { startGoogleAuth, googleLoading: loading, googleRequest: request };
};