import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { bookingAPI } from '../api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { safeBack } from '../utils/navigation';

type BookingItem = {
  id?: string;
  _id?: string;
  title?: string;
  movieTitle?: string;
  date?: string;
  time?: string;
  hall?: string;
  status?: string;
  paymentStatus?: string;
  totalPrice?: number;
  seats?: string[];
  createdAt?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: 'ticket' | 'payment' | 'reminder' | 'system';
  createdAt: string;
  read: boolean;
  bookingId?: string;
};

type NotificationPrefs = {
  enabled: boolean;
  ticketUpdates: boolean;
  paymentUpdates: boolean;
  showtimeReminders: boolean;
  promos: boolean;
};

const PREFS_KEY = 'notification-prefs';
const READ_KEY = 'notification-read-ids';

const defaultPrefs: NotificationPrefs = {
  enabled: true,
  ticketUpdates: true,
  paymentUpdates: true,
  showtimeReminders: true,
  promos: false,
};

const getBookingId = (booking: BookingItem, fallback: string) => booking.id || booking._id || fallback;
const getTitle = (booking: BookingItem) => booking.title || booking.movieTitle || 'Тодорхойгүй үзвэр';
const money = (value?: number) => `${Number(value || 0).toLocaleString('mn-MN')}₮`;

