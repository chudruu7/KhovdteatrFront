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
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const { width: W } = Dimensions.get('window');
const SEAT_SIZE = 18;
const SEAT_GAP = 2;
const AISLE = 18;
const MAP_WIDTH = 22 * SEAT_SIZE + 20 * SEAT_GAP + AISLE + 58;

const PRICES = {
  standard: { adult: 15000, child: 8000 },
  prime: { adult: 20000, child: 10000 },
};

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

export default function SeatsScreen() {
  const router = useRouter();
  const { movieId, movieTitle, posterUrl, date, time, scheduleId } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    posterUrl: string;
    date: string;
    time: string;
    scheduleId: string;
  }>();

  const [takenSeats, setTakenSeats] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<SelectedSeat[]>([]);
  const [loading, setLoading] = useState(true);

  const prices = useMemo(() => {
    const hour = parseInt((time || '').split(':')[0], 10);
    return hour >= 18 ? PRICES.prime : PRICES.standard;
  }, [time]);

  const totalPrice = useMemo(
    () => chosen.reduce((sum, seat) => sum + (seat.type === 'adult' ? prices.adult : prices.child), 0),
    [chosen, prices]
  );

  const adultCount = chosen.filter((seat) => seat.type === 'adult').length;
  const childCount = chosen.filter((seat) => seat.type === 'child').length;

  useEffect(() => {
    if (!scheduleId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const loadSeats = () => {
      scheduleAPI.getSeats(scheduleId)
        .then((data) => mounted && setTakenSeats(normalizeTakenSeats(data)))
        .catch(() => {})
        .finally(() => mounted && setLoading(false));
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
      if (!existing) return [...prev, { id, type: 'adult' }];
      return prev.map((seat) =>
        seat.id === id ? { ...seat, type: seat.type === 'adult' ? 'child' : 'adult' } : seat
      );
    });
  };

  const removeSeat = (id: string) => {
    setChosen((prev) => prev.filter((seat) => seat.id !== id));
  };

  const handleContinue = async () => {
    if (chosen.length === 0) {
      Alert.alert('Анхааруулга', 'Суудал сонгоно уу');
      return;
    }
    if (scheduleId) {
      try {
        const fresh = normalizeTakenSeats(await scheduleAPI.getSeats(scheduleId));
        const conflict = chosen.find((seat) => fresh.has(seat.id));
        if (conflict) {
          setTakenSeats(fresh);
          setChosen((prev) => prev.filter((seat) => !fresh.has(seat.id)));
          Alert.alert('Суудал захиалагдсан', `"${conflict.id}" суудал саяхан захиалагдсан байна. Дахин сонгоно уу.`);
          return;
        }
      } catch {}
    }
    router.push({
      pathname: '/booking/checkout',
      params: {
        movieId,
        movieTitle,
        posterUrl,
        date,
        time,
        scheduleId,
        seats: JSON.stringify(chosen),
        totalPrice: String(totalPrice),
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
          <ActivityIndicator color={COLORS.teal} size="large" />
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
                  <Text style={styles.cartKicker}>{chosen.length} суудал</Text>
                  <Text style={styles.cartTitle}>Сонгосон суудлууд</Text>
                </View>
                <Text style={styles.cartTotal}>{money(totalPrice)}</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {chosen.map((seat) => {
                  const price = seat.type === 'adult' ? prices.adult : prices.child;
                  return (
                    <View key={seat.id} style={styles.chip}>
                      <TouchableOpacity onPress={() => toggleSeat(seat.id)} style={styles.chipMain}>
                        <Text style={styles.chipId}>{seat.id}</Text>
                        <Text style={styles.chipType}>{seat.type === 'adult' ? 'Том хүн' : 'Хүүхэд'} · {money(price)}</Text>
                      </TouchableOpacity>
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
              <Text style={styles.cartHint}>Сонгосон суудал дээр дахин дарахад Том хүн/Хүүхэд солигдоно.</Text>
            </View>
          )}

          <View style={{ height: 122 }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerCount}>{chosen.length} суудал</Text>
          <Text style={styles.footerTotal}>{money(totalPrice)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, chosen.length === 0 && styles.continueBtnDisabled]}
          disabled={chosen.length === 0}
          onPress={handleContinue}
          activeOpacity={0.86}
        >
          <LinearGradient colors={[COLORS.teal, '#13c4a3']} style={styles.continueGrad}>
            <Text style={styles.continueText}>Үргэлжлүүлэх →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  headerSub: { color: COLORS.textSub, fontSize: 12, marginTop: 2 },
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
    color: COLORS.textSub,
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
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rowLabel: {
    width: 28,
    color: COLORS.textSub,
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
    borderColor: COLORS.border2,
  },
  phantomSeat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
  },
  seatAdult: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  seatChild: {
    backgroundColor: '#7ea3ff',
    borderColor: '#7ea3ff',
  },
  seatTaken: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
    opacity: 0.75,
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
  legendAdult: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  legendChild: { backgroundColor: '#7ea3ff', borderColor: '#7ea3ff' },
  legendFree: { backgroundColor: '#393c52', borderColor: COLORS.border2 },
  legendTaken: { backgroundColor: COLORS.coral, borderColor: COLORS.coral },
  legendBroken: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.08)' },
  legendText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600' },
  cart: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cartKicker: { color: COLORS.teal, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cartTitle: { color: COLORS.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  cartTotal: { color: COLORS.teal, fontSize: 20, fontWeight: '900' },
  chips: { gap: 8, paddingBottom: SPACING.md },
  chip: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.bgElevate,
  },
  chipMain: { paddingHorizontal: 10, paddingVertical: 8, minWidth: 112 },
  chipId: { color: COLORS.teal, fontSize: 12, fontWeight: '900' },
  chipType: { color: COLORS.textDim, fontSize: 10, marginTop: 3, fontWeight: '700' },
  chipRemove: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  chipRemoveText: { color: COLORS.coral, fontSize: 18, fontWeight: '900' },
  sumLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  sumText: { color: COLORS.textSub, fontSize: 12 },
  sumValue: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  cartHint: { color: COLORS.textSub, fontSize: 10, lineHeight: 15, marginTop: SPACING.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  footerInfo: { flex: 1 },
  footerCount: { color: COLORS.textSub, fontSize: 12 },
  footerTotal: { color: COLORS.teal, fontSize: 20, fontWeight: '900' },
  continueBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  continueBtnDisabled: { opacity: 0.42 },
  continueGrad: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  continueText: { color: '#0f261c', fontWeight: '900', fontSize: 15 },
});
