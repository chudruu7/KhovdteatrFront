import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  route?: string;
}

const DEFAULT_AVATAR = 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740&q=80';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isLight, toggleTheme } = useTheme();
  const router = useRouter();
  const styles = createStyles(colors, isLight);
  const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR;

  const doLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Системээс гарах уу?');
      if (confirmed) void doLogout();
      return;
    }

    Alert.alert('Гарах', 'Системээс гарах уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      {
        text: 'Гарах',
        style: 'destructive',
        onPress: () => void doLogout(),
      },
    ]);
  };

  // Үндсэн цэсүүдийг утгаар нь ангилав
  const primaryMenu: MenuItem[] = [
    { icon: 'receipt-outline', label: 'Захиалгын түүх', route: '/bookings' },
    { icon: 'ticket-outline', label: 'Миний тасалбарууд', route: '/bookings' },
  ];

  const appMenu: MenuItem[] = [
    { icon: isLight ? 'sunny-outline' : 'moon-outline', label: isLight ? 'Гэгээлэг горим' : 'Харанхуй горим' },
    { icon: 'notifications-outline', label: 'Мэдэгдэл' },
    { icon: 'call-outline', label: 'Холбоо барих' },
    { icon: 'information-circle-outline', label: 'Системийн тухай' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        
        {/* CINEMATIC PROFILE HERO */}
        <LinearGradient 
          colors={isLight ? ['#F5F5F7', colors.bg] : ['#161622', colors.bg]} 
          style={styles.headerGrad}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              <View style={styles.onlineBadge} />
            </View>
            
            <Text style={styles.name}>{user?.name || 'Зочин хэрэглэгч'}</Text>
            <Text style={styles.email}>{user?.email || 'Мэдээлэл оруулаагүй'}</Text>

            {user?.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="phone-portrait-outline" size={12} color={colors.textDim} />
                <Text style={styles.phone}>{user.phone}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* SECTION 1: ТАСАЛБАР БА ЗАХИАЛГА */}
        <Text style={styles.sectionTitle}>Миний үйлчилгээ</Text>
        <View style={styles.menuGroup}>
          {primaryMenu.map((item, i) => (
            <TouchableOpacity
              key={`${item.label}-${i}`}
              style={[styles.menuItem, i === primaryMenu.length - 1 && styles.menuItemLast]}
              activeOpacity={0.8}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={colors.teal} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SECTION 2: ТОХИРГОО БА ТУСЛАМЖ */}
        <Text style={styles.sectionTitle}>Ерөнхий тохиргоо</Text>
        <View style={styles.menuGroup}>
          {appMenu.map((item, i) => (
            <TouchableOpacity
              key={`${item.label}-${i}`}
              style={[styles.menuItem, i === appMenu.length - 1 && styles.menuItemLast]}
              activeOpacity={0.8}
              onPress={() => item.label.includes('горим') ? toggleTheme() : item.route && router.push(item.route as any)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconWrap, item.label.includes('горим') && styles.themeIconWrap]}>
                  <Ionicons name={item.icon} size={18} color={item.label.includes('горим') ? '#E5A93C' : colors.teal} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              {item.label.includes('горим') ? (
                <View style={styles.toggleIndicator}>
                  <Text style={styles.toggleText}>{isLight ? 'Асаалттай' : 'Идэвхтэй'}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={colors.coral} />
          <Text style={styles.logoutText}>Системээс гарах</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.1.0 Premium · Ховд аймгийн Хөгжимт Драмын Театр</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof COLORS, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  
  // Hero Luxury Profile Card
  headerGrad: { 
    alignItems: 'center', 
    paddingTop: 70, 
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg 
  },
  profileCard: {
    width: '100%',
    backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: isLight ? 0.05 : 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarImage: { 
    width: 90, 
    height: 90, 
    borderRadius: 45,
    borderWidth: 2,
    borderColor: isLight ? '#FFF' : 'rgba(255,255,255,0.15)',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: isLight ? '#FFF' : '#161622',
  },
  name: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: isLight ? '#111' : '#FFF', 
    marginBottom: 4,
    letterSpacing: -0.3
  },
  email: { 
    color: colors.textSub, 
    fontSize: 13,
    fontWeight: '500'
  },
  phoneRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: SPACING.sm,
    backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  phone: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  
  // Section Titles
  sectionTitle: {
    color: isLight ? '#444' : 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm
  },

  // Premium Grouped Cards
  menuGroup: {
    marginHorizontal: SPACING.lg,
    backgroundColor: isLight ? '#FFF' : 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: isLight ? '#F0F0F2' : 'rgba(255,255,255,0.04)',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1, paddingRight: 12 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: isLight ? 'rgba(0,128,128,0.06)' : 'rgba(0,128,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconWrap: {
    backgroundColor: isLight ? 'rgba(229,169,60,0.08)' : 'rgba(229,169,60,0.15)',
  },
  menuLabel: { color: isLight ? '#1A1A1A' : '#ECECEC', fontSize: 15, fontWeight: '500', flexShrink: 1 },
  
  toggleIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: isLight ? '#F0F0F2' : 'rgba(255,255,255,0.06)',
    borderRadius: 8
  },
  toggleText: { color: colors.textSub, fontSize: 11, fontWeight: '600' },

  // Minimal Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: isLight ? 'rgba(217,79,104,0.05)' : 'rgba(217,79,104,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isLight ? 'rgba(217,79,104,0.15)' : 'rgba(217,79,104,0.12)',
  },
  logoutText: { color: colors.coral, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textSub, fontSize: 12, marginTop: SPACING.md, marginBottom: SPACING.xl },
});