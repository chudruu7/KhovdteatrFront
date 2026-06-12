// app/(tabs)/index.tsx
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
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
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const SPOTLIGHT_HEIGHT = H * 0.68;
const POSTER_W = W * 0.40; 
const POSTER_H = POSTER_W * 1.45;
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
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[styles.posterTile, active && styles.posterTileActive]}
    >
      <Image source={{ uri: getPoster(item) }} style={styles.posterImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']} style={styles.posterShade} />
      <View style={styles.posterInfo}>
        <Text style={styles.posterTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      {active && (
        <View style={styles.activeIndicator}>
          <Ionicons name="play" size={11} color={colors.bg} />
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
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.8} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.comingGenre} numberOfLines={1}>
          {getGenres(item).join(' • ') || 'Үзвэр Урлаг'}
        </Text>
        <View style={styles.comingBadge}>
          <Text style={styles.comingBadgeText}>УДАХГҮЙ</Text>
        </View>
      </View>
      <View style={styles.comingArrow}>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </View>
    </TouchableOpacity>
  );
}

function BentoAction({
  icon,
  title,
  subtitle,
  accent,
  wide,
  onPress,
  styles,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  accent: string;
  wide?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity
      style={[styles.bentoCard, wide && styles.bentoCardWide]}
      activeOpacity={0.84}
      onPress={onPress}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.bentoIcon, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.bentoTitle}>{title}</Text>
      <Text style={styles.bentoSubtitle} numberOfLines={2}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function Index() {
  const router = useRouter();
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
      Alert.alert('Алдаа', 'Үзвэрийн мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const heroMovie = movies[activeIndex] || movies[0];
  const heroGenres = getGenres(heroMovie).slice(0, 2);
  const openMovieDetail = (movie: any) => {
    const movieId = movie?._id || movie?.id;
    if (!movieId) return;
    router.push({
      pathname: '/movie/[id]',
      params: { id: String(movieId) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loaderText}>ТҮР ХҮЛЭЭНЭ ҮҮ...</Text>
      </View>
    );
  }

  if (!heroMovie) {
    return (
      <View style={styles.loaderFull}>
        <Ionicons name="film-outline" size={40} color={colors.textDim} />
        <Text style={styles.emptyTitle}>Үзвэр олдсонгүй</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        
        {/* CINEMATIC SPOTLIGHT HERO */}
        <View style={styles.spotlightContainer}>
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.spotlightBackdrop} resizeMode="cover" />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.78)', colors.bg]}
            locations={[0, 0.32, 0.76, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.76)', 'rgba(0,0,0,0)']}
            style={styles.topReadability}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
            style={styles.bottomReadability}
          />

          {/* Floating Luxury Header */}
          <View style={styles.floatingHeader}>
            <View style={styles.brandContainer}>
              <Text style={styles.brandSub}>ХОВД АЙМГИЙН</Text>
              <Text style={styles.brandMain}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
            </View>
            <View style={styles.headerLogoWrapper}>
              <Image source={require('../../assets/kdt.png')} style={styles.headerLogo} resizeMode="contain" />
            </View>
          </View>

          {/* Bottom Info inside Spotlight */}
          <View style={styles.spotlightContent}>
            <View style={styles.tagLine}>
              <View style={styles.goldDot} />
              <Text style={styles.tagText}>САНАЛ БОЛГОЖ БУЙ ҮЗВЭР</Text>
            </View>
            
            <Text style={styles.spotlightTitle} numberOfLines={2}>
              {heroMovie.title}
            </Text>
            
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
              style={[styles.primaryCTA, isLight && { backgroundColor: '#111217' }]} 
              activeOpacity={0.85} 
              onPress={() => router.push(`/movie/${heroMovie._id || heroMovie.id}`)}
            >
              <Ionicons name="ticket" size={20} color={isLight ? '#FFF' : colors.bg} />
              <Text style={[styles.primaryCTAText, isLight && { color: '#FFF' }]}>Суудал захиалах</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BENTO QUICK ACTIONS */}
        <View style={styles.bentoSection}>
          <View style={styles.bentoGrid}>
            <BentoAction
              icon="ticket-outline"
              title="Миний тасалбар"
              subtitle="QR тасалбараа хурдан нээх"
              accent={colors.gold}
              wide
              onPress={() => router.push('/bookings?mode=tickets')}
              styles={styles}
            />
            <BentoAction
              icon="calendar-outline"
              title="Хуваарь"
              subtitle="Өнөөдрийн цагууд"
              accent={colors.gold}
              onPress={() => router.push('/(tabs)/schedule')}
              styles={styles}
            />
            <BentoAction
              icon="newspaper-outline"
              title="Мэдээ"
              subtitle="Зарлал, урамшуулал"
              accent={colors.gold}
              onPress={() => router.push('/(tabs)/search')}
              styles={styles}
            />
          </View>
        </View>

        {/* SECTION 1: NOW SHOWING CAROUSEL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleLine}>
              <Text style={styles.sectionTitle}>Дэлгэцнээ гарч буй</Text>
              <Text style={styles.sectionCount}>{movies.length} үзвэр</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Үзэх үзвэрээ сонгоод суудлаа захиалаарай</Text>
          </View>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={movies}
            keyExtractor={(item, index) => item._id || item.id || `${item.title}-${index}`}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={POSTER_W + 14}
            decelerationRate="fast"
            renderItem={({ item, index }) => (
              <NowPlayingTile
                item={item}
                active={index === activeIndex}
                onPress={() => {
                  setActiveIndex(index);
                  openMovieDetail(item);
                }}
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
                onPress={() => openMovieDetail(item)} 
                styles={styles}
                colors={colors}
              />
            ))}
          </View>
        </View>
        
        {/* Доод навигацийн бартад хаагдахаас сэргийлсэн зай */}
        <View style={{ height: 100 }} />
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
  loaderText: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 3 },
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
  topReadability: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 170,
  },
  bottomReadability: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 45,
    zIndex: 10,
  },
  brandContainer: { flex: 1 },
  brandSub: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  brandMain: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(197,168,128,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerLogo: { width: 31, height: 31 },
  
  spotlightContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  tagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  goldDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  tagText: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  spotlightTitle: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  ratingBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingText: { color: '#111217', fontSize: 12, fontWeight: '900' },
  metaInfoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
    overflow: 'hidden',
  },
  genresContainer: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 },
  genreLink: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '700' },
  
  primaryCTA: {
    height: 52,
    borderRadius: 16, 
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryCTAText: { color: colors.bg, fontSize: 15, fontWeight: '800' },

  // Bento quick actions
  bentoSection: { paddingHorizontal: 24, marginTop: 10 },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoCard: {
    minHeight: 132,
    width: (W - 60) / 2,
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: isLight ? '#FFFFFF' : colors.bgCard,
    borderWidth: 1,
    borderColor: isLight ? '#E9EDF3' : 'rgba(255,255,255,0.06)',
    justifyContent: 'space-between',
    shadowColor: '#8A93A3',
    shadowOpacity: isLight ? 0.08 : 0,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: isLight ? 2 : 0,
  },
  bentoCardWide: {
    width: W - 48,
    minHeight: 118,
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  bentoTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  bentoSubtitle: { color: colors.textDim, fontSize: 12, lineHeight: 17, marginTop: 4 },

  // Sections Common
  section: { paddingTop: 32 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 14 },
  titleLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionCount: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  sectionSubtitle: { color: colors.textDim, fontSize: 13, marginTop: 4, fontWeight: '400' },

  // Now Playing Carousel
  carouselContainer: { paddingLeft: 24, paddingRight: 10, gap: 14 },
  posterTile: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 20, 
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
  },
  posterTileActive: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  posterImage: { width: '100%', height: '100%' },
  posterShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  posterInfo: { position: 'absolute', left: 10, right: 10, bottom: 12 },
  posterTitle: { color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  activeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Coming Soon Rows
  comingList: { paddingHorizontal: 24, gap: 12 },
  comingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
  },
  comingImg: { width: 64, height: 84, borderRadius: 12 },
  comingInfo: { flex: 1, justifyContent: 'center' },
  comingTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  comingGenre: { color: colors.textDim, fontSize: 12, marginTop: 4, marginBottom: 8 },
  comingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: isLight ? 'rgba(197,168,128,0.15)' : 'rgba(197,168,128,0.08)',
    borderRadius: 6,
  },
  comingBadgeText: { color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  comingArrow: { paddingRight: 4 },
});

