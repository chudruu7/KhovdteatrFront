import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { movieAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';

const { width: W, height: H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(H * 0.74, 610);
const HERO_CARD_W = W - 40;
const HERO_CARD_H = Math.min(H * 0.46, 400);
const IPTV_CARD_W = Math.min(W * 0.60, 240);
const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';
const SWIPE_THRESHOLD = W * 0.23;

const getPoster = (movie: any) => movie?.posterUrl || movie?.poster || FALLBACK;
const getGenres = (movie: any): string[] => {
  if (!movie?.genre) return [];
  return Array.isArray(movie.genre) ? movie.genre.filter(Boolean).map(String) : [String(movie.genre)];
};

function IptvMovieTile({ item, active, onPress }: { item: any; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[styles.iptvTile, active && styles.iptvTileActive]}>
      <Image source={{ uri: getPoster(item) }} style={styles.iptvImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(7,7,10,0.95)']} style={styles.tileShade} />
      <View style={styles.tileInfo}>
        <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.tileMeta} numberOfLines={1}>{getGenres(item)[0] || item.duration || 'Кино'}</Text>
      </View>
      {active && <View style={styles.focusBar} />}
    </TouchableOpacity>
  );
}

function ComingSoonRow({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <LinearGradient colors={['rgba(7,7,10,0.1)', 'rgba(7,7,10,0.98)']} style={styles.comingShade} />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.comingMeta}>
          <Ionicons name="calendar-outline" size={13} color="#D4AF37" />
          <Text style={styles.comingMetaText} numberOfLines={1}>{getGenres(item)[0] || item.director || 'Тун удахгүй'}</Text>
        </View>
      </View>
      <View style={styles.comingArrow}>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      </View>
    </TouchableOpacity>
  );
}

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [comingSoon, setComingSoon] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const swipe = useRef(new Animated.ValueXY()).current;

  const fetchData = async () => {
    try {
      const [np, cs] = await Promise.all([movieAPI.getNowPlaying(), movieAPI.getComingSoon()]);
      setMovies(np.nowShowing || np.movies || np.data || []);
      setComingSoon(cs.comingSoon || cs.movies || cs.data || []);
    } catch (e) {
      Alert.alert('Алдаа', 'Киноны мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const heroMovie = movies[activeIndex] || movies[0];
  const nextMovie = movies[(activeIndex + 1) % Math.max(movies.length, 1)];
  const heroGenres = getGenres(heroMovie).slice(0, 3);
  const avatarUrl = user?.avatarUrl || user?.avatar;

  const moveToMovie = (direction: number) => {
    if (!movies.length) return;
    setActiveIndex((activeIndex + direction + movies.length) % movies.length);
  };

  const completeSwipe = (direction: number) => {
    Animated.timing(swipe, {
      toValue: { x: direction * W * 1.15, y: 15 },
      duration: 230,
      useNativeDriver: true,
    }).start(() => {
      swipe.setValue({ x: 0, y: 0 });
      moveToMovie(direction > 0 ? 1 : -1);
    });
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: Animated.event([null, { dx: swipe.x, dy: swipe.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) return completeSwipe(1);
        if (gesture.dx < -SWIPE_THRESHOLD) return completeSwipe(-1);
        Animated.spring(swipe, { toValue: { x: 0, y: 0 }, friction: 7, tension: 45, useNativeDriver: true }).start();
      },
    }),
    [activeIndex, movies.length]
  );

  const rotate = swipe.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-10deg', '0deg', '10deg'] });
  const likeOpacity = swipe.x.interpolate({ inputRange: [20, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = swipe.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle="light-content" backgroundColor="#07070A" />
        <ActivityIndicator size="small" color="#D4AF37" />
        <Text style={styles.loaderText}>C I N E M A</Text>
      </View>
    );
  }

  if (!heroMovie) {
    return (
      <View style={styles.loaderFull}>
        <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyTitle}>Кино олдсонгүй</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.heroBackdrop} blurRadius={15} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(7,7,10,0.2)', 'rgba(7,7,10,0.75)', '#07070A']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandKicker}>KHOVD CINEMA</Text>
              <Text style={styles.brandTitle} numberOfLines={1}>Хөгжимт драмын театр</Text>
              <Text style={styles.welcomeText} numberOfLines={1}>Тавтай морил, {user?.name || 'кино сонирхогч'}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.85} onPress={() => router.push('/(tabs)/profile')}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-outline" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Card Deck */}
          <View style={styles.deckWrap}>
            {nextMovie && nextMovie !== heroMovie && (
              <View style={[styles.heroCard, styles.backCard]}>
                <Image source={{ uri: getPoster(nextMovie) }} style={styles.cardImage} resizeMode="cover" />
              </View>
            )}
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.heroCard, { transform: [{ translateX: swipe.x }, { translateY: swipe.y }, { rotate }] }]}
            >
              <Image source={{ uri: getPoster(heroMovie) }} style={styles.cardImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(7,7,10,0.95)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.swipeBadge, styles.wantBadge, { opacity: likeOpacity }]}>
                <Text style={styles.swipeBadgeText}>ҮЗНЭ</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeBadge, styles.skipBadge, { opacity: skipOpacity }]}>
                <Text style={styles.swipeBadgeText}>АЛСАХ</Text>
              </Animated.View>
              
              <View style={styles.cardCopy}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>ЯГ ОДОО ДЭЛГЭЦНЭЭ</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{heroMovie.title}</Text>
                <View style={styles.metaLine}>
                  {heroMovie.rating && <Text style={styles.metaStrong}>★ {heroMovie.rating}</Text>}
                  {heroMovie.duration && <Text style={styles.metaText}>{heroMovie.duration}</Text>}
                  {heroMovie.ageRating && <Text style={styles.metaText}>{heroMovie.ageRating}</Text>}
                </View>
                <View style={styles.genreRow}>
                  {heroGenres.map((genre) => (
                    <View key={genre} style={styles.genrePill}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.roundAction} activeOpacity={0.85} onPress={() => completeSwipe(-1)}>
              <Ionicons name="close-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ticketButton} activeOpacity={0.9} onPress={() => router.push(`/movie/${heroMovie._id}`)}>
              <Ionicons name="ticket-outline" size={18} color="#07070A" />
              <Text style={styles.ticketButtonText}>Захиалах</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundAction, styles.goldAction]} activeOpacity={0.85} onPress={() => completeSwipe(1)}>
              <Ionicons name="heart" size={22} color="#07070A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 1: NOW SHOWING */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>NOW PLAYING</Text>
            <Text style={styles.sectionTitle}>Дэлгэцнээ гарч буй</Text>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={movies}
            keyExtractor={(item, index) => item._id || item.id || `${item.title}-${index}`}
            contentContainerStyle={styles.iptvContent}
            renderItem={({ item, index }) => (
              <IptvMovieTile
                item={item}
                active={(item._id || item.id) === (heroMovie._id || heroMovie.id)}
                onPress={() => setActiveIndex(index)}
              />
            )}
          />
        </View>

        {/* SECTION 2: COMING SOON */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>COMING SOON</Text>
            <Text style={styles.sectionTitle}>Тун удахгүй</Text>
          </View>
          <View style={styles.comingGrid}>
            {comingSoon.slice(0, 6).map((item) => (
              <ComingSoonRow key={item._id || item.id || item.title} item={item} onPress={() => router.push(`/movie/${item._id || item.id}`)} />
            ))}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070A' },
  loaderFull: {
    flex: 1,
    backgroundColor: '#07070A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  emptyTitle: { color: '#fff', marginTop: 12, fontSize: 15, fontWeight: '600', opacity: 0.8 },
  hero: {
    height: HERO_HEIGHT,
    paddingTop: 50,
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    width: W,
    height: HERO_HEIGHT,
    opacity: 0.35,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  brandBlock: { flex: 1, paddingRight: 12 },
  brandKicker: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  deckWrap: {
    height: HERO_CARD_H + 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    position: 'absolute',
    width: HERO_CARD_W,
    height: HERO_CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 15 },
    elevation: 12,
  },
  backCard: { transform: [{ scale: 0.94 }, { translateY: 12 }], opacity: 0.4, zIndex: -1 },
  cardImage: { width: '100%', height: '100%' },
  swipeBadge: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  wantBadge: { left: 24, borderColor: '#4ADE80', transform: [{ rotate: '-8deg' }] },
  skipBadge: { right: 24, borderColor: '#F87171', transform: [{ rotate: '8deg' }] },
  swipeBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cardCopy: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37' },
  livePillText: { color: '#FFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: {
    color: '#FFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metaStrong: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  genrePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  genreText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  roundAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  goldAction: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  ticketButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ticketButtonText: { color: '#07070A', fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  section: { paddingTop: 24 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionKicker: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  iptvContent: { paddingLeft: 20, paddingRight: 8, gap: 12 },
  iptvTile: {
    width: IPTV_CARD_W,
    height: 126,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iptvTileActive: { borderColor: '#D4AF37', transform: [{ translateY: -2 }] },
  iptvImage: { width: '100%', height: '100%' },
  tileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  tileInfo: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  tileTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  tileMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  focusBar: { position: 'absolute', left: 14, right: 14, bottom: 0, height: 2, borderRadius: 2, backgroundColor: '#D4AF37' },
  comingGrid: { paddingHorizontal: 20, gap: 10 },
  comingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingRight: 16,
  },
  comingImg: { width: 56, height: '100%' },
  comingShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  comingInfo: { flex: 1, paddingLeft: 14, justifyContent: 'center', zIndex: 2 },
  comingTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  comingMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  comingMetaText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
  comingArrow: { justifyContent: 'center', zIndex: 2 },
});