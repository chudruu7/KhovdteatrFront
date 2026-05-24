import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Dimensions, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scheduleAPI } from '../../api';
import { COLORS, SPACING, RADIUS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isFutureShowTime } from '../../utils/showtime';

const { width } = Dimensions.get('window');
const SHORT = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const MONGOLIA_OFFSET = 8 * 60 * 60 * 1000;

// Цаг форматыг илүү найдвартай болгох
function utcToMN(iso: string) {
  if (!iso) return '--:--';
  const d = new Date(new Date(iso).getTime() + MONGOLIA_OFFSET);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// Долоо хоногийн өдрүүдийг үүсгэх
function getWeekDays() {
  return Array.from({ length: 14 }, (_, i) => { // 7 биш 14 хоног харуулбал илүү сайн
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      fullDate: d.toISOString().split('T')[0],
      short: SHORT[d.getDay()],
      num: d.getDate(),
      isToday: i === 0
    };
  });
}

const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80';

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors, isLight } = useTheme();
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);
  const days = useMemo(() => getWeekDays(), []);
  
  const [selDate, setSelDate] = useState(days[0].fullDate);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await scheduleAPI.getByDate(selDate);
      const list = Array.isArray(data) ? data : [];
      setSchedules(
        list
          .filter((schedule: any) => isFutureShowTime(schedule?.showTime))
          .sort((a: any, b: any) =>
            new Date(a.showTime).getTime() - new Date(b.showTime).getTime()
          )
      );
    } catch (error) {
      console.error(error);
      setSchedules([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Хуваарь</Text>
        <Text style={styles.headerSub}>Өдрөө сонгож тасалбараа захиалаарай</Text>
      </View>

      {/* Өдөр сонгох - Илүү Premium харагдац */}
      <View style={styles.daysContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {days.map(d => {
            const sel = selDate === d.fullDate;
            return (
              <TouchableOpacity
                key={d.fullDate}
                style={[styles.dayBtn, sel && styles.dayBtnSel]}
                onPress={() => setSelDate(d.fullDate)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayShort, sel && styles.dayShortSel]}>{d.short}</Text>
                <Text style={[styles.dayNum, sel && styles.dayNumSel]}>{d.num}</Text>
                {sel && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.coral} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.coral}
                colors={[colors.coral]}
            />
          }
        >
          {schedules.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-clear-outline" size={40} color={colors.textSub} />
              </View>
              <Text style={styles.emptyText}>Энэ өдөр үзвэрийн хуваарь гараагүй байна</Text>
            </View>
          ) : (
            schedules.map((sched) => {
              const movie = sched.movie || {};
              const time = utcToMN(sched.showTime);
              return (
                <TouchableOpacity
                  key={sched._id}
                  style={styles.schedCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: '/movie/[id]',
                      params: { id: movie._id || movie.id || sched.movieId },
                    })
                  }
                >
                  <Image
                    source={{ uri: movie.posterUrl || movie.poster || FALLBACK }}
                    style={styles.poster}
                  />
                  
                  <View style={styles.info}>
                    <Text style={styles.movieTitle} numberOfLines={1}>
                      {movie.title || 'Нэр тодорхойгүй'}
                    </Text>

                    <View style={styles.tagsRow}>
                        <View style={styles.timeTag}>
                            <Ionicons name="time" size={14} color="#fff" />
                            <Text style={styles.timeText}>{time}</Text>
                        </View>
                        <View style={styles.hallTag}>
                            <Text style={styles.hallText}>{sched.hall?.hallName ?? 'Танхим 1'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <Ionicons name="film-outline" size={14} color={colors.textSub} />
                      <Text style={styles.genreText} numberOfLines={1}>
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Кино'}
                      </Text>
                    </View>
                    
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Суудал:</Text>
                        <Text style={styles.priceText}>₮{sched.basePrice?.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.arrowArea}>
                     <Ionicons name="chevron-forward" size={20} color={colors.coral} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 25, paddingTop: 70, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: colors.textSub, marginTop: 4 },
  
  daysContainer: { paddingVertical: 10 },
  daysRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 15 },
  dayBtn: {
    width: 60, height: 80, borderRadius: 20,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  dayBtnSel: { 
    backgroundColor: colors.coral,
    borderColor: colors.coral,
    elevation: 10, shadowColor: colors.coral, shadowRadius: 10, shadowOpacity: 0.3
  },
  dayShort: { fontSize: 11, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase' },
  dayShortSel: { color: '#fff' },
  dayNum: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  dayNumSel: { color: '#fff' },
  activeDot: { position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },
  
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIconCircle: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20 
  },
  emptyText: { color: colors.textSub, fontSize: 15, textAlign: 'center', width: '70%', lineHeight: 22 },

  schedCard: {
    flexDirection: 'row', backgroundColor: colors.bgCard,
    borderRadius: 25, marginBottom: 18,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    height: 140
  },
  poster: { width: 100, height: '100%', resizeMode: 'cover' },
  info: { flex: 1, padding: 18, justifyContent: 'space-between' },
  movieTitle: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  
  tagsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  timeTag: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: colors.coral, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10
  },
  timeText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  hallTag: { backgroundColor: colors.bgElevate, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  hallText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },

  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  genreText: { color: colors.textSub, fontSize: 12, fontWeight: '500' },
  
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  priceLabel: { color: colors.textSub, fontSize: 11 },
  priceText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  arrowArea: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }
});
