import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { scheduleAPI } from '../../api';
import { RADIUS, SPACING, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isBookableShowTime } from '../../utils/showtime';
import { safeBack } from '../../utils/navigation';

const { width: W } = Dimensions.get('window');
const SEAT_SIZE = 18;
const SEAT_GAP = 2;
const AISLE = 18;
const MAP_WIDTH = 22 * SEAT_SIZE + 20 * SEAT_GAP + AISLE + 58;

type SeatType = 'adult' | 'child';
type SelectedSeat = { id: string; type: SeatType };
type SeatCell = { num: number | null; phantom?: boolean; broken?: boolean };
type RowDef = { label: string; left: SeatCell[]; right: SeatCell[] };

const cells = (nums: number[]): SeatCell[] => nums.map((num) => ({ num }));
const empty = (count: number): SeatCell[] => Array.from({ length: count }, () => ({ num: null, phantom: true }));

const ROW_CELLS: RowDef[] = [
  { label: '1-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '2-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '3-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '4-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '0-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '5-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '6-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '7-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '8-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '9-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  { label: '10-р эгнээ', left: cells([22,21,20,19,18,17,16,15,14,13,12]), right: cells([11,10,9,8,7,6,5,4,3,2,1]) },
  {
    label: '11-р эгнээ',
    left: cells([22,21,20,19,18,17,16,15,14,13,12]),
    right: [...cells([11,10,9,8,7,6,5,4,3,2]), { num: 1, broken: true }],
  },
  {
    label: '12-р эгнээ',
    left: [...empty(2), ...cells([11,10,9,8,7,6,5]), ...empty(2)],
    right: [...empty(2), ...cells([4,3,2,1]), ...empty(5)],
  },
  {
    label: '13-р эгнээ',
    left: [...empty(2), ...cells([13,12,11,10,9,8,7]), { num: 6, broken: true }, ...empty(1)],
    right: [...empty(1), { num: 5, broken: true }, ...cells([4,3,2,1]), ...empty(5)],
  },
  {
    label: '14-р эгнээ',
    left: [...empty(2), ...cells([12,11,10,9,8,7,6]), ...empty(2)],
    right: [...empty(1), { num: 5, broken: true }, ...cells([4,3,2,1]), ...empty(5)],
  },
  {
    label: '15-р эгнээ',
    left: [...empty(2), ...cells([11,10,9,8,7,6]), { num: 5, broken: true }, ...empty(2)],
    right: [...empty(2), ...cells([4,3,2,1]), ...empty(5)],
  },
  {
    label: '16-р эгнээ',
    left: [...empty(2), ...cells([9,8,7,6,5,4]), ...empty(3)],
    right: [...empty(2), ...cells([3,2,1]), ...empty(6)],
  },
];

function money(n: number) {
  return `${n.toLocaleString()}₮`;
}

function makeSeatId(rowLabel: string, num: number) {
  return `${rowLabel.replace('-р эгнээ', 'эг')}-${num}`;
}

function normalizeTakenSeats(input: any): Set<string> {
  const raw = input?.soldSeats || input?.seats || input?.takenSeats || [];
  return new Set(
    raw
      .map((seat: any) => (typeof seat === 'string' ? seat : seat?.seatId || seat?.id))
      .filter(Boolean)
      .map(String)
  );
}

function toCount(value: string | undefined, fallback: number) {
  const parsed = parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export default function SeatsScreen() {
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
    adultCount: adultCountParam,
    childCount: childCountParam,
    ticketCount,
  } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    posterUrl: string;
    date: string;
    time: string;
    scheduleId: string;
    showTime?: string;
    adultPrice?: string;
    childPrice?: string;
    adultCount?: string;
    childCount?: string;
    ticketCount?: string;
  }>();

  const [takenSeats, setTakenSeats] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<SelectedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const prices = useMemo(() => {
    const adult = parseInt(String(adultPrice || '15000'), 10);
    const child = parseInt(String(childPrice || '10000'), 10);
    return {
      adult: Number.isFinite(adult) ? adult : 15000,
      child: Number.isFinite(child) ? child : 10000,
    };
  }, [adultPrice, childPrice]);

  const adultCount = toCount(adultCountParam, 1);
  const childCount = toCount(childCountParam, 0);
  const requiredTickets = Math.max(1, adultCount + childCount);
  const requestedTickets = toCount(ticketCount, requiredTickets);
  const totalPrice = adultCount * prices.adult + childCount * prices.child;

  const assignSeatTypes = (ids: string[]): SelectedSeat[] =>
    ids.map((id, index) => ({ id, type: index < adultCount ? 'adult' : 'child' }));

  useEffect(() => {
    if (!scheduleId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    let isFirstLoad = true;
    const loadSeats = () => {
      scheduleAPI.getSeats(scheduleId)
        .then((data) => {
          if (!mounted) return;
          setTakenSeats(normalizeTakenSeats(data));
          setFetchError(false);
        })
        .catch(() => {
          if (!mounted) return;
          // Анхны ачаалалт дээр алдаа гарвал fetchError тавина
          // Дараагийн poll-ууд дээр хуучин takenSeats-г хадгална (stale > empty)
          if (isFirstLoad) {
            setFetchError(true);
          }
        })
        .finally(() => {
          if (!mounted) return;
          isFirstLoad = false;
          setLoading(false);
        });
    };
    loadSeats();
    const interval = setInterval(loadSeats, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [scheduleId]);

  const toggleSeat = (id: string) => {
    setChosen((prev) => {
      const existing = prev.find((seat) => seat.id === id);
      if (existing) return assignSeatTypes(prev.filter((seat) => seat.id !== id).map((seat) => seat.id));
      if (prev.length >= requiredTickets) {
        Alert.alert('Анхааруулга', `${requiredTickets} суудал сонгоно уу. Нэмэлт суудал сонгох боломжгүй.`);
        return prev;
      }
      return assignSeatTypes([...prev.map((seat) => seat.id), id]);
    });
  };

  const removeSeat = (id: string) => {
    setChosen((prev) => assignSeatTypes(prev.filter((seat) => seat.id !== id).map((seat) => seat.id)));
  };

  const handleContinue = async () => {
    if (requestedTickets !== requiredTickets) {
      Alert.alert('Анхааруулга', 'Тасалбарын тоо зөрүүтэй байна. Тасалбараа дахин сонгоно уу.');
      safeBack(router, '/booking/ticket-type');
      return;
    }
    if (!isBookableShowTime(showTime, date, time)) {
      Alert.alert('Анхааруулга', 'Энэ үзвэрийн цаг өнгөрсөн тул тасалбар захиалах боломжгүй.');
      safeBack(router, '/booking/ticket-type');
      return;
    }
    if (chosen.length !== requiredTickets) {
      Alert.alert('Анхааруулга', `${requiredTickets} суудал сонгоно уу.`);
      return;
    }
    if (scheduleId) {
      try {
        const fresh = normalizeTakenSeats(await scheduleAPI.getSeats(scheduleId));
        setTakenSeats(fresh);
        const conflict = chosen.find((seat) => fresh.has(seat.id));
        if (conflict) {
          setChosen((prev) => assignSeatTypes(prev.filter((seat) => !fresh.has(seat.id)).map((seat) => seat.id)));
          Alert.alert('Суудал захиалагдсан', `"${conflict.id}" суудал саяхан захиалагдсан байна. Дахин сонгоно уу.`);
          return;
        }
      } catch {
        Alert.alert('Алдаа', 'Суудлын мэдээлэл шалгах боломжгүй байна. Интернэт холболтоо шалгаад дахин оролдоно уу.');
        return;
      }
    }
    router.push({
      pathname: '/booking/checkout',
      params: {
        movieId,
        movieTitle,
        posterUrl,
        date,
        time,
        showTime,
        scheduleId,
        seats: JSON.stringify(chosen),
        totalPrice: String(totalPrice),
        adultPrice: String(prices.adult),
        childPrice: String(prices.child),
        adultCount: String(adultCount),
        childCount: String(childCount),
      },
    });
  };

  const renderSeat = (cell: SeatCell, rowLabel: string, side: 'left' | 'right', index: number) => {
    if (cell.phantom || !cell.num) {
      return <View key={`${rowLabel}-${side}-${index}`} style={styles.phantomSeat} />;
    }

    const id = makeSeatId(rowLabel, cell.num);
    const taken = takenSeats.has(id);
    const selected = chosen.find((seat) => seat.id === id);
    const disabled = taken || cell.broken;

    return (
      <TouchableOpacity
        key={id}
        disabled={disabled}
        onPress={() => toggleSeat(id)}
        activeOpacity={0.76}
        style={[
          styles.seat,
          taken && styles.seatTaken,
          cell.broken && styles.seatBroken,
          selected?.type === 'adult' && styles.seatAdult,
          selected?.type === 'child' && styles.seatChild,
        ]}
      >
        <Text style={[styles.seatNum, selected && styles.seatNumSelected]}>{cell.num}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router, '/booking/ticket-type')} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Суудал сонгох</Text>
          <Text style={styles.headerSub}>{date} · {time}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={{ color: colors.textSub, marginTop: 12, fontSize: 13 }}>Суудлын мэдээлэл ачаалж байна...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Text style={{ color: colors.coral, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>⚠ Суудлын мэдээлэл ачаалж чадсангүй</Text>
          <Text style={{ color: colors.textSub, fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 32 }}>
            Интернэт холболтоо шалгаад дахин оролдоно уу. Суудлын мэдээлэл ачаалагдаагүй үед захиалга хийх боломжгүй.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setFetchError(false);
              scheduleAPI.getSeats(scheduleId)
                .then((data) => {
                  setTakenSeats(normalizeTakenSeats(data));
                  setFetchError(false);
                })
                .catch(() => setFetchError(true))
                .finally(() => setLoading(false));
            }}
            style={{ backgroundColor: colors.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
          >
            <Text style={{ color: '#0f261c', fontWeight: '800', fontSize: 14 }}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.screenWrap}>
            <LinearGradient
              colors={['rgba(232,96,122,0.95)', 'rgba(232,96,122,0.08)', 'transparent']}
              style={styles.screenGlow}
            />
            <Text style={styles.screenLabel}>Д Э Л Г Э Ц</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mapScroll}
          >
            <View style={styles.map}>
              {ROW_CELLS.map((row) => (
                <View key={row.label} style={styles.rowWrap}>
                  <Text style={styles.rowLabel}>{row.label.replace('-р эгнээ', '')}</Text>
                  <View style={styles.seatsSide}>
                    {row.left.map((cell, index) => renderSeat(cell, row.label, 'left', index))}
                  </View>
                  <View style={styles.centerAisle} />
                  <View style={styles.seatsSide}>
                    {row.right.map((cell, index) => renderSeat(cell, row.label, 'right', index))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.legend}>
            {[
              { style: styles.legendAdult, label: 'Том хүн' },
              { style: styles.legendChild, label: 'Хүүхэд' },
              { style: styles.legendFree, label: 'Сул' },
              { style: styles.legendTaken, label: 'Захиалгатай' },
              { style: styles.legendBroken, label: 'Ашиглахгүй' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendBox, item.style]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {chosen.length > 0 && (
            <View style={styles.cart}>
              <View style={styles.cartHeader}>
                <View>
                  <Text style={styles.cartKicker}>{chosen.length}/{requiredTickets} суудал</Text>
                  <Text style={styles.cartTitle}>Сонгосон суудлууд</Text>
                </View>
                <Text style={styles.cartTotal}>{money(totalPrice)}</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {chosen.map((seat) => {
                  const price = seat.type === 'adult' ? prices.adult : prices.child;
                  return (
                    <View key={seat.id} style={styles.chip}>
                      <View style={styles.chipMain}>
                        <Text style={styles.chipId}>{seat.id}</Text>
                        <Text style={styles.chipType}>{seat.type === 'adult' ? 'Том хүн' : 'Хүүхэд'} · {money(price)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeSeat(seat.id)} style={styles.chipRemove}>
                        <Text style={styles.chipRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.sumLine}>
                <Text style={styles.sumText}>Том хүн ({adultCount})</Text>
                <Text style={styles.sumValue}>{money(adultCount * prices.adult)}</Text>
              </View>
              <View style={styles.sumLine}>
                <Text style={styles.sumText}>Хүүхэд ({childCount})</Text>
                <Text style={styles.sumValue}>{money(childCount * prices.child)}</Text>
              </View>
              <Text style={styles.cartHint}>Сонгосон тасалбарын тоотой тэнцүү суудал сонгоно. Суудал дээр дахин дарахад сонголт цуцлагдана.</Text>
            </View>
          )}

          <View style={{ height: 122 }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerCount}>{chosen.length}/{requiredTickets} суудал</Text>
          <Text style={styles.footerTotal}>{money(totalPrice)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, chosen.length !== requiredTickets && styles.continueBtnDisabled]}
          disabled={chosen.length !== requiredTickets}
          onPress={handleContinue}
          activeOpacity={0.86}
        >
          <LinearGradient colors={[colors.teal, '#13c4a3']} style={styles.continueGrad}>
            <Text style={styles.continueText}>Үргэлжлүүлэх →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
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
  backText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  headerSub: { color: colors.textSub, fontSize: 12, marginTop: 2 },
  screenWrap: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  screenGlow: {
    width: Math.min(W - 72, 310),
    height: 46,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    opacity: 0.9,
  },
  screenLabel: {
    color: colors.textSub,
    fontSize: 10,
    letterSpacing: 4,
    marginTop: -22,
    fontWeight: '800',
  },
  mapScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  map: {
    width: MAP_WIDTH,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rowLabel: {
    width: 28,
    color: colors.textSub,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  seatsSide: {
    flexDirection: 'row',
    gap: SEAT_GAP,
  },
  centerAisle: {
    width: AISLE,
  },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: 4,
    backgroundColor: '#393c52',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  phantomSeat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
  },
  seatAdult: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    transform: [{ scale: 1.08 }],
  },
  seatChild: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
    transform: [{ scale: 1.08 }],
  },
  seatTaken: {
    backgroundColor: '#2f3442',
    borderColor: '#424857',
    opacity: 0.82,
  },
  seatBroken: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.04)',
    opacity: 0.35,
  },
  seatNum: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
  },
  seatNumSelected: {
    color: '#0f261c',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1 },
  legendAdult: { backgroundColor: colors.gold, borderColor: colors.gold },
  legendChild: { backgroundColor: colors.teal, borderColor: colors.teal },
  legendFree: { backgroundColor: '#393c52', borderColor: colors.border2 },
  legendTaken: { backgroundColor: '#2f3442', borderColor: '#424857' },
  legendBroken: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.08)' },
  legendText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  cart: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cartKicker: { color: colors.teal, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cartTitle: { color: colors.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  cartTotal: { color: colors.teal, fontSize: 20, fontWeight: '900' },
  chips: { gap: 8, paddingBottom: SPACING.md },
  chip: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.bgElevate,
  },
  chipMain: { paddingHorizontal: 10, paddingVertical: 8, minWidth: 112 },
  chipId: { color: colors.teal, fontSize: 12, fontWeight: '900' },
  chipType: { color: colors.textDim, fontSize: 10, marginTop: 3, fontWeight: '700' },
  chipRemove: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  chipRemoveText: { color: colors.coral, fontSize: 18, fontWeight: '900' },
  sumLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  sumText: { color: colors.textSub, fontSize: 12 },
  sumValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  cartHint: { color: colors.textSub, fontSize: 10, lineHeight: 15, marginTop: SPACING.sm },
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
    gap: SPACING.md,
  },
  footerInfo: { flex: 1 },
  footerCount: { color: colors.textSub, fontSize: 12 },
  footerTotal: { color: colors.teal, fontSize: 20, fontWeight: '900' },
  continueBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  continueBtnDisabled: { opacity: 0.42 },
  continueGrad: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  continueText: { color: '#0f261c', fontWeight: '900', fontSize: 15 },
});
