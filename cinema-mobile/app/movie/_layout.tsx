import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function MovieLayout() {
  return (
    <Stack screenOptions={{
      headerShown:  false,
      contentStyle: { backgroundColor: COLORS.bg },
      animation:    'slide_from_bottom',
    }} />
  );
}
