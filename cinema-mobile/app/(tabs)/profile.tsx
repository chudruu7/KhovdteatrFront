// app/(tabs)/profile.tsx
import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, Platform, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const { width: W } = Dimensions.get('window');

const DEFAULT_AVATAR =
  'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?w=740&q=80';

// ─── Animated Menu Item ───────────────────────────────────────────────────────
function MenuItem({
  icon, label, route, onPress, isLast,
  iconColor, iconBg, rightElement, delay = 0,
  colors, isLight,
}: {
  icon: IoniconsName;
  label: string;
  route?: string;
  onPress?: () => void;
  isLast?: boolean;
  iconColor: string;
  iconBg: string;
  rightElement?: React.ReactNode;
  delay?: number;
  colors: ThemeColors;
  isLight: boolean;
}) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterAnim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const router = useRouter();
  const handlePress = () => {
    if (onPress) { onPress(); return; }
    if (route) router.push(route as any);
  };

  return (
    <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.menuItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: isLight ? '#F0F0F2' : 'rgba(255,255,255,0.04)' },
        ]}
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.menuLeft}>
          <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={17} color={iconColor} />
          </View>
          <Text style={[styles.menuLabel, { color: isLight ? '#1A1A1A' : '#ECECEC' }]}>{label}</Text>
        </View>
        {rightElement ?? (
          <Ionicons name="chevron-forward" size={15} color={colors.textSub} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section group wrapper ────────────────────────────────────────────────────
function MenuGroup({ title, children, colors, isLight }: {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
  isLight: boolean;
}) {
  return (
    <>
      <Text style={[styles.sectionTitle, { color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }]}>
        {title}
      </Text>
      <View style={[
        styles.menuGroup,
        {
          backgroundColor: isLight ? '#FFF' : 'rgba(255,255,255,0.025)',
          borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        },
      ]}>
        {children}
      </View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout }           = useAuth();
  const { colors, isLight, toggleTheme } = useTheme();
  const router                     = useRouter();
  const avatarUrl                  = user?.avatarUrl || DEFAULT_AVATAR;

  // Entrance animations
  const heroAnim    = useRef(new Animated.Value(0)).current;
  const heroSlide   = useRef(new Animated.Value(-20)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;
  const avatarGlow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(heroAnim,  { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
      Animated.spring(avatarScale, {
        toValue: 1, useNativeDriver: true, tension: 55, friction: 7,
      }),
      Animated.timing(avatarGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Logout ──
  const doLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Системээс гарах уу?')) void doLogout();
      return;
    }
    Alert.alert('Гарах', 'Системээс гарах уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => void doLogout() },
    ]);
  };

  // ── Shared icon props helpers ──
  const tealBg   = isLight ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.12)';
  const goldBg   = isLight ? 'rgba(229,169,60,0.08)'  : 'rgba(229,169,60,0.14)';
  const coralBg  = isLight ? 'rgba(217,79,104,0.07)'  : 'rgba(217,79,104,0.12)';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── CINEMATIC HERO ── */}
        <LinearGradient
          colors={isLight ? ['#F2F2F7', colors.bg] : ['#13141C', colors.bg]}
          style={styles.heroGrad}
        >
          <Animated.View style={[
            styles.profileCard,
            {
              backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.025)',
              borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
              opacity: heroAnim,
              transform: [{ translateY: heroSlide }],
            },
          ]}>
            {/* Avatar with spring entrance + glow ring */}
            <View style={styles.avatarOuter}>
              <Animated.View style={[
                styles.glowRing,
                { opacity: avatarGlow, borderColor: isLight ? 'rgba(20,184,166,0.3)' : 'rgba(20,184,166,0.25)' }
              ]} />
              <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              </Animated.View>
              <View style={[
                styles.onlineBadge,
                { borderColor: isLight ? '#FFF' : '#13141C' },
              ]} />
            </View>

            <Text style={[styles.name, { color: isLight ? '#111' : '#FFF' }]}>
              {user?.name || 'Зочин хэрэглэгч'}
            </Text>
            <Text style={[styles.email, { color: colors.textSub }]}>
              {user?.email || 'Мэдээлэл оруулаагүй'}
            </Text>

            {user?.phone && (
              <View style={[
                styles.phoneChip,
                { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' },
              ]}>
                <Ionicons name="call-outline" size={11} color={colors.teal} />
                <Text style={[styles.phoneText, { color: colors.textDim }]}>{user.phone}</Text>
              </View>
            )}

            {/* Decorative gold line */}
            {/* <View style={styles.goldLine} />
            <Text style={styles.memberBadge}>ГИШҮҮН ХЭРЭГЛЭГЧ</Text> */}
          </Animated.View>
        </LinearGradient>

        {/* ── SECTION: Миний үйлчилгээ ── */}
        <MenuGroup title="Миний үйлчилгээ" colors={colors} isLight={isLight}>
          <MenuItem
            icon="receipt-outline"
            label="Захиалгын түүх"
            route="/bookings?mode=history"
            iconColor={colors.teal}
            iconBg={tealBg}
            delay={200}
            colors={colors}
            isLight={isLight}
          />
          <MenuItem
            icon="ticket-outline"
            label="Миний тасалбарууд"
            route="/bookings?mode=tickets"
            iconColor={colors.teal}
            iconBg={tealBg}
            delay={260}
            isLast
            colors={colors}
            isLight={isLight}
          />
        </MenuGroup>

        {/* ── SECTION: Тохиргоо ── */}
        <MenuGroup title="Ерөнхий тохиргоо" colors={colors} isLight={isLight}>
          <MenuItem
            icon={isLight ? 'sunny-outline' : 'moon-outline'}
            label={isLight ? 'Light mode' : 'Dark mode'}
            iconColor="#E5A93C"
            iconBg={goldBg}
            delay={340}
            colors={colors}
            isLight={isLight}
            onPress={toggleTheme}
            rightElement={
              <View style={[
                styles.themeToggle,
                { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)' },
              ]}>
                <Text style={[styles.themeToggleText, { color: colors.textSub }]}>
                  {isLight ? 'Light' : 'Dark'}
                </Text>
              </View>
            }
          />
          <MenuItem
            icon="notifications-outline"
            label="Мэдэгдэл"
            route="/notifications"
            iconColor={colors.teal}
            iconBg={tealBg}
            delay={400}
            colors={colors}
            isLight={isLight}
          />
          <MenuItem
            icon="call-outline"
            label="Холбоо барих"
            route="/contact"
            iconColor={colors.teal}
            iconBg={tealBg}
            delay={460}
            colors={colors}
            isLight={isLight}
          />
          <MenuItem
            icon="information-circle-outline"
            label="Системийн тухай"
            iconColor={colors.teal}
            iconBg={tealBg}
            delay={520}
            isLast
            colors={colors}
            isLight={isLight}
          />
        </MenuGroup>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { 
              backgroundColor: isLight ? 'rgba(217,79,104,0.05)' : 'rgba(217,79,104,0.08)',
              borderColor: isLight ? 'rgba(217,79,104,0.15)' : 'rgba(217,79,104,0.12)',
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
          <Text style={[styles.logoutText, { color: colors.coral }]}>Гарах</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSub }]}>
          v1.1.0 · Ховд аймгийн Хөгжимт Драмын Театр
        </Text>

        {/* Bottom spacing for floating tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Hero ──
  heroGrad: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: SPACING.lg,
    paddingHorizontal: 20,
  },
  profileCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },

  // Avatar
  avatarOuter: {
    position: 'relative',
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1.5,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
  },

  // User info
  name: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16,
  },
  phoneText: { fontSize: 12, fontWeight: '600' },

  goldLine: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(197,168,128,0.5)',
    marginBottom: 8,
  },
  memberBadge: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: '#C5A880',
  },

  // ── Menu ──
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  menuGroup: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, fontWeight: '500', flexShrink: 1 },

  themeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeToggleText: { fontSize: 11, fontWeight: '700' },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  logoutText: { fontWeight: '700', fontSize: 15 },

  version: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 14,
    fontWeight: '500',
  },
});
