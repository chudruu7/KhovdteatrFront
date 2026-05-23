import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
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

  const handleLogout = () => {
    Alert.alert('Гарах', 'Системээс гарах уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'receipt-outline', label: 'Захиалгын түүх', route: '/bookings' },
    { icon: 'ticket-outline', label: 'Миний тасалбарууд', route: '/bookings' },
    { icon: isLight ? 'sunny-outline' : 'moon-outline', label: isLight ? 'Light mode асаалттай' : 'Dark mode асаалттай' },
    { icon: 'notifications-outline', label: 'Мэдэгдэл' },
    { icon: 'call-outline', label: 'Холбоо барих' },
    { icon: 'information-circle-outline', label: 'Системийн тухай' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={isLight ? ['#ffffff', colors.bg] : ['#13131a', colors.bg]} style={styles.headerGrad}>
          <View style={styles.avatar}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          </View>
          <Text style={styles.name}>{user?.name || 'Зочин'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={13} color={colors.textDim} />
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={`${item.label}-${i}`}
              style={[styles.menuItem, i === menuItems.length - 1 && styles.menuItemLast]}
              activeOpacity={0.7}
              onPress={() => item.label.includes('mode') ? toggleTheme() : item.route && router.push(item.route as any)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={colors.teal} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name={item.label.includes('mode') ? 'swap-horizontal-outline' : 'chevron-forward'} size={18} color={colors.textSub} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
          <Text style={styles.logoutText}>Системээс гарах</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 · Ховд аймгийн Хөгжимт Драмын Театр</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof COLORS, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGrad: { alignItems: 'center', paddingTop: 80, paddingBottom: SPACING.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  email: { color: colors.textSub, fontSize: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phone: { color: colors.textDim, fontSize: 13 },
  menu: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { color: colors.white, fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: colors.coralDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isLight ? 'rgba(217,79,104,0.25)' : 'rgba(232,96,122,0.2)',
  },
  logoutText: { color: colors.coral, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textSub, fontSize: 12, marginBottom: SPACING.xl },
});
