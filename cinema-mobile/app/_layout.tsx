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

  // Prevent rapid repeated navigation calls on quick re-renders
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading) {
      didRedirect.current = false;   // reset so next stable state redirects
      return;
    }
    if (didRedirect.current) return;

    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      didRedirect.current = true;
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      didRedirect.current = true;
      router.replace('/(tabs)');
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
