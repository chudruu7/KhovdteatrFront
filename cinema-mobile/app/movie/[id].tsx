// app/movie/[id].tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, Image,
  Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getMovieById } from '../../api/movies';
import { getSchedulesByMovie } from '../../api/schedule';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isFutureShowTime } from '../../utils/showtime';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const POSTER_H  = H * 0.62;
const FALLBACK  = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';
const PRICES    = {
  standard: { adult: 15_000, child: 8_000 },
  prime: { adult: 20_000, child: 10_000 },
};
const MN_OFFSET = 8 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const v = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  try {
    const p = new URL(v), h = p.hostname.replace(/^www\./, '');
    if (h === 'youtu.be') return p.pathname.split('/').filter(Boolean)[0] ?? null;
    if (h.includes('youtube.com')) {
      const id = p.searchParams.get('v');
      if (id) return id;
      const parts = p.pathname.split('/').filter(Boolean);
      const idx   = parts.findIndex(s => ['embed','shorts','live'].includes(s));
      if (idx >= 0) return parts[idx + 1] ?? null;
    }
  } catch {
    const m = v.match(/(?:youtu\.be\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  }
  return null;
};

const formatDate = (value?: string): string => {
  if (!value) return '';
  const ts   = new Date(value).getTime() + MN_OFFSET;
  const date = new Date(ts);
  const now  = new Date(new Date().getTime() + MN_OFFSET);
  const same = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth()    &&
    a.getUTCDate()     === b.getUTCDate();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (same(date, now))      return 'Өнөөдөр';
  if (same(date, tomorrow)) return 'Маргааш';
  const months = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р','9-р','10-р','11-р','12-р'];
  return `${months[date.getUTCMonth()]} сарын ${date.getUTCDate()}`;
};

const formatTime = (value?: string): string => {
  if (!value) return '--:--';
  const d = new Date(new Date(value).getTime() + MN_OFFSET);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
};

// ─── Animated Section Title ───────────────────────────────────────────────────
function SectionHeading({ title, color, delay = 0 }: { title: string; color: string; delay?: number }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.sectionHeadingRow, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.sectionAccent, { backgroundColor: color }]} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </Animated.View>
  );
}

// ─── Cast Card ────────────────────────────────────────────────────────────────
function CastCard({ person, index, colors, isLight }: { person: any; index: number; colors: typeof COLORS; isLight: boolean }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 360, delay: index * 60 + 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay: index * 60 + 400, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.castCard, {
      opacity: fade, transform: [{ scale }],
      backgroundColor: isLight ? '#FFF' : 'rgba(255,255,255,0.04)',
      borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    }]}>
      <View style={[styles.castAvatar, { backgroundColor: isLight ? '#EEF2F7' : 'rgba(255,255,255,0.08)' }]}>
        <Text style={[styles.castAvatarLetter, { color: colors.teal }]}>
          {person?.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={[styles.castName, { color: isLight ? '#111' : '#FFF' }]} numberOfLines={1}>
        {person?.name || '—'}
      </Text>
      <Text style={[styles.castRole, { color: colors.textSub }]} numberOfLines={1}>
        {person?.role || 'Жүжигчин'}
      </Text>
    </Animated.View>
  );
}

