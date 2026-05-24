// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const BG = '#0A0A0E';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        // iOS: cinematic fade+scale, Android: slide
        animation: Platform.OS === 'ios' ? 'fade_from_bottom' : 'slide_from_right',
        animationDuration: 320,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    >
      {/* Login — fade in (entry point, no "back" feel) */}
      <Stack.Screen
        name="login"
        options={{
          animation: 'fade',
          animationDuration: 400,
          gestureEnabled: false,   // login is root — swipe-back хэрэггүй
        }}
      />

      {/* Register — slides in from right, swipe-back works */}
      <Stack.Screen
        name="register"
        options={{
          animation: Platform.OS === 'ios' ? 'fade_from_bottom' : 'slide_from_right',
          animationDuration: 320,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
  );
}