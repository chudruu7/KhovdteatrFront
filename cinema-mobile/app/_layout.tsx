import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

// ── Auth guard ────────────────────────────────────────────────────────────────
function AuthGuard() {
  const { user, loading } = useAuth();
  const { colors }        = useTheme();
  const router            = useRouter();
  const segments          = useSegments();

  // Prevent only identical repeated redirects; auth state changes must navigate.
  const lastRedirectKey = useRef('');

  useEffect(() => {
    if (loading) {
      lastRedirectKey.current = '';
      return;
    }

    const inAuth = segments[0] === '(auth)';
    const redirectKey = `${user ? 'user' : 'guest'}:${inAuth ? 'auth' : 'app'}`;

    if (lastRedirectKey.current === redirectKey) return;

    if (!user && !inAuth) {
      lastRedirectKey.current = redirectKey;
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      lastRedirectKey.current = redirectKey;
      router.replace('/(tabs)');
    } else {
      lastRedirectKey.current = '';
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }

  return null;
}

// ── App stack ─────────────────────────────────────────────────────────────────
function AppStack() {
  const { colors, isLight } = useTheme();

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