// ─── Showtime Chip ────────────────────────────────────────────────────────────
function TimeChip({
  schedule, movieId, movie, posterUri, selectedDate, router, colors, isLight, index,
}: any) {
  const showTime  = formatTime(schedule.showTime);
  const isPrime   = parseInt(showTime.split(':')[0], 10) >= 18;
  const price     = isPrime ? PRICES.prime.adult : PRICES.standard.adult;
  const scheduleId = schedule._id || schedule.id;
  const scale     = useRef(new Animated.Value(1)).current;
  const fade      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();
  const handlePress = () => {
    if (!isFutureShowTime(schedule.showTime)) {
      Alert.alert('Анхааруулга', 'Энэ үзвэрийн цаг өнгөрсөн тул тасалбар захиалах боломжгүй.');
      return;
    }
    router.push({
      pathname: '/booking/seats',
      params: { scheduleId, movieId, movieTitle: movie.title, posterUrl: posterUri, date: selectedDate, time: showTime, showTime: schedule.showTime },
    });
  };

  return (
    <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.timeChip, {
          backgroundColor: isPrime
            ? (isLight ? 'rgba(197,168,128,0.08)' : 'rgba(197,168,128,0.1)')
            : (isLight ? '#FFF' : 'rgba(255,255,255,0.04)'),
          borderColor: isPrime
            ? 'rgba(197,168,128,0.35)'
            : (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'),
        }]}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {isPrime && (
          <View style={styles.primeChipBadge}>
            <Text style={styles.primeChipText}>PRIME</Text>
          </View>
        )}
        <Text style={[styles.timeChipTime, { color: isLight ? '#111' : '#FFF' }]}>{showTime}</Text>
        <Text style={[styles.timeChipHall, { color: colors.textSub }]} numberOfLines={1}>
          {schedule.hall?.hallName || schedule.hallName || 'Кино танхим'}
        </Text>
        <Text style={[styles.timeChipPrice, { color: isPrime ? '#C5A880' : colors.teal }]}>
          {price.toLocaleString()}₮
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MovieDetailScreen() {
  const { id }             = useLocalSearchParams<{ id: string }>();
  const router             = useRouter();
  const { colors, isLight } = useTheme();

  const [movie, setMovie]               = useState<any | null>(null);
  const [schedules, setSchedules]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [playing, setPlaying]           = useState(false);
  const [expanded, setExpanded]         = useState(false);

  // Entrance animations
  const posterFade   = useRef(new Animated.Value(0)).current;
  const infoSlide    = useRef(new Animated.Value(40)).current;
  const infoFade     = useRef(new Animated.Value(0)).current;
  const playBtnScale = useRef(new Animated.Value(0)).current;
  const backBtnFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      getMovieById(id).catch(() => null),
      getSchedulesByMovie(id).catch(() => null),
    ]).then(([movieRes, scheduleRes]) => {
      if (!mounted) return;
      const movieData = movieRes?.movie ?? movieRes;
      const list: any[] = (Array.isArray(scheduleRes)
        ? scheduleRes
        : scheduleRes?.schedules ?? scheduleRes?.data ?? [])
        .filter((schedule: any) => isFutureShowTime(schedule?.showTime))
        .sort((a: any, b: any) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());
      setMovie(movieData);
      setSchedules(list);
      if (list.length > 0) setSelectedDate(formatDate(list[0].showTime));
    }).catch(() => {
      if (mounted) Alert.alert('Алдаа', 'Мэдээлэл ачаалахад алдаа гарлаа');
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  // Run entrance animation after load
  useEffect(() => {
    if (!loading && movie) {
      Animated.stagger(80, [
        Animated.timing(backBtnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(posterFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.parallel([
          Animated.timing(infoFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(infoSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [loading, movie]);

  const groupedSchedules = useMemo(() =>
    schedules.reduce<Record<string, any[]>>((acc, s) => {
      const key = formatDate(s?.showTime);
      if (!key) return acc;
      (acc[key] ??= []).push(s);
      return acc;
    }, {}),
  [schedules]);

  const posterUri  = movie?.posterUrl || movie?.poster || FALLBACK;
  const description = movie?.description || movie?.synopsis || 'Киноны тайлбар удахгүй нэмэгдэнэ…';
  const trailerUrl = movie?.trailerUrl || movie?.trailer || movie?.youtubeUrl || movie?.videoUrl;
  const videoId    = useMemo(() => getYouTubeId(trailerUrl), [trailerUrl]);
  const genres: string[] = (Array.isArray(movie?.genre) ? movie.genre : [movie?.genre]).filter(Boolean);

  const openTrailer = () => {
    if (!videoId) { Alert.alert('Уучлаарай', 'Trailer холбоос бүртгэгдээгүй байна.'); return; }
    setPlaying(true);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isLight ? '#F5F5F7' : '#0A0A0E' }]}>
        <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSub }]}>Уншиж байна…</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.center, { backgroundColor: isLight ? '#F5F5F7' : '#0A0A0E' }]}>
        <Ionicons name="film-outline" size={52} color={colors.textSub} />
        <Text style={[styles.errorText, { color: colors.textSub }]}>Кино олдсонгүй</Text>
        <TouchableOpacity style={[styles.backHomeBtn, { backgroundColor: colors.teal }]} onPress={() => router.back()}>
          <Text style={styles.backHomeTxt}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#F5F5F7' : '#0A0A0E' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" hidden={playing} />

      {/* ── Trailer Modal ── */}
      <Modal visible={playing} transparent animationType="fade" onRequestClose={() => setPlaying(false)} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeTrailerBtn} onPress={() => setPlaying(false)} hitSlop={12}>
            <Ionicons name="close-circle" size={42} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.videoWrapper}>
            {videoId && (
              <YoutubePlayer
                height={W * (9 / 16)}
                width={W}
                play={playing}
                videoId={videoId}
                onChangeState={(s: string) => { if (s === 'ended') setPlaying(false); }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Floating back button ── */}
      <Animated.View style={[styles.backBtn, { opacity: backBtnFade }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} activeOpacity={0.8}>
          <View style={styles.backBtnInner}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── CINEMATIC POSTER HERO ── */}
        <View style={styles.posterSection}>
          <Animated.Image
            source={{ uri: posterUri }}
            style={[styles.poster, { opacity: posterFade }]}
            resizeMode="cover"
          />

          {/* Multi-layer gradient for cinematic depth */}
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', isLight ? 'rgba(245,245,247,1)' : 'rgba(10,10,14,1)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Side vignette */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Trailer play button */}
          <Animated.View style={[styles.playBtnWrap, { transform: [{ scale: playBtnScale }] }]}>
            <TouchableOpacity onPress={openTrailer} activeOpacity={0.88}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
                style={styles.playBtn}
              >
                <View style={styles.playBtnInner}>
                  <Ionicons name="play" size={28} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.trailerLabel}>TRAILER</Text>
          </Animated.View>

          {/* Hero text overlay at bottom of poster */}
          <View style={styles.posterOverlayContent}>
            <View style={styles.genresRow}>
              {genres.map(g => (
                <View key={g} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{g}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
            <View style={styles.heroMeta}>
              {movie.rating && (
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={11} color="#0A0A0E" />
                  <Text style={styles.starText}>{movie.rating}</Text>
                </View>
              )}
              {movie.duration && <Text style={styles.heroMetaText}>{movie.duration}</Text>}
              {movie.ageRating && <Text style={styles.heroMetaText}>· {movie.ageRating}</Text>}
              {movie.releaseDate && (
                <Text style={styles.heroMetaText}>· {new Date(movie.releaseDate).getFullYear()}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── INFO CARD ── */}
        <Animated.View style={[
          styles.infoCard,
          {
            backgroundColor: isLight ? '#F5F5F7' : '#0A0A0E',
            opacity: infoFade,
            transform: [{ translateY: infoSlide }],
          },
        ]}>

          {/* Meta chips row */}
          <View style={styles.metaChipsRow}>
            {movie.language && (
              <View style={[styles.metaChip, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="globe-outline" size={13} color={colors.textSub} />
                <Text style={[styles.metaChipText, { color: colors.textSub }]}>{movie.language}</Text>
              </View>
            )}
            <View style={[styles.metaChip, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name="time-outline" size={13} color={colors.textSub} />
              <Text style={[styles.metaChipText, { color: colors.textSub }]}>{movie.duration || 'Тодорхойгүй'}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: isLight ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.1)', borderColor: 'rgba(20,184,166,0.25)' }]}>
              <Ionicons name="film-outline" size={13} color={colors.teal} />
              <Text style={[styles.metaChipText, { color: colors.teal }]}>HD Чанар</Text>
            </View>
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <SectionHeading title="Тайлбар" color={isLight ? '#333' : '#FFF'} delay={200} />
            <Text style={[styles.description, { color: colors.textDim }]} numberOfLines={expanded ? undefined : 4}>
              {description}
            </Text>
            {description.length > 150 && (
              <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.readMoreBtn}>
                <Text style={[styles.readMoreText, { color: colors.teal }]}>
                  {expanded ? '↑ Багасгах' : '↓ Дэлгэрэнгүй'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Cast ── */}
          {Array.isArray(movie.cast) && movie.cast.length > 0 && (
            <View style={styles.section}>
              <SectionHeading title="Жүжигчид" color={isLight ? '#333' : '#FFF'} delay={280} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
                {movie.cast.map((person: any, i: number) => (
                  <CastCard
                    key={`${person?.name ?? 'cast'}-${i}`}
                    person={person}
                    index={i}
                    colors={colors}
                    isLight={isLight}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Showtimes ── */}
          <View style={styles.section}>
            <SectionHeading title="Үзвэрийн хуваарь" color={isLight ? '#333' : '#FFF'} delay={360} />

            {Object.keys(groupedSchedules).length > 0 ? (
              <>
                {/* Date selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
                  {Object.keys(groupedSchedules).map(dateKey => {
                    const isActive = selectedDate === dateKey;
                    return (
                      <TouchableOpacity
                        key={dateKey}
                        onPress={() => setSelectedDate(dateKey)}
                        activeOpacity={0.8}
                        style={[
                          styles.dateBtn,
                          {
                            backgroundColor: isActive
                              ? colors.teal
                              : (isLight ? '#FFF' : 'rgba(255,255,255,0.04)'),
                            borderColor: isActive
                              ? colors.teal
                              : (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'),
                          },
                        ]}
                      >
                        <Text style={[styles.dateBtnText, { color: isActive ? '#0A0A0E' : (isLight ? '#555' : 'rgba(255,255,255,0.6)') }]}>
                          {dateKey}
                        </Text>
                        <Text style={[styles.dateBtnCount, { color: isActive ? 'rgba(10,10,14,0.6)' : colors.textSub }]}>
                          {groupedSchedules[dateKey].length} цаг
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Time chips grid */}
                <View style={styles.timeGrid}>
                  {(groupedSchedules[selectedDate] ?? []).map((s: any, i: number) => (
                    <TimeChip
                      key={s._id || s.id || i}
                      schedule={s}
                      index={i}
                      movieId={id}
                      movie={movie}
                      posterUri={posterUri}
                      selectedDate={selectedDate}
                      router={router}
                      colors={colors}
                      isLight={isLight}
                    />
                  ))}
                </View>

              </>
            ) : (
              <View style={styles.noSchedule}>
                <Ionicons name="calendar-outline" size={42} color={colors.textSub} />
                <Text style={[styles.noScheduleText, { color: colors.textDim }]}>
                  Одоогоор хуваарь байхгүй байна
                </Text>
                <Text style={[styles.noScheduleSub, { color: colors.textSub }]}>
                  Түр хүлээгээд дахин оролдоно уу
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ── FOOTER CTA ── */}
      <View style={[styles.footer, {
        backgroundColor: isLight ? 'rgba(245,245,247,0.96)' : 'rgba(10,10,14,0.96)',
        borderTopColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)',
      }]}>
        <TouchableOpacity style={[styles.bookmarkBtn, {
          backgroundColor: isLight ? '#FFF' : 'rgba(255,255,255,0.05)',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        }]}>
          <Ionicons name="bookmark-outline" size={20} color={isLight ? '#333' : 'rgba(255,255,255,0.7)'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => {
            if (schedules.length === 0) {
              Alert.alert('Анхааруулга', 'Захиалах боломжтой үзвэр алга байна.');
              return;
            }
            router.push({ pathname: '/booking/date', params: { movieId: id, movieTitle: movie.title, posterUrl: posterUri } });
          }}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#1ECFBD', '#0D9488', '#0A7A6E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Ionicons name="ticket-outline" size={18} color="#0A0A0E" />
            <Text style={styles.bookBtnText}>Тасалбар захиалах</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '500' },
  errorText:  { fontSize: 15, marginTop: 8 },
  backHomeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  backHomeTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', alignItems: 'center' },
  videoWrapper:    { width: '100%' },
  closeTrailerBtn: { position: 'absolute', top: 44, right: 18, zIndex: 100 },

  // Back button
  backBtn:      { position: 'absolute', top: 50, left: 18, zIndex: 20 },
  backBtnInner: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Poster hero
  posterSection: { width: W, height: POSTER_H, position: 'relative' },
  poster:        { width: W, height: POSTER_H, position: 'absolute' },

  // Play button
  playBtnWrap: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  playBtnInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  trailerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9, fontWeight: '800', letterSpacing: 2.5,
  },

  // Hero overlay text
  posterOverlayContent: {
    position: 'absolute', bottom: 24,
    left: 20, right: 20,
  },
  genresRow:     { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  genrePill:     {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  genrePillText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  heroTitle:     {
    color: '#FFF', fontSize: 28,
    fontWeight: '900', letterSpacing: -0.8,
    lineHeight: 33, marginBottom: 10,
  },
  heroMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starBadge:     {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#C5A880',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  starText:      { color: '#0A0A0E', fontSize: 11, fontWeight: '800' },
  heroMetaText:  { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

  // Info card
  infoCard: { marginTop: -4, paddingHorizontal: 20, paddingTop: 20 },

  // Meta chips
  metaChipsRow:  { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  metaChip:      {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  metaChipText:  { fontSize: 12, fontWeight: '600' },

  // Section
  section: { marginBottom: 28 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle:  { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  description:   { fontSize: 14, lineHeight: 22 },
  readMoreBtn:   { marginTop: 8 },
  readMoreText:  { fontSize: 13, fontWeight: '700' },

  // Cast
  castRow:       { gap: 10, paddingRight: 4 },
  castCard:      {
    width: 90, alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    padding: 12, gap: 6,
  },
  castAvatar:    {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  castAvatarLetter: { fontSize: 20, fontWeight: '800' },
  castName:      { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  castRole:      { fontSize: 10, textAlign: 'center' },

  // Date strip
  dateStrip:     { gap: 8, paddingBottom: 16, paddingRight: 4 },
  dateBtn:       {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', minWidth: 88,
  },
  dateBtnText:   { fontSize: 13, fontWeight: '700' },
  dateBtnCount:  { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Time grid
  timeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip:      {
    width: (W - 40 - 20) / 3,
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 8,
    alignItems: 'center', position: 'relative',
    overflow: 'hidden',
  },
  primeChipBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#C5A880',
    paddingHorizontal: 5, paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  primeChipText:  { color: '#0A0A0E', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  timeChipTime:   { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  timeChipHall:   { fontSize: 9, marginTop: 2, textAlign: 'center' },
  timeChipPrice:  { fontSize: 11, fontWeight: '700', marginTop: 4 },

  // Legend
  legend:        { flexDirection: 'row', gap: 16, marginTop: 14 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 7, height: 7, borderRadius: 3.5 },
  legendText:    { fontSize: 11, fontWeight: '500' },

  // No schedule
  noSchedule:    { alignItems: 'center', paddingVertical: 36, gap: 8 },
  noScheduleText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  noScheduleSub:  { fontSize: 12, textAlign: 'center' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  bookmarkBtn: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  bookBtn:         { flex: 1, borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: {
    height: 52, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  bookBtnText: { color: '#0A0A0E', fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
});
