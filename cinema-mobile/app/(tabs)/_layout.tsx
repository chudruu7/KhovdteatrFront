// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated, Platform, Modal, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: {
  name: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
  label: string;
}[] = [
  { name: 'index',    icon: 'home-outline',      iconFocused: 'home',      label: 'Нүүр' },
  { name: 'schedule', icon: 'calendar-outline',  iconFocused: 'calendar',  label: 'Хуваарь' },
  { name: 'search',   icon: 'newspaper-outline', iconFocused: 'newspaper', label: 'Мэдээ' },
  { name: 'profile',  icon: 'person-outline',    iconFocused: 'person',    label: 'Профайл' },
];

const ONBOARDING_PENDING_KEY = 'kdt_onboarding_pending';
const ONBOARDING_SEEN_KEY = 'kdt_onboarding_seen';

function MobileOnboardingGuide({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (visible) setDontShowAgain(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.guideBackdrop}>
        <View style={styles.guideCard}>
          <Pressable onPress={() => onClose(dontShowAgain)} style={styles.guideClose} hitSlop={10}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          <Image source={require('../../assets/kdt.png')} style={styles.guideLogo} resizeMode="contain" />
          <Text style={styles.guideKicker}>Системтэй хурдан танилцъя</Text>
          <Text style={styles.guideTitle}>Тавтай морил</Text>
          <Text style={styles.guideIntro}>
            Шинэ хэрэглэгчид зориулсан товч заавар. Уншаад дууссан үедээ X дарж хааж болно.
          </Text>

          <View style={styles.guideList}>
            <View style={styles.guideItem}>
              <Ionicons name="home" size={18} color="#F5C842" />
              <Text style={styles.guideText}>Нүүр хэсгээс онцлох үзвэр болон тасалбар захиалах товчийг ашиглана.</Text>
            </View>
            <View style={styles.guideItem}>
              <Ionicons name="calendar" size={18} color="#F5C842" />
              <Text style={styles.guideText}>Хуваарь хэсгээс үзвэр гарах боломжтой өдөр, цагийг сонгоно.</Text>
            </View>
            <View style={styles.guideItem}>
              <Ionicons name="ticket" size={18} color="#F5C842" />
              <Text style={styles.guideText}>Миний тасалбар хэсэгт QR тасалбараа хадгалж, шалгуулна.</Text>
            </View>
            <View style={styles.guideItem}>
              <Ionicons name="person" size={18} color="#F5C842" />
              <Text style={styles.guideText}>Профайл хэсгээс бүртгэл, гарах үйлдэл болон хувийн мэдээллээ харна.</Text>
            </View>
          </View>

          <Pressable onPress={() => setDontShowAgain((value) => !value)} style={styles.guideCheckRow}>
            <View style={[styles.guideCheckbox, dontShowAgain && styles.guideCheckboxOn]}>
              {dontShowAgain && <Ionicons name="checkmark" size={16} color="#111217" />}
            </View>
            <Text style={styles.guideCheckText}>Дахиж харахгүй</Text>
          </Pressable>

          <Pressable onPress={() => onClose(dontShowAgain)} style={styles.guideButton}>
            <Text style={styles.guideButtonText}>Ойлголоо</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Animated Tab Icon ────────────────────────────────────────────────────────
function TabIcon({
  name,
  focused,
  colors,
  isLight,
  label,
}: {
  name: IoniconsName;
  focused: boolean;
  colors: ThemeColors;
  isLight: boolean;
  label: string;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0.9,
      useNativeDriver: true,
      tension: 80,
      friction: 7,
    }).start();
    
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={styles.iconWrap}>
      <Animated.View
        style={[
          styles.pillBg,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: isLight 
              ? 'rgba(197,168,128,0.16)'
              : 'rgba(197,168,128,0.18)',
            borderColor: isLight 
              ? 'rgba(197,168,128,0.34)'
              : 'rgba(197,168,128,0.4)',
          },
        ]}
      />
      <Ionicons 
        name={name} 
        size={21} 
        color={focused ? colors.gold : isLight ? 'rgba(23,25,35,0.45)' : 'rgba(255,255,255,0.35)'} 
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.gold : isLight ? 'rgba(23,25,35,0.52)' : 'rgba(255,255,255,0.42)' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { colors, isLight } = useTheme();
  const [showGuide, setShowGuide] = useState(false);

  const tabBarStyle = useMemo(
    () => createTabBarStyle(colors, isLight),
    [colors, isLight]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const [pending, seen] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_PENDING_KEY),
        AsyncStorage.getItem(ONBOARDING_SEEN_KEY),
      ]);
      if (alive) setShowGuide(pending === '1' && seen !== '1');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const closeGuide = async (dontShowAgain: boolean) => {
    setShowGuide(false);
    if (dontShowAgain) {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
      await AsyncStorage.removeItem(ONBOARDING_PENDING_KEY);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarShowLabel: false,
          animation: 'shift',
          sceneStyle: { backgroundColor: colors.bg },
          // ЗАСВАР: Элементүүдийг бүтэн өргөнөөр нь жигд хуваарилж голлуулна
          tabBarItemStyle: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          },
          tabBarIconStyle: {
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        {TABS.map(({ name, icon, iconFocused, label }) => (
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
                  label={label}
                />
              ),
            }}
          />
        ))}
      </Tabs>
      <MobileOnboardingGuide visible={showGuide} onClose={closeGuide} />
    </>
  );
}

// ─── Dynamic tab bar style ───────────────────────────────────────────────────
function createTabBarStyle(colors: ThemeColors, isLight: boolean) {
  return {
    position: 'absolute' as const,
    bottom: Platform.OS === 'ios' ? 26 : 18,
    left: 20,
    right: 20,
    borderRadius: 32, 
    height: 74,
    
    // ЗАСВАР: Дотоод flex бүтцийг зөв голлуулах тохиргоо
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 0, // Хазайлтыг арилгахын тулд 0 болгов

    backgroundColor: isLight
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(18,19,26,0.96)',

    borderWidth: 1,
    borderColor: isLight
      ? 'rgba(0,0,0,0.05)'
      : 'rgba(255,255,255,0.05)',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isLight ? 0.08 : 0.4,
    shadowRadius: 24,
    elevation: 16,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  guideBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  guideCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 28,
    backgroundColor: '#10131E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 24,
  },
  guideClose: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  guideLogo: { width: 58, height: 58, marginBottom: 14 },
  guideKicker: { color: '#F5C842', fontSize: 13, fontWeight: '900', marginBottom: 7 },
  guideTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  guideIntro: { color: '#C8CCD7', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  guideList: { gap: 13 },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 13,
  },
  guideText: { flex: 1, color: '#E7EAF0', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  guideCheckRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCheckboxOn: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  guideCheckText: { color: '#D9DDE7', fontSize: 13, fontWeight: '800' },
  guideButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideButtonText: { color: '#111217', fontSize: 15, fontWeight: '900' },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    gap: 3,
  },
  pillBg: {
    position: 'absolute',
    top: 5,
    width: 42,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: 1,
  },
});
