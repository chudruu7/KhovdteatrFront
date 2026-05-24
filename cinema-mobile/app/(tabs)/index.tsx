import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const SPOTLIGHT_HEIGHT = H * 0.70;
const POSTER_W = 150;
const POSTER_H = 220;
const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';

const getPoster = (movie: any) => movie?.posterUrl || movie?.poster || FALLBACK;
const getGenres = (movie: any): string[] => {
  if (!movie?.genre) return [];
  return Array.isArray(movie.genre) ? movie.genre.filter(Boolean).map(String) : [String(movie.genre)];
};

// Premium Vertical Poster Tile
function NowPlayingTile({
  item,
  active,
  onPress,
  styles,
  colors,
}: {
  item: any;
  active?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.posterTile, active && styles.posterTileActive]}>
      <Image source={{ uri: getPoster(item) }} style={styles.posterImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(10,10,14,0.95)']} style={styles.posterShade} />
      <View style={styles.posterInfo}>
        <Text style={styles.posterTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      {active && (
        <View style={styles.activeIndicator}>
          <Ionicons name="play" size={10} color={colors.bg} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Minimalist Luxury Coming Soon Row
function ComingSoonRow({
  item,
  onPress,
  styles,
  colors,
}: {
  item: any;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.85} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.comingGenre} numberOfLines={1}>
          {getGenres(item).join(' • ') || 'Кино Урлаг'}
        </Text>
        <View style={styles.comingBadge}>
          <Text style={styles.comingBadgeText}>УДАХГҮЙ</Text>
        </View>
      </View>
      <View style={styles.comingArrow}>
        <Ionicons name="arrow-forward-outline" size={18} color={colors.textDim} />
      </View>
    </TouchableOpacity>
  );
}

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isLight } = useTheme();
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);
  const [movies, setMovies] = useState<any[]>([]);
  const [comingSoon, setComingSoon] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
  const heroGenres = getGenres(heroMovie).slice(0, 2);
  const avatarUrl = user?.avatarUrl || user?.avatar;

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loaderText}>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  if (!heroMovie) {
    return (
      <View style={styles.loaderFull}>
        <Ionicons name="film-outline" size={40} color={colors.textDim} />
        <Text style={styles.emptyTitle}>Кино олдсонгүй</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        
        {/* CINEMATIC SPOTLIGHT HERO */}
        <View style={styles.spotlightContainer}>
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.spotlightBackdrop} resizeMode="cover" />
          <LinearGradient
            colors={isLight
              ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.30)', colors.bg]
              : ['rgba(10,10,14,0.1)', 'rgba(10,10,14,0.6)', colors.bg]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating Luxury Header */}
          <View style={styles.floatingHeader}>
            <View style={styles.brandContainer}>
              <Text style={styles.brandSub}>ХОВД АЙМГИЙН</Text>
              <Text style={styles.brandMain}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
            </View>
            <TouchableOpacity style={styles.avatarWrapper} activeOpacity={0.8} onPress={() => router.push('/(tabs)/profile')}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-outline" size={16} color={colors.white} />}
            </TouchableOpacity>
          </View>

          {/* Bottom Info inside Spotlight */}
          <View style={styles.spotlightContent}>
            <View style={styles.tagLine}>
              <View style={styles.goldDot} />
              <Text style={styles.tagText}>САНАЛ БОЛГОЖ БУЙ КИНО</Text>
            </View>
            
            <Text style={styles.spotlightTitle} numberOfLines={2}>{heroMovie.title}</Text>
            
            <View style={styles.metaContainer}>
              {heroMovie.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {heroMovie.rating}</Text>
                </View>
              )}
              {heroMovie.duration && <Text style={styles.metaInfoText}>{heroMovie.duration}</Text>}
              {heroMovie.ageRating && <Text style={styles.metaInfoText}>•  {heroMovie.ageRating}</Text>}
            </View>

            <View style={styles.genresContainer}>
              {heroGenres.map((genre) => (
                <Text key={genre} style={styles.genreLink}>#{genre}</Text>
              ))}
            </View>

            {/* Premium CTA Button */}
            <TouchableOpacity 
              style={styles.primaryCTA} 
              activeOpacity={0.9} 
              onPress={() => router.push(`/movie/${heroMovie._id || heroMovie.id}`)}
            >
              <Ionicons name="ticket-outline" size={20} color={colors.bg} />
              <Text style={styles.primaryCTAText}>Суудал захиалах</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 1: NOW SHOWING CAROUSEL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleLine}>
              <Text style={styles.sectionTitle}>Дэлгэцнээ гарч буй</Text>
              <Text style={styles.sectionCount}>{movies.length} кино</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Үзэх киногоо сонгоод Spotlight-д тоглуулаарай</Text>
          </View>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={movies}
            keyExtractor={(item, index) => item._id || item.id || `${item.title}-${index}`}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={POSTER_W + 16}
            decelerationRate="fast"
            renderItem={({ item, index }) => (
              <NowPlayingTile
                item={item}
                active={index === activeIndex}
                onPress={() => setActiveIndex(index)}
                styles={styles}
                colors={colors}
              />
            )}
          />
        </View>

        {/* SECTION 2: COMING SOON LIST */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Тун удахгүй</Text>
            <Text style={styles.sectionSubtitle}>Тун бэлтгэгдэж буй шинэ бүтээлүүд</Text>
          </View>
          
          <View style={styles.comingList}>
            {comingSoon.slice(0, 5).map((item) => (
              <ComingSoonRow 
                key={item._id || item.id || item.title} 
                item={item} 
                onPress={() => router.push(`/movie/${item._id || item.id}`)} 
                styles={styles}
                colors={colors}
              />
            ))}
          </View>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loaderFull: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 4 },
  emptyTitle: { color: colors.textDim, marginTop: 8, fontSize: 14 },
  
  // Spotlight Styles
  spotlightContainer: {
    height: SPOTLIGHT_HEIGHT,
    justifyContent: 'space-between',
  },
  spotlightBackdrop: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: SPOTLIGHT_HEIGHT,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    zIndex: 10,
  },
  brandContainer: { flex: 1 },
  brandSub: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  brandMain: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  
  spotlightContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  tagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  goldDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold },
  tagText: { color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  spotlightTitle: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  ratingBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: { color: colors.bg, fontSize: 11, fontWeight: '800' },
  metaInfoText: { color: colors.textSub, fontSize: 13, fontWeight: '500' },
  genresContainer: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 24 },
  genreLink: { color: colors.textDim, fontSize: 13, fontWeight: '500' },
  
  primaryCTA: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.white,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryCTAText: { color: colors.bg, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  // Sections Common
  section: { paddingTop: 36 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 18 },
  titleLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sectionCount: { color: colors.gold, fontSize: 12, fontWeight: '600' },
  sectionSubtitle: { color: colors.textDim, fontSize: 13, marginTop: 4, fontWeight: '400' },

  // Now Playing Carousel
  carouselContainer: { paddingLeft: 24, paddingRight: 8, gap: 16 },
  posterTile: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  posterTileActive: {
    borderColor: colors.gold,
    transform: [{ scale: 1.02 }],
  },
  posterImage: { width: '100%', height: '100%' },
  posterShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  posterInfo: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  posterTitle: { color: colors.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  activeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Coming Soon Rows
  comingList: { paddingHorizontal: 24, gap: 14 },
  comingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    gap: 14,
  },
  comingImg: { width: 60, height: 80, borderRadius: 10 },
  comingInfo: { flex: 1, justifyContent: 'center' },
  comingTitle: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  comingGenre: { color: colors.textDim, fontSize: 12, marginTop: 4, marginBottom: 8 },
  comingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(197,168,128,0.12)',
    borderRadius: 4,
  },
  comingBadgeText: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  comingArrow: { paddingRight: 6 },
});
