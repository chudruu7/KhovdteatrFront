import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI } from '../api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

type BookingItem = {
  id?: string;
  _id?: string;
  title?: string;
  movieTitle?: string;
  date?: string;
  time?: string;
  hall?: string;
  seats?: string[];
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
};

const statusLabel: Record<string, string> = {
  active: 'Идэвхтэй',
  used: 'Ашигласан',
  cancelled: 'Цуцлагдсан',
  expired: 'Хугацаа дууссан',
};

export default function BookingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    bookingAPI.getMine()
      .then((data) => {
        if (!mounted) return;
        setBookings(data.bookings || data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Захиалгын түүх татахад алдаа гарлаа.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Захиалгын түүх</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.coral} />
          <Text style={styles.emptyTitle}>{error}</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="ticket-outline" size={42} color={colors.textSub} />
          <Text style={styles.emptyTitle}>Одоогоор захиалга байхгүй байна</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {bookings.map((booking, index) => {
            const title = booking.title || booking.movieTitle || 'Тодорхойгүй кино';
            const id = booking.id || booking._id || `${title}-${index}`;
            const seats = booking.seats?.join(', ') || '-';

            return (
              <View key={id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.movieIcon}>
                    <Ionicons name="film-outline" size={22} color={colors.teal} />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.movieTitle} numberOfLines={2}>{title}</Text>
                    <Text style={styles.meta}>{booking.date || '-'} · {booking.time || '-'}</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{statusLabel[booking.status || ''] || booking.status || 'Төлөв'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Танхим</Text>
                  <Text style={styles.detailValue}>{booking.hall || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Суудал</Text>
                  <Text style={styles.detailValue}>{seats}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Төлбөр</Text>
                  <Text style={styles.price}>{(booking.totalPrice || 0).toLocaleString()}₮</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: typeof COLORS) => StyleSheet.create({
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
  },
  title: { color: colors.white, fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { color: colors.textDim, fontSize: 15, textAlign: 'center' },
  list: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  movieIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  movieTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.textSub, marginTop: 3, fontSize: 12 },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: colors.tealDim,
  },
  statusText: { color: colors.teal, fontSize: 11, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  detailLabel: { color: colors.textSub, fontSize: 13 },
  detailValue: { color: colors.text, fontSize: 13, flex: 1, textAlign: 'right' },
  price: { color: colors.gold, fontSize: 15, fontWeight: '900' },
});
