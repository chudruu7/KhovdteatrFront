import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { scheduleAPI } from '../../api';
import { SPACING, RADIUS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isFutureShowTime } from '../../utils/showtime';

// ── Constants ─────────────────────────────────────────────────────────────────
const SHORT  = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const MONTHS = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р','9-р','10-р','11-р','12-р'];
const MONGOLIA_OFFSET_MS = 8 * 60 * 60 * 1000;   // UTC+8

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekDays(count = 10) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      fullDate: d.toISOString().split('T')[0],
      short:    SHORT[d.getDay()],
      num:      d.getDate(),
      month:    MONTHS[d.getMonth()],
    };
  });
}

function utcToMN(iso: string): string {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayItem { fullDate: string; short: string; num: number; month: string; }
interface Schedule { _id: string; showTime: string; movie?: any; hall?: any; availableSeats?: number; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingDateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { movieId, movieTitle, posterUrl } = useLocalSearchParams<{
    movieId: string; movieTitle: string; posterUrl: string;
  }>();

  const days = useRef<DayItem[]>(getWeekDays()).current;  // stable across re-renders

  const [selectedDate,    setSelectedDate]    = useState(days[0].fullDate);
  const [selectedTime,    setSelectedTime]    = useState('');
  const [selectedSchedId, setSelectedSchedId] = useState('');
  const [selectedShowTime, setSelectedShowTime] = useState('');
  const [schedules,       setSchedules]       = useState<Schedule[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(false);

  // Abort previous request when date changes
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!movieId || !selectedDate) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(false);
    setSelectedTime('');
    setSelectedSchedId('');
    setSelectedShowTime('');

    scheduleAPI
      .getByMovieAndDate(movieId, selectedDate)
      .then((data: any) => {
        const list: Schedule[] = Array.isArray(data)
          ? data
          : data.schedules ?? data.data ?? [];

        const filtered = list
          .filter(s => String(s.movie?._id ?? s.movie ?? '') === String(movieId))
          .filter(s => isFutureShowTime(s.showTime))
          .sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());

        setSchedules(filtered);
      })
      .catch(() => {
        setSchedules([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [movieId, selectedDate]);

  const canContinue = Boolean(selectedDate && selectedTime && selectedSchedId && isFutureShowTime(selectedShowTime));

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: '/booking/seats',
      params: { movieId, movieTitle, posterUrl, date: selectedDate, time: selectedTime, scheduleId: selectedSchedId, showTime: selectedShowTime },
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Огноо & Цаг сонгох</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* Movie info */}
        <View style={styles.movieRow}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.miniPoster} resizeMode="cover" />
          ) : (
            <View style={[styles.miniPoster, { backgroundColor: colors.bgElevate }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
            <Text style={styles.movieSub}>Огноо болон цагаа сонгоно уу</Text>
          </View>
        </View>

        {/* Date selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅  ОГНОО СОНГОХ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {days.map(d => {
              const sel = selectedDate === d.fullDate;
              return (
                <TouchableOpacity
                  key={d.fullDate}
                  style={[styles.dayCard, sel && styles.dayCardSel]}
                  onPress={() => setSelectedDate(d.fullDate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayShort,  sel && styles.dayShortSel]}>{d.short}</Text>
                  <Text style={[styles.dayNum,    sel && styles.dayNumSel]}>{d.num}</Text>
                  <Text style={[styles.dayMonth,  sel && styles.dayMonthSel]}>{d.month} сар</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐  ЦАГ СОНГОХ</Text>

          {loading ? (
            <ActivityIndicator color={colors.teal} style={{ marginVertical: SPACING.lg }} />
          ) : error ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Өгөгдөл ачаалахад алдаа гарлаа</Text>
            </View>
          ) : schedules.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Энэ өдөр хуваарь байхгүй байна</Text>
            </View>
          ) : (
            <View style={styles.timesGrid}>
              {schedules.map(sched => {
                const time    = utcToMN(sched.showTime);
                const sel     = selectedSchedId === sched._id;
                const isPrime = parseInt(time.split(':')[0], 10) >= 18;

                return (
                  <TouchableOpacity
                    key={sched._id}
                    style={[styles.timeCard, sel && styles.timeCardSel]}
                    onPress={() => { setSelectedTime(time); setSelectedSchedId(sched._id); setSelectedShowTime(sched.showTime); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timeText, sel && styles.timeTextSel]}>{time}</Text>
                    {isPrime && (
                      <View style={styles.primeBadge}>
                        <Text style={styles.primeText}>Prime</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && { opacity: 0.4 }]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={canContinue ? [colors.teal, '#13c4a3'] : [colors.bgElevate, colors.bgElevate]}
            style={styles.continueGrad}
          >
            <Text style={[styles.continueText, !canContinue && { color: colors.textSub }]}>
              {canContinue
                ? `${selectedDate} · ${selectedTime}  →  Суудал сонгох`
                : 'Цаг сонгоно уу'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md },
  backBtn:      { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backText:     { color: colors.white, fontSize: 18, fontWeight: '700' },
  headerTitle:  { color: colors.white, fontSize: 16, fontWeight: '700' },
  movieRow:     { flexDirection: 'row', gap: SPACING.md, padding: SPACING.lg, backgroundColor: colors.bgCard, margin: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border },
  miniPoster:   { width: 56, height: 80, borderRadius: RADIUS.sm },
  movieTitle:   { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  movieSub:     { color: colors.textSub, fontSize: 12 },
  section:      { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.teal, marginBottom: SPACING.md },
  daysRow:      { gap: SPACING.sm, paddingRight: SPACING.lg },
  dayCard:      { width: 62, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dayCardSel:   { backgroundColor: colors.tealDim, borderColor: colors.teal },
  dayShort:     { fontSize: 10, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 1 },
  dayShortSel:  { color: colors.teal },
  dayNum:       { fontSize: 22, fontWeight: '800', color: colors.textDim, marginVertical: 2 },
  dayNumSel:    { color: colors.teal },
  dayMonth:     { fontSize: 9, color: colors.textSub },
  dayMonthSel:  { color: colors.teal },
  emptyWrap:    { padding: SPACING.xl, alignItems: 'center' },
  emptyText:    { color: colors.textSub, fontSize: 14 },
  timesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeCard:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', minWidth: 80 },
  timeCardSel:  { backgroundColor: colors.teal, borderColor: colors.teal },
  timeText:     { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  timeTextSel:  { color: '#0f261c' },
  primeBadge:   { marginTop: 3, backgroundColor: 'rgba(245,200,66,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 1 },
  primeText:    { fontSize: 9, color: colors.gold, fontWeight: '700' },
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtn:  { borderRadius: RADIUS.md, overflow: 'hidden' },
  continueGrad: { padding: SPACING.md, alignItems: 'center' },
  continueText: { color: '#0f261c', fontWeight: '800', fontSize: 15 },
});
