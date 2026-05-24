import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  getRedirectResult,
  GoogleAuthProvider,
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
  web: cleanId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) || cleanId(googleOAuthExtra?.webClientId),
  ios: cleanId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) || cleanId(googleOAuthExtra?.iosClientId),
  android:
    cleanId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
    cleanId(googleOAuthExtra?.androidClientId),
};

const PLACEHOLDER = 'missing-client-id.apps.googleusercontent.com';

const getNativeClientId = (): string | undefined => {
  if (Platform.OS === 'ios') return CLIENT_IDS.ios;
  if (Platform.OS === 'android') return CLIENT_IDS.android;
  return CLIENT_IDS.web;
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

const isMobileWeb = () =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

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
    webClientId: CLIENT_IDS.web || PLACEHOLDER,
    iosClientId: CLIENT_IDS.ios || PLACEHOLDER,
    androidClientId: CLIENT_IDS.android || PLACEHOLDER,
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

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let active = true;
    const completeRedirect = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (active && result?.user) {
          setLoading(true);
          await handleFirebaseUser(result.user);
        }
      } catch (err: any) {
        if (active) {
          Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void completeRedirect();
    return () => {
      active = false;
    };
  }, [handleFirebaseUser]);

  useEffect(() => {
    if (!response || Platform.OS === 'web') return;

    const handle = async () => {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setLoading(false);
        return;
      }

      if (response.type !== 'success') {
        setLoading(false);
        const params = 'params' in response ? response.params : undefined;
        const message =
          params?.error_description ||
          params?.error ||
          'Google login failed.';
        Alert.alert('Aldaa', message);
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

  const startWebAuth = async () => {
    setLoading(true);
    try {
      const provider = makeProvider();

      if (isMobileWeb()) {
        restoreMobilePublicPathForRedirect();
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }

      const result = await signInWithPopup(firebaseAuth, provider);
      await handleFirebaseUser(result.user);
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }

      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        restoreMobilePublicPathForRedirect();
        await signInWithRedirect(firebaseAuth, makeProvider());
        return;
      }

      Alert.alert('Aldaa', err?.response?.data?.message || err?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const startNativeAuth = async () => {
    if (!getNativeClientId()) {
      Alert.alert(
        'Google OAuth config missing',
        `Set ${Platform.OS === 'ios' ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID' : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'} in .env.`,
      );
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
  }, [request, promptAsync, handleFirebaseUser]);

  return { startGoogleAuth, googleLoading: loading, googleRequest: request };
};
