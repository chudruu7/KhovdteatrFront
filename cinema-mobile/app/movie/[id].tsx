import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getMovieById } from '../../api/movies';
import { getSchedulesByMovie } from '../../api/schedule';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';
const PRICES = {
  standard: { adult: 15000, child: 8000 },
  prime: { adult: 20000, child: 10000 },
};

const getYouTubeId = (url?: string | null) => {
  if (!url) return null;
  const value = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (host.includes('youtube.com')) {
      const direct = parsed.searchParams.get('v');
      if (direct) return direct;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const marker = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
      if (marker >= 0) return parts[marker + 1] || null;
    }
  } catch {
    const match = value.match(/(?:youtu\.be\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  }

  return null;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Өнөөдөр';
  if (date.toDateString() === tomorrow.toDateString()) return 'Маргааш';
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
};

const formatTime = (value?: string) => {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('mn-MN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors, isLight } = useTheme();
  const styles = createStyles(colors, isLight);

  const [movie, setMovie] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);

    Promise.all([
      getMovieById(id).catch(() => null),
      getSchedulesByMovie(id).catch(() => null),
    ])
      .then(([movieRes, scheduleRes]) => {
        if (!mounted) return;
        const movieData = movieRes?.movie ?? movieRes;
        const scheduleList = Array.isArray(scheduleRes)
          ? scheduleRes
          : scheduleRes?.schedules || scheduleRes?.data || [];

        setMovie(movieData);
        setSchedules(scheduleList);
        if (scheduleList.length > 0) setSelectedDate(formatDate(scheduleList[0].showTime));
      })
      .catch(() => Alert.alert('Алдаа', 'Мэдээлэл ачаалахад алдаа гарлаа'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  const groupedSchedules = useMemo(() => {
    return schedules.reduce<Record<string, any[]>>((acc, schedule) => {
      const key = formatDate(schedule?.showTime);
      if (!key) return acc;
      acc[key] = acc[key] || [];
      acc[key].push(schedule);
      return acc;
    }, {});
  }, [schedules]);

  const posterUri = movie?.posterUrl || movie?.poster || FALLBACK;
  const description = movie?.description || movie?.synopsis || 'Киноны талаарх дэлгэрэнгүй мэдээлэл удахгүй...';
  const trailerUrl = movie?.trailerUrl || movie?.trailer || movie?.youtubeUrl || movie?.videoUrl;
  const videoId = useMemo(() => getYouTubeId(trailerUrl), [trailerUrl]);

  const openTrailer = () => {
    if (!videoId) {
      Alert.alert('Уучлаарай', 'Trailer холбоос бүртгэгдээгүй байна.');
      return;
    }
    setPlaying(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={styles.loadingText}>Киноны мэдээлэл ачааллаж байна...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.center}>
        <Ionicons name="film-outline" size={64} color={colors.textSub} />
        <Text style={styles.errorText}>Кино олдсонгүй</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} hidden={playing} />

      <Modal visible={playing} transparent animationType="fade" onRequestClose={() => setPlaying(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeTrailerBtn} onPress={() => setPlaying(false)}>
            <Ionicons name="close-circle" size={44} color="#fff" />
          </TouchableOpacity>
          <View style={styles.videoWrapper}>
            {videoId && (
              <YoutubePlayer
                height={width > height ? height * 0.78 : width * (9 / 16)}
                width={width}
                play={playing}
                videoId={videoId}
                onChangeState={(state: string) => {
                  if (state === 'ended') setPlaying(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.posterSection}>
          <Image source={{ uri: posterUri }} style={styles.poster} />
          <LinearGradient colors={['transparent', isLight ? 'rgba(246,247,251,0.96)' : 'rgba(10,10,15,0.94)']} style={styles.posterGradient} />
          <TouchableOpacity style={styles.playBtn} activeOpacity={0.9} onPress={openTrailer}>
            <LinearGradient colors={[colors.teal, '#0d9488']} style={styles.playBtnGradient}>
              <Ionicons name="play" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{movie.title}</Text>
              <View style={styles.genreContainer}>
                {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).filter(Boolean).map((genre: string) => (
                  <View key={genre} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{movie.rating || 'PG'}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSub} />
              <Text style={styles.metaText}>{movie.duration || 'Тодорхойгүй'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSub} />
              <Text style={styles.metaText}>{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Тодорхойгүй'}</Text>
            </View>
            {movie.language && (
              <View style={styles.metaItem}>
                <Ionicons name="globe-outline" size={16} color={colors.textSub} />
                <Text style={styles.metaText}>{movie.language}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.trailerAction} onPress={openTrailer} activeOpacity={0.86}>
            <Ionicons name="play-circle-outline" size={22} color="#fff" />
            <Text style={styles.trailerActionText}>Trailer үзэх</Text>
          </TouchableOpacity>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Тайлбар</Text>
            <Text style={styles.description} numberOfLines={expanded ? undefined : 4}>{description}</Text>
            {description.length > 150 && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMore}>{expanded ? 'Багасгах' : 'Дэлгэрэнгүй'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {movie.cast?.length > 0 && (
            <View style={styles.castSection}>
              <Text style={styles.sectionTitle}>Жүжигчид</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
                {movie.cast.map((person: any, index: number) => (
                  <View key={`${person.name}-${index}`} style={styles.castCard}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{person.name ? person.name.charAt(0) : '?'}</Text>
                    </View>
                    <View style={styles.castInfo}>
                      <Text style={styles.castName} numberOfLines={1}>{person.name}</Text>
                      <Text style={styles.castRole} numberOfLines={1}>{person.role || 'Жүжигчин'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.showtimeSection}>
            <Text style={styles.sectionTitle}>Үзвэрийн хуваарь</Text>

            {Object.keys(groupedSchedules).length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
                  {Object.keys(groupedSchedules).map((date) => (
                    <TouchableOpacity key={date} onPress={() => setSelectedDate(date)} style={[styles.dateBtn, selectedDate === date && styles.dateBtnActive]}>
                      <Text style={[styles.dateText, selectedDate === date && styles.dateTextActive]}>{date}</Text>
                      <Text style={[styles.dateCount, selectedDate === date && styles.dateCountActive]}>{groupedSchedules[date].length} цаг</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.timeGrid}>
                  {selectedDate && groupedSchedules[selectedDate]?.map((schedule) => {
                    const showTime = formatTime(schedule.showTime);
                    const hour = parseInt(showTime.split(':')[0], 10);
                    const price = hour >= 18 ? PRICES.prime.adult : PRICES.standard.adult;
                    const scheduleId = schedule._id || schedule.id;
                    return (
                      <TouchableOpacity
                        key={scheduleId}
                        style={styles.timeChip}
                        onPress={() => router.push({
                          pathname: '/booking/seats',
                          params: {
                            scheduleId,
                            movieId: id,
                            movieTitle: movie.title,
                            posterUrl: posterUri,
                            date: selectedDate,
                            time: showTime,
                          },
                        })}
                      >
                        <Text style={styles.timeText}>{showTime}</Text>
                        <Text style={styles.hallText}>{schedule.hall?.hallName || schedule.hallName || 'Кино танхим'}</Text>
                        <Text style={styles.priceText}>{price.toLocaleString()}₮</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.noScheduleContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.textSub} />
                <Text style={styles.noSchedule}>Одоогоор үзвэрийн хуваарь байхгүй байна.</Text>
                <Text style={styles.noScheduleSub}>Түр хүлээгээд дахин оролдоно уу</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push({ pathname: '/booking/date', params: { movieId: id } })}>
          <LinearGradient colors={[colors.teal, '#0d9488']} style={styles.bookBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>Тасалбар захиалах</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof COLORS, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: SPACING.md, color: colors.textSub, fontSize: 14 },
  errorText: { marginTop: SPACING.md, color: colors.textSub, fontSize: 16, marginBottom: SPACING.lg },
  backHomeBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.teal, borderRadius: RADIUS.md },
  backHomeText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  videoWrapper: { width: '100%', backgroundColor: 'black' },
  closeTrailerBtn: { position: 'absolute', top: 40, right: 20, zIndex: 100, padding: 10 },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterSection: { width: '100%', height: 500, position: 'relative' },
  poster: { width: '100%', height: '100%', resizeMode: 'cover' },
  posterGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  playBtn: { position: 'absolute', bottom: -30, alignSelf: 'center', zIndex: 20 },
  playBtnGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCard: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.bg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  titleContainer: { flex: 1, marginRight: SPACING.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.white, marginBottom: SPACING.sm },
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  genreTag: { backgroundColor: isLight ? 'rgba(15,159,143,0.1)' : 'rgba(255,255,255,0.1)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm },
  genreText: { color: isLight ? colors.teal : 'rgba(255,255,255,0.7)', fontSize: 11 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgCard, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: colors.border },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.white },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSub, fontSize: 13 },
  trailerAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: colors.coral, paddingVertical: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xl },
  trailerActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  descriptionSection: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: SPACING.md },
  description: { fontSize: 14, color: colors.textDim, lineHeight: 22 },
  readMore: { color: colors.teal, fontSize: 13, fontWeight: '700', marginTop: SPACING.sm },
  castSection: { marginBottom: SPACING.xl },
  castRow: { gap: SPACING.md, paddingRight: SPACING.lg },
  castCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, padding: SPACING.sm, borderRadius: RADIUS.md, width: 160, borderWidth: 1, borderColor: colors.border },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: RADIUS.sm, backgroundColor: colors.bgElevate, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  castInfo: { marginLeft: SPACING.sm, flex: 1 },
  castName: { fontWeight: '700', fontSize: 13, color: colors.white },
  castRole: { fontSize: 11, color: colors.textSub },
  showtimeSection: { marginBottom: SPACING.xl },
  dateStrip: { gap: SPACING.sm, paddingBottom: SPACING.md },
  dateBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dateBtnActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  dateText: { fontWeight: '700', color: colors.textDim, fontSize: 13 },
  dateTextActive: { color: '#fff' },
  dateCount: { fontSize: 10, color: colors.textSub, marginTop: 2 },
  dateCountActive: { color: 'rgba(255,255,255,0.8)' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip: { width: '31%', backgroundColor: colors.bgCard, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  timeText: { fontSize: 15, fontWeight: '800', color: colors.white },
  hallText: { fontSize: 10, color: colors.textSub, marginTop: 2 },
  priceText: { fontSize: 11, color: colors.teal, fontWeight: '700', marginTop: 2 },
  noScheduleContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  noSchedule: { textAlign: 'center', color: colors.textDim, marginTop: SPACING.md, fontSize: 14 },
  noScheduleSub: { textAlign: 'center', color: colors.textSub, marginTop: SPACING.xs, fontSize: 12 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookmarkBtn: { width: 55, height: 55, borderRadius: RADIUS.md, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  bookBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  bookBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 55 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
