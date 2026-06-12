import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RADIUS, SPACING, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { safeBack } from '../../utils/navigation';

function toPrice(value: string | undefined, fallback: number) {
  const parsed = parseInt(String(value || fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value: number) {
  return `${value.toLocaleString()}₮`;
}

export default function TicketTypeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    movieId,
    movieTitle,
    posterUrl,
    date,
    time,
    scheduleId,
    showTime,
    adultPrice,
    childPrice,
  } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    posterUrl?: string;
    date: string;
    time: string;
    scheduleId: string;
    showTime?: string;
    adultPrice?: string;
    childPrice?: string;
  }>();

  const prices = useMemo(() => ({
    adult: toPrice(adultPrice, 15000),
    child: toPrice(childPrice, 10000),
  }), [adultPrice, childPrice]);

  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const totalCount = adultCount + childCount;
  const totalPrice = adultCount * prices.adult + childCount * prices.child;

  const changeCount = (type: 'adult' | 'child', delta: number) => {
    if (type === 'adult') setAdultCount((value) => Math.max(0, value + delta));
    if (type === 'child') setChildCount((value) => Math.max(0, value + delta));
  };

  const continueToSeats = () => {
    if (totalCount < 1) return;
    router.push({
      pathname: '/booking/seats',
      params: {
        movieId,
        movieTitle,
        posterUrl,
        date,
        time,
        scheduleId,
        showTime,
        adultPrice: String(prices.adult),
        childPrice: String(prices.child),
        adultCount: String(adultCount),
        childCount: String(childCount),
        ticketCount: String(totalCount),
      },
    });
  };

  const rows = [
    { key: 'adult' as const, title: 'Том хүн', price: prices.adult, count: adultCount },
    { key: 'child' as const, title: 'Хүүхэд', price: prices.child, count: childCount },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router, '/booking/date')} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тасалбарын ангилал</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.movieCard}>
          {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" /> : <View style={styles.poster} />}
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
            <Text style={styles.movieMeta}>{date} · {time}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.key} style={styles.ticketRow}>
              <View>
                <Text style={styles.ticketTitle}>{row.title}</Text>
                <Text style={styles.ticketPrice}>{money(row.price)}</Text>
              </View>
              <View style={styles.counter}>
                <TouchableOpacity
                  style={[styles.countBtn, row.count === 0 && styles.countBtnDisabled]}
                  disabled={row.count === 0}
                  onPress={() => changeCount(row.key, -1)}
                >
                  <Text style={styles.countBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.countValue}>{row.count}</Text>
                <TouchableOpacity style={styles.countBtn} onPress={() => changeCount(row.key, 1)}>
                  <Text style={styles.countBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>{totalCount} тасалбар</Text>
          <Text style={styles.footerTotal}>{money(totalPrice)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, totalCount < 1 && styles.continueBtnDisabled]}
          disabled={totalCount < 1}
          onPress={continueToSeats}
          activeOpacity={0.86}
        >
          <LinearGradient colors={['#e11d48', '#f59e0b']} style={styles.continueGrad}>
            <Text style={styles.continueText}>Суудал сонгох →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => {
  const primaryText = colors.mode === 'light' ? colors.textBright : colors.white;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: primaryText, fontSize: 18, fontWeight: '800' },
  headerTitle: { color: primaryText, fontSize: 16, fontWeight: '900' },
  content: { padding: SPACING.lg, paddingBottom: 140 },
  movieCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.lg,
  },
  poster: { width: 72, height: 104, borderRadius: RADIUS.md, backgroundColor: colors.bgElevate },
  movieInfo: { flex: 1, justifyContent: 'center' },
  movieTitle: { color: primaryText, fontSize: 18, fontWeight: '900', lineHeight: 23 },
  movieMeta: { color: colors.teal, fontSize: 13, fontWeight: '800', marginTop: 8 },
  list: { gap: SPACING.md },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketTitle: { color: primaryText, fontSize: 16, fontWeight: '900' },
  ticketPrice: { color: colors.textSub, fontSize: 13, fontWeight: '700', marginTop: 5 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnDisabled: { opacity: 0.35 },
  countBtnText: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginTop: -2 },
  countValue: { color: primaryText, fontSize: 20, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  footerLabel: { color: colors.textSub, fontSize: 12, fontWeight: '700' },
  footerTotal: { color: colors.teal, fontSize: 22, fontWeight: '900', marginTop: 2 },
  continueBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  continueBtnDisabled: { opacity: 0.42 },
  continueGrad: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  continueText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});
};