const createNotifications = (bookings: BookingItem[], readIds: string[], prefs: NotificationPrefs): NotificationItem[] => {
  const items: NotificationItem[] = [];
  const read = new Set(readIds);

  bookings.forEach((booking, index) => {
    const bookingId = getBookingId(booking, `${index}`);
    const title = getTitle(booking);
    const show = `${booking.date || '—'} · ${booking.time || '—'}`;

    if (prefs.ticketUpdates) {
      const id = `ticket-${bookingId}`;
      items.push({
        id,
        bookingId,
        type: 'ticket',
        title: 'Тасалбар бэлэн боллоо',
        body: `${title} · ${show} · ${booking.seats?.join(', ') || 'суудал сонгосон'}`,
        createdAt: String(booking.date || booking.createdAt || ''),
        read: read.has(id),
      });
    }

    if (prefs.paymentUpdates) {
      const paid = booking.paymentStatus === 'paid';
      const id = `payment-${bookingId}`;
      items.push({
        id,
        bookingId,
        type: 'payment',
        title: paid ? 'Төлбөр баталгаажлаа' : 'Төлбөр хүлээгдэж байна',
        body: `${title} · ${money(booking.totalPrice)} · ${paid ? 'QPay төлбөр амжилттай' : 'QPay төлбөрөө шалгана уу'}`,
        createdAt: String(booking.date || booking.createdAt || ''),
        read: read.has(id),
      });
    }

    if (prefs.showtimeReminders && booking.status === 'active') {
      const id = `reminder-${bookingId}`;
      items.push({
        id,
        bookingId,
        type: 'reminder',
        title: 'Үзвэрийн сануулга',
        body: `${title} · ${show} · ${booking.hall || 'танхим'}`,
        createdAt: String(booking.date || booking.createdAt || ''),
        read: read.has(id),
      });
    }
  });

  if (!items.length) {
    const id = 'system-empty';
    items.push({
      id,
      type: 'system',
      title: 'Мэдэгдэл алга',
      body: 'Шинэ захиалга, төлбөр болон үзвэрийн сануулга энд харагдана.',
      createdAt: '',
      read: read.has(id),
    });
  }

  return items;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isLight } = useTheme();
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);

  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const notifications = useMemo(
    () => prefs.enabled ? createNotifications(bookings, readIds, prefs) : [],
    [bookings, readIds, prefs]
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [savedPrefs, savedReadIds, bookingData] = await Promise.all([
          AsyncStorage.getItem(PREFS_KEY),
          AsyncStorage.getItem(READ_KEY),
          bookingAPI.getMine(),
        ]);

        if (!mounted) return;
        const nextPrefs = savedPrefs ? { ...defaultPrefs, ...JSON.parse(savedPrefs) } : defaultPrefs;
        const nextReadIds = savedReadIds ? JSON.parse(savedReadIds) : [];
        const list = Array.isArray(bookingData)
          ? bookingData
          : bookingData.bookings ?? bookingData.data ?? [];

        setPrefs(nextPrefs);
        setReadIds(nextReadIds);
        setBookings(list);
        setError('');
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Мэдэгдэл татахад алдаа гарлаа.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const savePrefs = async (next: NotificationPrefs) => {
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const saveReadIds = async (next: string[]) => {
    setReadIds(next);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(next));
  };

  const markRead = async (item: NotificationItem) => {
    if (!readIds.includes(item.id)) await saveReadIds([...readIds, item.id]);
    if (item.bookingId && item.type !== 'system') router.push('/bookings?mode=tickets' as any);
  };

  const markAllRead = async () => {
    await saveReadIds(Array.from(new Set([...readIds, ...notifications.map((item) => item.id)])));
  };

  const clearReadState = () => {
    Alert.alert('Мэдэгдэл', 'Уншсан төлөвийг цэвэрлэх үү?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Цэвэрлэх', style: 'destructive', onPress: () => void saveReadIds([]) },
    ]);
  };

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    void savePrefs({ ...prefs, [key]: value });
  };

  const iconFor = (type: NotificationItem['type']) => {
    if (type === 'payment') return 'card-outline';
    if (type === 'reminder') return 'time-outline';
    if (type === 'system') return 'information-circle-outline';
    return 'ticket-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => safeBack(router)} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Мэдэгдэл</Text>
          <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} шинэ` : 'Бүгд уншсан'}</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={markAllRead} disabled={!notifications.length}>
          <Ionicons name="checkmark-done" size={20} color={colors.teal} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.coral} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <View style={styles.summaryIcon}>
              <Ionicons name="notifications-outline" size={24} color={colors.teal} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>{prefs.enabled ? 'Идэвхтэй' : 'Идэвхгүй'}</Text>
              <Text style={styles.summarySub}>{notifications.length} мэдэгдэл</Text>
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={(value) => toggle('enabled', value)}
              trackColor={{ false: colors.border2, true: colors.tealDim }}
              thumbColor={prefs.enabled ? colors.teal : colors.textSub}
            />
          </View>

          <Text style={styles.sectionTitle}>Ирсэн мэдэгдэл</Text>
          <View style={styles.list}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notification, item.read && styles.notificationRead]}
                onPress={() => markRead(item)}
                activeOpacity={0.82}
              >
                <View style={[styles.notificationIcon, !item.read && styles.notificationIconUnread]}>
                  <Ionicons name={iconFor(item.type)} size={19} color={colors.teal} />
                </View>
                <View style={styles.notificationBody}>
                  <View style={styles.notificationTop}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationText} numberOfLines={2}>{item.body}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Тохиргоо</Text>
          <View style={styles.settings}>
            {[
              ['ticketUpdates', 'Тасалбарын мэдэгдэл', 'ticket-outline'],
              ['paymentUpdates', 'Төлбөрийн мэдэгдэл', 'card-outline'],
              ['showtimeReminders', 'Үзвэрийн сануулга', 'time-outline'],
              ['promos', 'Урамшуулал', 'gift-outline'],
            ].map(([key, label, icon]) => (
              <View key={key} style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name={icon as any} size={17} color={colors.teal} />
                  </View>
                  <Text style={styles.settingLabel}>{label}</Text>
                </View>
                <Switch
                  value={Boolean(prefs[key as keyof NotificationPrefs])}
                  disabled={!prefs.enabled}
                  onValueChange={(value) => toggle(key as keyof NotificationPrefs, value)}
                  trackColor={{ false: colors.border2, true: colors.tealDim }}
                  thumbColor={prefs[key as keyof NotificationPrefs] ? colors.teal : colors.textSub}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clearReadState} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={17} color={colors.coral} />
            <Text style={styles.clearText}>Уншсан төлөв цэвэрлэх</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: typeof COLORS, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 58,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitleWrap: { alignItems: 'center' },
  title: { color: colors.white, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.textSub, fontSize: 11, fontWeight: '700', marginTop: 2 },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  errorText: { color: colors.textDim, textAlign: 'center', fontWeight: '700' },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  summary: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
  summaryTitle: { color: colors.white, fontSize: 16, fontWeight: '900' },
  summarySub: { color: colors.textSub, fontSize: 12, marginTop: 3 },
  sectionTitle: {
    color: isLight ? '#8A8F9A' : 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  list: { gap: SPACING.sm },
  notification: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border2,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  notificationRead: { opacity: 0.68, borderColor: colors.border },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: isLight ? 'rgba(15,159,143,0.08)' : 'rgba(29,233,182,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationIconUnread: { backgroundColor: colors.tealDim },
  notificationBody: { flex: 1, minWidth: 0 },
  notificationTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notificationTitle: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '900' },
  notificationText: { color: colors.textSub, fontSize: 12, lineHeight: 17, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  settings: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { color: colors.text, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  clearButton: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.coralDim,
    backgroundColor: colors.coralDim,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  clearText: { color: colors.coral, fontSize: 14, fontWeight: '900' },
});
