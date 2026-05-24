// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useMemo } from 'react';
import { COLORS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: {
  name: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}[] = [
  { name: 'index',    icon: 'home-outline',          iconFocused: 'home'          },
  { name: 'schedule', icon: 'calendar-outline',      iconFocused: 'calendar'      }, // ✦ өөрчлөгдсөн
  { name: 'search',   icon: 'newspaper-outline',     iconFocused: 'newspaper'     },
  { name: 'profile',  icon: 'person-outline',        iconFocused: 'person'        },
];

// ─── Animated Tab Icon ────────────────────────────────────────────────────────
function TabIcon({
  name,
  focused,
  colors,
  isLight,
}: {
  name: IoniconsName;
  focused: boolean;
  colors: ThemeColors;
  isLight: boolean;
}) {
  const dotAnim  = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const iconAnim = useRef(new Animated.Value(focused ? 1 : 0.88)).current;
  const pillAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const toValue = focused ? 1 : 0;
    Animated.parallel([
      Animated.spring(dotAnim, {
        toValue,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.spring(iconAnim, {
        toValue: focused ? 1 : 0.88,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(pillAnim, {
        toValue,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const iconColor = focused
    ? colors.teal
    : isLight ? 'rgba(23,25,35,0.4)' : 'rgba(255,255,255,0.3)';

  return (
    <View style={styles.iconWrap}>
      {/* Pill highlight */}
      <Animated.View
        style={[
          styles.pillBg,
          {
            opacity: pillAnim,
            backgroundColor: isLight
              ? 'rgba(20,184,166,0.12)'
              : 'rgba(20,184,166,0.14)',
          },
        ]}
      />

      {/* Icon */}
      <Animated.View style={[styles.iconCenter, { transform: [{ scale: iconAnim }] }]}>
        <Ionicons name={name} size={22} color={iconColor} />
      </Animated.View>

      {/* Dot indicator */}
      <Animated.View
        style={[
          styles.navDot,
          {
            backgroundColor: colors.teal,
            transform: [{ scale: dotAnim }],
            opacity: dotAnim,
          },
        ]}
      />
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { colors, isLight } = useTheme();

  const tabBarStyle = useMemo(
    () => createTabBarStyle(colors, isLight),
    [colors, isLight]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.bg },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 68,
          paddingVertical: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 15,
          marginBottom: 0,
        },
      }}
    >
      {TABS.map(({ name, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? iconFocused : icon}
                focused={focused}
                colors={colors}
                isLight={isLight}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// ─── Dynamic tab bar style ───────────────────────────────────────────────────
function createTabBarStyle(colors: ThemeColors, isLight: boolean) {
  return {
    position: 'absolute' as const,
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 24,
    right: 24,
    borderRadius: 26,
    height: 68,
    paddingBottom: 0,
    paddingTop: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,

    backgroundColor: isLight
      ? 'rgba(255,255,255,0.92)'
      : 'rgba(16,17,22,0.94)',

    borderWidth: 1,
    borderColor: isLight
      ? 'rgba(0,0,0,0.06)'
      : 'rgba(255,255,255,0.06)',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isLight ? 0.10 : 0.45,
    shadowRadius: 20,
    elevation: 16,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 68,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBg: {
    position: 'absolute',
    width: 46,
    height: 36,
    borderRadius: 12,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
  },
});
