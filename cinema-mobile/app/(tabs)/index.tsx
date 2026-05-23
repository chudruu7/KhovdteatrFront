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
const HERO_HEIGHT = Math.min(H * 0.74, 620);
const HERO_CARD_W = W * 0.86;
const HERO_CARD_H = HERO_HEIGHT * 0.64;
const POSTER_CARD_W = 140;
const POSTER_CARD_H = 210;
const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';
const SWIPE_THRESHOLD = W * 0.25;

const getPoster = (movie: any) => movie?.posterUrl || movie?.poster || FALLBACK;
const getGenres = (movie: any): string[] => {
  if (!movie?.genre) return [];
  return Array.isArray(movie.genre) ? movie.genre.filter(Boolean).map(String) : [String(movie.genre)];
};

// Шинэчилсэн Premium Кино Тайл (Босоо Постер Хэлбэртэй)
function IptvMovieTile({ item, active, onPress }: { item: any; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.iptvTile, active && styles.iptvTileActive]}>
      <Image source={{ uri: getPoster(item) }} style={styles.iptvImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(11, 11, 15, 0.95)']} style={styles.tileShade} />
      <View style={styles.tileInfo}>
        <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      {active && <View style={styles.focusBar} />}
    </TouchableOpacity>
  );
}

// Шинэчилсэн Coming Soon Жагсаалт (Premium Minimal Row)
function ComingSoonRow({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.comingMeta}>
          <Ionicons name="calendar-outline" size={13} color="#E5A93C" />
          <Text style={styles.comingMetaText} numberOfLines={1}>
            {getGenres(item)[0] || 'Тун удахгүй'}
          </Text>
        </View>
      </View>
      <View style={styles.comingArrow}>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
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
  const heroGenres = getGenres(heroMovie).slice(0, 2);
  const avatarUrl = user?.avatarUrl || user?.avatar;

  const moveToMovie = (direction: number) => {
    if (!movies.length) return;
    setActiveIndex((activeIndex + direction + movies.length) % movies.length);
  };

  const completeSwipe = (direction: number) => {
    Animated.timing(swipe, {
      toValue: { x: direction * W * 1.2, y: 15 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      swipe.setValue({ x: 0, y: 0 });
      moveToMovie(direction > 0 ? 1 : -1);
    });
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: Animated.event([null, { dx: swipe.x, dy: swipe.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) return completeSwipe(1);
        if (gesture.dx < -SWIPE_THRESHOLD) return completeSwipe(-1);
        Animated.spring(swipe, { toValue: { x: 0, y: 0 }, friction: 7, tension: 40, useNativeDriver: true }).start();
      },
    }),
    [activeIndex, movies.length]
  );

  const rotate = swipe.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-8deg', '0deg', '8deg'] });
  const likeOpacity = swipe.x.interpolate({ inputRange: [10, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = swipe.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -10], outputRange: [1, 0], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0F" />
        <ActivityIndicator size="small" color="#E5A93C" />
        <Text style={styles.loaderText}>PREMIUM CINEMA</Text>
      </View>
    );
  }

  if (!heroMovie) {
    return (
      <View style={styles.loaderFull}>
        <Ionicons name="film-outline" size={44} color="rgba(255,255,255,0.2)" />
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
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.heroBackdrop} blurRadius={20} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(11,11,15,0.4)', 'rgba(11,11,15,0.85)', '#0B0B0F']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar / Profile */}
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandKicker}>KHOVD CINEMA</Text>
              <Text style={styles.brandTitle} numberOfLines={1}>Хөгжимт Драмын Театр</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.8} onPress={() => router.push('/(tabs)/profile')}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-outline" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Swiper Deck */}
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
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(11,11,15,0.98)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
              />
              
              {/* Badges */}
              <Animated.View style={[styles.swipeBadge, styles.wantBadge, { opacity: likeOpacity }]}>
                <Text style={styles.swipeBadgeText}>ҮЗНЭ</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeBadge, styles.skipBadge, { opacity: skipOpacity }]}>
                <Text style={styles.swipeBadgeText}>АЛСАХ</Text>
              </Animated.View>

              {/* Card Contents */}
              <View style={styles.cardCopy}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>ГАРЧ БУЙ</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={1}>{heroMovie.title}</Text>
                
                <View style={styles.metaLine}>
                  {heroMovie.rating && <Text style={styles.metaStrong}>★ {heroMovie.rating}</Text>}
                  {heroMovie.duration && <Text style={styles.metaText}>{heroMovie.duration}</Text>}
                  {heroMovie.ageRating && <View style={styles.ageBadge}><Text style={styles.ageText}>{heroMovie.ageRating}</Text></View>}
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

          {/* Action Quick Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.roundAction} activeOpacity={0.8} onPress={() => completeSwipe(-1)}>
              <Ionicons name="close-outline" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ticketButton} activeOpacity={0.9} onPress={() => router.push(`/movie/${heroMovie._id}`)}>
              <Ionicons name="ticket-outline" size={18} color="#0B0B0F" />
              <Text style={styles.ticketButtonText}>Суудал захиалах</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundAction, styles.goldAction]} activeOpacity={0.8} onPress={() => completeSwipe(1)}>
              <Ionicons name="heart" size={22} color="#0B0B0F" />
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
            snapToInterval={POSTER_CARD_W + 14}
            decelerationRate="fast"
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
            {comingSoon.slice(0, 5).map((item) => (
              <ComingSoonRow key={item._id || item.id || item.title} item={item} onPress={() => router.push(`/movie/${item._id || item.id}`)} />
            ))}
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  loaderFull: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loaderText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', letterSpacing: 3 },
  emptyTitle: { color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 14, fontWeight: '500' },
  hero: {
    height: HERO_HEIGHT,
    paddingTop: 54,
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    width: W,
    height: HERO_HEIGHT,
    opacity: 0.4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  brandBlock: { flex: 1 },
  brandKicker: {
    color: '#E5A93C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  deckWrap: {
    height: HERO_CARD_H + 20,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    position: 'absolute',
    width: HERO_CARD_W,
    height: HERO_CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#13131A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  backCard: { transform: [{ scale: 0.93 }, { translateY: -10 }], opacity: 0.35, zIndex: -1 },
  cardImage: { width: '100%', height: '100%' },
  swipeBadge: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  wantBadge: { left: 24, borderColor: '#4ADE80', transform: [{ rotate: '-6deg' }] },
  skipBadge: { right: 24, borderColor: '#F87171', transform: [{ rotate: '6deg' }] },
  swipeBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cardCopy: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    marginBottom: 12,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E5A93C' },
  livePillText: { color: '#E5A93C', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  heroTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  metaStrong: { color: '#E5A93C', fontSize: 13, fontWeight: '700' },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  ageBadge: { paddingHorizontal: 5, paddingVertical: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  ageText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  genreRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  genrePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  genreText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  roundAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  goldAction: { backgroundColor: '#E5A93C', borderColor: '#E5A93C' },
  ticketButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  ticketButtonText: { color: '#0B0B0F', fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  section: { paddingTop: 32 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionKicker: {
    color: '#E5A93C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginTop: 2, letterSpacing: -0.3 },
  iptvContent: { paddingLeft: 24, paddingRight: 12, gap: 14 },
  iptvTile: {
    width: POSTER_CARD_W,
    height: POSTER_CARD_H,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#13131A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iptvTileActive: { borderColor: '#E5A93C' },
  iptvImage: { width: '100%', height: '100%' },
  tileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  tileInfo: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  tileTitle: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  focusBar: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5A93C' },
  comingGrid: { paddingHorizontal: 24, gap: 10 },
  comingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingRight: 16,
  },
  comingImg: { width: 54, height: '100%', borderRadius: 8, marginLeft: 8 },
  comingInfo: { flex: 1, paddingLeft: 14, justifyContent: 'center' },
  comingTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  comingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  comingMetaText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
  comingArrow: { justifyContent: 'center' },
});