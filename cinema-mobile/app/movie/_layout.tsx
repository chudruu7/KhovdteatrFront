import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function MovieLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown:  false,
        contentStyle: { backgroundColor: colors.bg },
        animation:    'slide_from_right',
      }}
    >
      {/* Detail screen slides in from the right (default) */}
      <Stack.Screen name="[id]" />

      {/* Booking flow screens slide up from the bottom */}
      <Stack.Screen name="booking/date"     options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="booking/seats"    options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="booking/checkout" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="booking/ticket"   options={{ animation: 'fade' }} />
    </Stack>
  );
}
