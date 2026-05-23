import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

function AuthGuard() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    if (user  &&  inAuth) router.replace('/(tabs)');
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }
  return null;
}

function AppStack() {
  const { colors, isLight } = useTheme();

  return (
    <>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <AuthGuard />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="(auth)"  />
        <Stack.Screen name="(tabs)"  />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="movie" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

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
