import { useEffect, useMemo, useState } from 'react';
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
import { safeBack } from '../../utils/navigation';

// ── Constants ─────────────────────────────────────────────────────────────────
const SHORT  = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const MONTHS = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р','9-р','10-р','11-р','12-р'];
const MONGOLIA_OFFSET_MS = 7 * 60 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function dayFromShowTime(showTime: string): DayItem {
  const d = new Date(new Date(showTime).getTime() + MONGOLIA_OFFSET_MS);
    return {
    fullDate: d.toISOString().split('T')[0],
    short: SHORT[d.getUTCDay()],
    num: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
    };
}

function utcToMN(iso: string): string {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayItem { fullDate: string; short: string; num: number; month: string; }
interface Schedule { _id: string; showTime: string; movie?: any; hall?: any; availableSeats?: number; basePrice?: number; childPrice?: number; }

function getScheduleMovieId(schedule: Schedule): string {
  const movie = schedule.movie;
  if (!movie) return '';
  return String(movie?._id ?? movie?.id ?? movie);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingDateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { movieId, movieTitle, posterUrl } = useLocalSearchParams<{
    movieId: string; movieTitle: string; posterUrl: string;
  }>();

  const [days,            setDays]            = useState<DayItem[]>([]);
  const [selectedDate,    setSelectedDate]    = useState('');
  const [selectedTime,    setSelectedTime]    = useState('');
  const [selectedSchedId, setSelectedSchedId] = useState('');
  const [selectedShowTime, setSelectedShowTime] = useState('');
  const [selectedPrices,  setSelectedPrices]  = useState({ adult: 15000, child: 10000 });
  const [allSchedules,    setAllSchedules]    = useState<Schedule[]>([]);
  const [schedules,       setSchedules]       = useState<Schedule[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(false);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setError(false);

    scheduleAPI
      .getByMovie(movieId)
      .then((data: any) => {
        const list: Schedule[] = Array.isArray(data)
          ? data
          : data.schedules ?? data.data ?? [];

        const filtered = list
          .filter(s => getScheduleMovieId(s) === String(movieId))
          .filter(s => isFutureShowTime(s.showTime))
          .sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());

        const uniqueDays = Array.from(
          new Map(filtered.map((schedule) => {
            const day = dayFromShowTime(schedule.showTime);
            return [day.fullDate, day];
          })).values()
        );

        setAllSchedules(filtered);
        setDays(uniqueDays);
        setSelectedDate((current) => current || uniqueDays[0]?.fullDate || '');
      })
      .catch(() => {
        setAllSchedules([]);
        setDays([]);
        setSchedules([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [movieId]);

  useEffect(() => {
    const filtered = allSchedules.filter((schedule) => dayFromShowTime(schedule.showTime).fullDate === selectedDate);
    setSchedules(filtered);
    setSelectedTime('');
    setSelectedSchedId('');
    setSelectedShowTime('');
    setSelectedPrices({ adult: 15000, child: 10000 });
  }, [allSchedules, selectedDate]);

  const canContinue = Boolean(selectedDate && selectedTime && selectedSchedId && isFutureShowTime(selectedShowTime));

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: '/booking/ticket-type',
      params: {
        movieId,
        movieTitle,
        posterUrl,
        date: selectedDate,
        time: selectedTime,
        scheduleId: selectedSchedId,
        showTime: selectedShowTime,
        adultPrice: String(selectedPrices.adult),
        childPrice: String(selectedPrices.child),
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router)} style={styles.backBtn} hitSlop={8}>
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
          ) : days.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Энэ үзвэрийн хуваарь одоогоор байхгүй байна</Text>
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
                    onPress={() => {
                      setSelectedTime(time);
                      setSelectedSchedId(sched._id);
                      setSelectedShowTime(sched.showTime);
                      setSelectedPrices({
                        adult: Number(sched.basePrice) || Number(sched.movie?.adultPrice) || 15000,
                        child: Number(sched.childPrice) || Number(sched.movie?.childPrice) || 10000,
                      });
                    }}
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
            colors={canContinue ? ['#e11d48', '#f59e0b'] : [colors.bgElevate, colors.bgElevate]}
            style={styles.continueGrad}
          >
            <Text style={[styles.continueText, !canContinue && { color: colors.textSub }]}>
              {canContinue
                ? `${selectedDate} · ${selectedTime}  →  Тасалбарын төрөл сонгох`
                : 'Цаг сонгоно уу'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => {
  const primaryText = colors.mode === 'light' ? colors.textBright : colors.white;
  return StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md },
  backBtn:      { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backText:     { color: primaryText, fontSize: 18, fontWeight: '700' },
  headerTitle:  { color: primaryText, fontSize: 16, fontWeight: '700' },
  movieRow:     { flexDirection: 'row', gap: SPACING.md, padding: SPACING.lg, backgroundColor: colors.bgCard, margin: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border },
  miniPoster:   { width: 56, height: 80, borderRadius: RADIUS.sm },
  movieTitle:   { color: primaryText, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  movieSub:     { color: colors.textSub, fontSize: 12 },
  section:      { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.coral, marginBottom: SPACING.md },
  daysRow:      { gap: SPACING.sm, paddingRight: SPACING.lg },
  dayCard:      { width: 62, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dayCardSel:   { backgroundColor: colors.coralDim, borderColor: colors.coral },
  dayShort:     { fontSize: 10, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 1 },
  dayShortSel:  { color: colors.coral },
  dayNum:       { fontSize: 22, fontWeight: '800', color: colors.textDim, marginVertical: 2 },
  dayNumSel:    { color: colors.coral },
  dayMonth:     { fontSize: 9, color: colors.textSub },
  dayMonthSel:  { color: colors.coral },
  emptyWrap:    { padding: SPACING.xl, alignItems: 'center' },
  emptyText:    { color: colors.textSub, fontSize: 14 },
  timesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeCard:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', minWidth: 80 },
  timeCardSel:  { backgroundColor: colors.coral, borderColor: colors.coral },
  timeText:     { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  timeTextSel:  { color: '#ffffff' },
  primeBadge:   { marginTop: 3, backgroundColor: 'rgba(245,200,66,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 1 },
  primeText:    { fontSize: 9, color: colors.gold, fontWeight: '700' },
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtn:  { borderRadius: RADIUS.md, overflow: 'hidden' },
  continueGrad: { padding: SPACING.md, alignItems: 'center' },
  continueText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});
};
