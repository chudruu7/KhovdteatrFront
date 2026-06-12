import { useEffect, useRef } from 'react';
import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, Text, TextInput } from 'react-native';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';

function applyMontserratDefaults() {
  const montserratStyle = { fontFamily: 'Montserrat_400Regular' };
  const textDefaults = (Text as any).defaultProps || {};
  const inputDefaults = (TextInput as any).defaultProps || {};

  (Text as any).defaultProps = {
    ...textDefaults,
    style: [textDefaults.style, montserratStyle],
  };

  (TextInput as any).defaultProps = {
    ...inputDefaults,
    style: [inputDefaults.style, montserratStyle],
  };
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function AuthGuard() {
  const { user, loading } = useAuth();
  const router            = useRouter();
  const segments          = useSegments();
  const params            = useGlobalSearchParams<{ redirect?: string; station?: string; scan?: string }>();

  // Prevent only identical repeated redirects; auth state changes must navigate.
  const lastRedirectKey = useRef('');

  useEffect(() => {
    if (loading) {
      lastRedirectKey.current = '';
      return;
    }

    const inAuth = segments[0] === '(auth)';
    const redirectTarget = params.redirect || (
      params.station && params.scan === '1'
        ? `/cashier?station=${encodeURIComponent(params.station)}&scan=${encodeURIComponent(params.scan)}`
        : ''
    );
    const redirectKey = `${user ? 'user' : 'guest'}:${inAuth ? 'auth' : 'app'}:${redirectTarget}`;

    if (lastRedirectKey.current === redirectKey) return;

    if (!user && !inAuth) {
      lastRedirectKey.current = redirectKey;
      router.replace(redirectTarget
        ? { pathname: '/(auth)/login', params: { redirect: redirectTarget } }
        : '/(auth)/login'
      );
    } else if (user?.role === 'cashier' && segments[0] !== 'cashier') {
      lastRedirectKey.current = redirectKey;
      router.replace((redirectTarget || '/cashier') as any);
    } else if (user && inAuth) {
      lastRedirectKey.current = redirectKey;
      router.replace((redirectTarget || (user.role === 'cashier' ? '/cashier' : '/(tabs)')) as any);
    } else {
      lastRedirectKey.current = '';
    }
  }, [user, loading, segments, params.redirect, params.station, params.scan]);

  return null;
}

// ── App stack ─────────────────────────────────────────────────────────────────
function AppStack() {
  const { colors, isLight } = useTheme();
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={{ marginTop: 12, color: colors.textSub, fontSize: 13, fontWeight: '700' }}>
          Түр хүлээнэ үү...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <AuthGuard />
      <Stack
        screenOptions={{
          headerShown:              false,
          contentStyle:             { backgroundColor: colors.bg },
          animation:                'ios_from_right',
          animationDuration:        260,
          fullScreenGestureEnabled: true,
          gestureEnabled:           true,
        }}
      >
        <Stack.Screen name="(auth)"   options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)"   options={{ gestureEnabled: false }} />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="cashier" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="movie"    options={{ animation: 'slide_from_bottom', animationDuration: 280 }} />
      </Stack>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyMontserratDefaults();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#0a0a14', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#e11d48" size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AppStack />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
