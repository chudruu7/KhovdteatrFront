import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { scheduleAPI } from '../../api';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const SHORT = ['Ня','Да','Мя','Лх','Пү','Ба','Бя'];
const MONTHS = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р','9-р','10-р','11-р','12-р'];

function getWeekDays() {
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      fullDate: d.toISOString().split('T')[0],
      short:    SHORT[d.getDay()],
      num:      d.getDate(),
      month:    MONTHS[d.getMonth()],
    };
  });
}

const MONGOLIA_OFFSET = 8 * 60 * 60 * 1000;
function utcToMN(iso: string) {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_OFFSET);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

export default function BookingDateScreen() {
  const router = useRouter();
  const { movieId, movieTitle, posterUrl } = useLocalSearchParams<{
    movieId: string; movieTitle: string; posterUrl: string;
  }>();

  const days = getWeekDays();
  const [selectedDate, setSelectedDate]       = useState(days[0].fullDate);
  const [selectedTime, setSelectedTime]       = useState('');
  const [selectedSchedId, setSelectedSchedId] = useState('');
  const [schedules, setSchedules]             = useState<any[]>([]);
  const [loading,   setLoading]               = useState(false);

  useEffect(() => {
    if (!movieId || !selectedDate) return;
    setLoading(true);
    setSelectedTime('');
    scheduleAPI.getByMovieAndDate(movieId, selectedDate)
      .then(data => {
        const list = Array.isArray(data) ? data : data.schedules || data.data || [];
        const filtered = list
          .filter((s: any) => String(s.movie?._id ?? s.movie ?? '') === String(movieId))
          .sort((a: any, b: any) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());
        setSchedules(filtered);
      })
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [movieId, selectedDate]);

  const canContinue = selectedDate && selectedTime && selectedSchedId;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Огноо & Цаг сонгох</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Movie info */}
        <View style={styles.movieRow}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.miniPoster} />
          ) : (
            <View style={[styles.miniPoster, { backgroundColor: COLORS.bgElevate }]} />
          )}
          <View style={{ flex:1 }}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
            <Text style={styles.movieSub}>Огноо болон цагаа сонгоно уу</Text>
          </View>
        </View>

        {/* Date selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅  ОГНОО СОНГОХ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
            {days.map(d => {
              const sel = selectedDate === d.fullDate;
              return (
                <TouchableOpacity
                  key={d.fullDate}
                  style={[styles.dayCard, sel && styles.dayCardSel]}
                  onPress={() => setSelectedDate(d.fullDate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayShort, sel && styles.dayShortSel]}>{d.short}</Text>
                  <Text style={[styles.dayNum, sel && styles.dayNumSel]}>{d.num}</Text>
                  <Text style={[styles.dayMonth, sel && styles.dayMonthSel]}>{d.month} сар</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐  ЦАГ СОНГОХ</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.teal} style={{ marginVertical: SPACING.lg }} />
          ) : schedules.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Энэ өдөр хуваарь байхгүй байна</Text>
            </View>
          ) : (
            <View style={styles.timesGrid}>
              {schedules.map(sched => {
                const time = utcToMN(sched.showTime);
                const sel  = selectedSchedId === sched._id;
                const hour = parseInt(time.split(':')[0], 10);
                const isPrime = hour >= 18;
                return (
                  <TouchableOpacity
                    key={sched._id}
                    style={[styles.timeCard, sel && styles.timeCardSel]}
                    onPress={() => { setSelectedTime(time); setSelectedSchedId(sched._id); }}
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && { opacity: 0.4 }]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={() => router.push({
            pathname: '/booking/seats',
            params: {
              movieId,
              movieTitle,
              posterUrl,
              date:       selectedDate,
              time:       selectedTime,
              scheduleId: selectedSchedId,
            },
          })}
        >
          <LinearGradient colors={canContinue ? [COLORS.teal, '#13c4a3'] : ['#333','#333']} style={styles.continueGrad}>
            <Text style={[styles.continueText, !canContinue && { color: COLORS.textSub }]}>
              {canContinue ? `${selectedDate} · ${selectedTime}  →  Суудал сонгох` : 'Цаг сонгоно уу'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor: COLORS.bg },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: SPACING.lg, paddingTop:60, paddingBottom: SPACING.md },
  backBtn:      { width:38, height:38, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: COLORS.border },
  backText:     { color: COLORS.white, fontSize:18, fontWeight:'700' },
  headerTitle:  { color: COLORS.white, fontSize:16, fontWeight:'700' },
  movieRow:     { flexDirection:'row', gap: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.bgCard, margin: SPACING.lg, borderRadius: RADIUS.md, borderWidth:1, borderColor: COLORS.border },
  miniPoster:   { width:56, height:80, borderRadius: RADIUS.sm },
  movieTitle:   { color: COLORS.white, fontSize:16, fontWeight:'700', marginBottom:4 },
  movieSub:     { color: COLORS.textSub, fontSize:12 },
  section:      { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize:11, fontWeight:'700', letterSpacing:1.5, color: COLORS.teal, marginBottom: SPACING.md },
  daysRow:      { gap: SPACING.sm, paddingRight: SPACING.lg },
  dayCard:      { width:62, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, alignItems:'center', borderWidth:1, borderColor: COLORS.border },
  dayCardSel:   { backgroundColor:'rgba(29,233,182,0.15)', borderColor: COLORS.teal },
  dayShort:     { fontSize:10, fontWeight:'700', color: COLORS.textSub, textTransform:'uppercase', letterSpacing:1 },
  dayShortSel:  { color: COLORS.teal },
  dayNum:       { fontSize:22, fontWeight:'800', color: COLORS.textDim, marginVertical:2 },
  dayNumSel:    { color: COLORS.teal },
  dayMonth:     { fontSize:9, color: COLORS.textSub },
  dayMonthSel:  { color: COLORS.teal },
  emptyWrap:    { padding: SPACING.xl, alignItems:'center' },
  emptyText:    { color: COLORS.textSub, fontSize:14 },
  timesGrid:    { flexDirection:'row', flexWrap:'wrap', gap: SPACING.sm },
  timeCard:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, borderWidth:1, borderColor: COLORS.border, alignItems:'center', minWidth:80 },
  timeCardSel:  { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  timeText:     { fontSize:16, fontWeight:'700', color: COLORS.text, fontVariant:['tabular-nums'] },
  timeTextSel:  { color:'#0f261c' },
  primeBadge:   { marginTop:3, backgroundColor:'rgba(245,200,66,0.15)', borderRadius: RADIUS.sm, paddingHorizontal:6, paddingVertical:1 },
  primeText:    { fontSize:9, color: COLORS.gold, fontWeight:'700' },
  footer:       { position:'absolute', bottom:0, left:0, right:0, padding: SPACING.lg, backgroundColor: COLORS.bg, borderTopWidth:1, borderTopColor: COLORS.border },
  continueBtn:  { borderRadius: RADIUS.md, overflow:'hidden' },
  continueGrad: { padding: SPACING.md, alignItems:'center' },
  continueText: { color:'#0f261c', fontWeight:'800', fontSize:15 },
});
