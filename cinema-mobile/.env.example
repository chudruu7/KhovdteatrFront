import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '../api/firebase';

WebBrowser.maybeCompleteAuthSession();

// ── Types ─────────────────────────────────────────────────────────────────────
export type GoogleProfile = {
  name:       string;
  email:      string;
  avatarUrl?: string | null;
  providerId: string;
};

// ── Client IDs from EXPO_PUBLIC_ env vars ─────────────────────────────────────
// Constants.expoConfig.extra requires manual mapping in app.config.js.
// EXPO_PUBLIC_ vars are inlined at build time and work without extra config.
const cleanId = (value?: string): string | undefined => {
  const t = value?.trim();
  return t && !t.startsWith('YOUR_') ? t : undefined;
};

const CLIENT_IDS = {
  web:     cleanId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  ios:     cleanId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  android: cleanId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
};

// useAuthRequest requires non-undefined strings — use a placeholder so the
// hook initialises, then we guard before actually calling promptAsync().
const PLACEHOLDER = 'missing-client-id.apps.googleusercontent.com';

const getNativeClientId = (): string | undefined => {
  if (Platform.OS === 'ios')     return CLIENT_IDS.ios;
  if (Platform.OS === 'android') return CLIENT_IDS.android;
  return CLIENT_IDS.web;
};

// ── Google userinfo fetch ─────────────────────────────────────────────────────
const getGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Google хэрэглэгчийн мэдээлэл авахад алдаа гарлаа.');

  const profile = await res.json();
  if (!profile.email) throw new Error('Google бүртгэлээс имэйл авах боломжгүй байна.');

  return {
    name:       profile.name || profile.email,
    email:      profile.email,
    avatarUrl:  profile.picture ?? null,
    providerId: profile.id,
  };
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useGoogleAuth = (
  onSuccess: (profile: GoogleProfile) => Promise<void>,
) => {
  const [loading, setLoading] = useState(false);

  // Stable ref so the useEffect dependency array doesn't need onSuccess,
  // preventing the effect from re-running on every parent render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     CLIENT_IDS.web     || PLACEHOLDER,
    iosClientId:     CLIENT_IDS.ios     || PLACEHOLDER,
    androidClientId: CLIENT_IDS.android || PLACEHOLDER,
    scopes:          ['openid', 'profile', 'email'],
    selectAccount:   true,
  });

  // Handle native OAuth response
  useEffect(() => {
    if (!response || Platform.OS === 'web') return;

    const handle = async () => {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setLoading(false);
        return;
      }
      if (response.type !== 'success') {
        setLoading(false);
        Alert.alert('Алдаа', 'Google-р нэвтрэхэд алдаа гарлаа.');
        return;
      }

      try {
        const accessToken = response.authentication?.accessToken;
        if (!accessToken) {
          throw new Error(
            'Google access token ирсэнгүй. OAuth client ID болон redirect тохиргоогоо шалгана уу.',
          );
        }
        const profile = await getGoogleProfile(accessToken);
        await onSuccessRef.current(profile);
      } catch (err: any) {
        Alert.alert(
          'Алдаа',
          err?.response?.data?.message || err?.message || 'Google-р нэвтрэхэд алдаа гарлаа.',
        );
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, [response]); // onSuccess intentionally excluded — use ref instead

  // ── Web (Firebase popup) ────────────────────────────────────────────────────
  const startWebAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result      = await signInWithPopup(firebaseAuth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) throw new Error('Google бүртгэлээс имэйл авах боломжгүй байна.');

      await onSuccessRef.current({
        name:       firebaseUser.displayName || firebaseUser.email,
        email:      firebaseUser.email,
        avatarUrl:  firebaseUser.photoURL ?? null,
        providerId: firebaseUser.uid,
      });
    } catch (err: any) {
      const code = err?.code ?? '';
      // User-initiated cancels are silent — no error alert needed
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      Alert.alert(
        'Алдаа',
        err?.response?.data?.message || err?.message || 'Google-р нэвтрэхэд алдаа гарлаа.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Native (expo-auth-session) ──────────────────────────────────────────────
  const startNativeAuth = async () => {
    if (!getNativeClientId()) {
      Alert.alert(
        'Google OAuth тохиргоо дутуу',
        `${Platform.OS === 'ios' ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID' : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'} болон EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID-г .env файлд тохируулна уу.`,
      );
      return;
    }
    if (!request) {
      Alert.alert('Google OAuth', 'Google нэвтрэлт ачаалж байна. Түр хүлээгээд дахин дарна уу.');
      return;
    }
    setLoading(true);
    // setLoading(false) is handled in the response useEffect
    await promptAsync();
  };

  // ── Public API ──────────────────────────────────────────────────────────────
  const startGoogleAuth = useCallback(() => {
    if (Platform.OS === 'web') return startWebAuth();
    return startNativeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, promptAsync]);

  return { startGoogleAuth, googleLoading: loading, googleRequest: request };
};