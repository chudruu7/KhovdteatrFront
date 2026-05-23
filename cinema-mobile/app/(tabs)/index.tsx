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
const HERO_HEIGHT = Math.min(H * 0.72, 596);
const HERO_CARD_W = W - 36;
const HERO_CARD_H = Math.min(H * 0.46, 404);
const IPTV_CARD_W = Math.min(W * 0.58, 228);
const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';
const SWIPE_THRESHOLD = W * 0.23;

const getPoster = (movie: any) => movie?.posterUrl || movie?.poster || FALLBACK;
const getGenres = (movie: any): string[] => {
  if (!movie?.genre) return [];
  return Array.isArray(movie.genre) ? movie.genre.filter(Boolean).map(String) : [String(movie.genre)];
};

function IptvMovieTile({ item, active, onPress }: { item: any; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} style={[styles.iptvTile, active && styles.iptvTileActive]}>
      <Image source={{ uri: getPoster(item) }} style={styles.iptvImage} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.78)']} style={styles.tileShade} />
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
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.88} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <LinearGradient colors={['rgba(12,12,16,0.08)', 'rgba(12,12,16,0.96)']} style={styles.comingShade} />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.comingMeta}>
          <Ionicons name="sparkles" size={13} color="#F5C842" />
          <Text style={styles.comingMetaText} numberOfLines={1}>{getGenres(item)[0] || item.director || 'Тун удахгүй'}</Text>
        </View>
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
      toValue: { x: direction * W * 1.1, y: 22 },
      duration: 210,
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
        Animated.spring(swipe, { toValue: { x: 0, y: 0 }, friction: 6, tension: 52, useNativeDriver: true }).start();
      },
    }),
    [activeIndex, movies.length]
  );

  const rotate = swipe.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOpacity = swipe.x.interpolate({ inputRange: [20, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = swipe.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <ActivityIndicator size="large" color="#F5C842" />
        <Text style={styles.loaderText}>Кинонууд ачааллаж байна...</Text>
      </View>
    );
  }

  if (!heroMovie) {
    return (
      <View style={styles.loaderFull}>
        <Ionicons name="film-outline" size={52} color="rgba(255,255,255,0.34)" />
        <Text style={styles.emptyTitle}>Кино олдсонгүй</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.hero}>
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.heroBackdrop} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(4,4,7,0.36)', 'rgba(7,7,11,0.82)', '#09090d']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandKicker}>Khovd cinema</Text>
              <Text style={styles.brandTitle} numberOfLines={2}>Ховд аймгийн хөгжимт драмын театр</Text>
              <Text style={styles.welcomeText} numberOfLines={1}>Тавтай морилно уу, {user?.name || 'кино сонирхогч'}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.86} onPress={() => router.push('/(tabs)/profile')}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>

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
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
                locations={[0, 0.46, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.swipeBadge, styles.wantBadge, { opacity: likeOpacity }]}>
                <Text style={styles.swipeBadgeText}>ҮЗНЭ</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeBadge, styles.skipBadge, { opacity: skipOpacity }]}>
                <Text style={styles.swipeBadgeText}>ДАРАА</Text>
              </Animated.View>
              <View style={styles.cardCopy}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>Яг одоо дэлгэцнээ</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{heroMovie.title}</Text>
                <View style={styles.metaLine}>
                  {heroMovie.rating && <Text style={styles.metaStrong}>Ангилал {heroMovie.rating}</Text>}
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

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.roundAction} activeOpacity={0.85} onPress={() => completeSwipe(-1)}>
              <Ionicons name="close" size={25} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ticketButton} activeOpacity={0.9} onPress={() => router.push(`/movie/${heroMovie._id}`)}>
              <Ionicons name="ticket-outline" size={19} color="#11100f" />
              <Text style={styles.ticketButtonText}>Захиалах</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundAction, styles.goldAction]} activeOpacity={0.85} onPress={() => completeSwipe(1)}>
              <Ionicons name="heart" size={23} color="#11100f" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Now showing</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Coming soon</Text>
            <Text style={styles.sectionTitle}>Тун удахгүй</Text>
          </View>
          <View style={styles.comingGrid}>
            {comingSoon.slice(0, 6).map((item) => (
              <ComingSoonRow key={item._id || item.id || item.title} item={item} onPress={() => router.push(`/movie/${item._id || item.id}`)} />
            ))}
          </View>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090d' },
  loaderFull: {
    flex: 1,
    backgroundColor: '#09090d',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: '700', letterSpacing: 0 },
  emptyTitle: { color: '#fff', marginTop: 12, fontSize: 17, fontWeight: '800' },
  hero: {
    height: HERO_HEIGHT,
    paddingTop: 44,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    width: W,
    height: HERO_HEIGHT + 36,
    opacity: 0.34,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(9,9,13,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  brandBlock: { flex: 1, paddingRight: 12 },
  brandKicker: {
    color: '#F5C842',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: 0,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  deckWrap: {
    height: HERO_CARD_H + 18,
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
    backgroundColor: '#15151b',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.44,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  backCard: { transform: [{ scale: 0.94 }, { translateY: 16 }], opacity: 0.45 },
  cardImage: { width: '100%', height: '100%' },
  swipeBadge: {
    position: 'absolute',
    top: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  wantBadge: { left: 22, borderColor: '#1DE9B6', transform: [{ rotate: '-10deg' }] },
  skipBadge: { right: 22, borderColor: '#E8607A', transform: [{ rotate: '10deg' }] },
  swipeBadgeText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cardCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F5C842' },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0 },
  heroTitle: {
    color: '#fff',
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginTop: 10 },
  metaStrong: { color: '#F5C842', fontSize: 12, fontWeight: '900' },
  metaText: { color: 'rgba(255,255,255,0.74)', fontSize: 12, fontWeight: '700' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  genrePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)' },
  genreText: { color: 'rgba(255,255,255,0.84)', fontSize: 11, fontWeight: '800' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
  },
  roundAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  goldAction: { backgroundColor: '#F5C842', borderColor: '#F5C842' },
  ticketButton: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: '#F5C842',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 134,
  },
  ticketButtonText: { color: '#11100f', fontSize: 15, fontWeight: '900' },
  section: { paddingTop: 16 },
  sectionHeader: { paddingHorizontal: 18, marginBottom: 12 },
  sectionKicker: {
    color: '#F5C842',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  iptvContent: { paddingLeft: 18, paddingRight: 8, gap: 12 },
  iptvTile: {
    width: IPTV_CARD_W,
    height: 126,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#15151b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  iptvTileActive: { borderColor: '#F5C842', transform: [{ translateY: -3 }] },
  iptvImage: { width: '100%', height: '100%' },
  tileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '68%' },
  tileInfo: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  tileTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  tileMeta: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  focusBar: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 3, borderRadius: 3, backgroundColor: '#F5C842' },
  comingGrid: { paddingHorizontal: 18, gap: 12 },
  comingCard: {
    height: 132,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#15151b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  comingImg: { width: '100%', height: '100%' },
  comingShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  comingInfo: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  comingTitle: { color: '#fff', fontSize: 17, lineHeight: 21, fontWeight: '900' },
  comingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  comingMetaText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
});
