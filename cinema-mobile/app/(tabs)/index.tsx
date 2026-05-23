import { useEffect, useState } from 'react';
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
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const { width: W, height: H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(H * 0.72, 610);
const POSTER_WIDTH = W * 0.29;
const FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80';

const getPoster = (movie: any) => movie?.posterUrl || movie?.poster || FALLBACK;
const getGenres = (movie: any): string[] => {
  if (!movie?.genre) return [];
  return Array.isArray(movie.genre) ? movie.genre.filter(Boolean).map(String) : [String(movie.genre)];
};

function PremiumMovieCard({
  item,
  active,
  onPress,
}: {
  item: any;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.railPosterWrap, active && styles.railPosterWrapActive]}
    >
      <Image source={{ uri: getPoster(item) }} style={styles.railPoster} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.84)']}
        style={styles.railPosterShade}
      />
      <View style={styles.railRankBadge}>
        <Text style={styles.railRankText}>{item?.imdb || item?.rating || '8.0'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ComingSoonRow({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.comingCard} activeOpacity={0.88} onPress={onPress}>
      <Image source={{ uri: getPoster(item) }} style={styles.comingImg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(12,12,16,0.08)', 'rgba(12,12,16,0.96)']}
        style={styles.comingShade}
      />
      <View style={styles.comingInfo}>
        <Text style={styles.comingTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.comingMeta}>
          <Ionicons name="sparkles" size={13} color="#E50914" />
          <Text style={styles.comingMetaText} numberOfLines={1}>
            {getGenres(item)[0] || item.director || 'Coming soon'}
          </Text>
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

  const fetchData = async () => {
    try {
      const [np, cs] = await Promise.all([
        movieAPI.getNowPlaying(),
        movieAPI.getComingSoon(),
      ]);
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

  const visibleMovies = movies;

  const heroMovie = visibleMovies[activeIndex] || visibleMovies[0] || movies[0];
  const heroGenres = getGenres(heroMovie).slice(0, 3);
  const avatarUrl = user?.avatarUrl || user?.avatar;

  if (loading) {
    return (
      <View style={styles.loaderFull}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loaderText}>Loading cinema...</Text>
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
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          <Image source={{ uri: getPoster(heroMovie) }} style={styles.heroBackdrop} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.26)', '#050505']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(5,5,5,0.98)', 'rgba(5,5,5,0.38)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topBar}>
            <View>
              <Text style={styles.netflixMark}>CINEMA+</Text>
              <Text style={styles.welcomeText}>Сайн уу, {user?.name || 'кино сонирхогч'}.</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.86}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.seriesPill}>
              <View style={styles.liveDot} />
              <Text style={styles.seriesPillText}>PREMIUM PICK</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>{heroMovie.title}</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaStrong}>{heroMovie.imdb ? `IMDb ${heroMovie.imdb}` : heroMovie.rating || 'Top rated'}</Text>
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
            <Text style={styles.synopsis} numberOfLines={3}>
              {heroMovie.description || heroMovie.synopsis || 'Танай дараагийн үзэх кино эндээс эхэлнэ.'}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.9}
                onPress={() => router.push(`/movie/${heroMovie._id}`)}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.playButtonText}>Үзэх</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.infoButton}
                activeOpacity={0.86}
                onPress={() => router.push(`/movie/${heroMovie._id}`)}
              >
                <Ionicons name="information-circle-outline" size={21} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Now Showing</Text>
            <Text style={styles.sectionTitle}>Өнөөдрийн онцлох</Text>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={visibleMovies}
            keyExtractor={(item, index) => item._id || item.id || `${item.title}-${index}`}
            contentContainerStyle={styles.railContent}
            renderItem={({ item, index }) => (
              <PremiumMovieCard
                item={item}
                active={item._id === heroMovie._id}
                onPress={() => {
                  setActiveIndex(index);
                }}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Coming Soon</Text>
            <Text style={styles.sectionTitle}>Дараагийн дэлгэцнээ</Text>
          </View>
          <View style={styles.comingGrid}>
            {comingSoon.slice(0, 6).map((item) => (
              <ComingSoonRow
                key={item._id || item.id || item.title}
                item={item}
                onPress={() => router.push(`/movie/${item._id || item.id}`)}
              />
            ))}
          </View>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loaderFull: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  emptyTitle: {
    color: '#fff',
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
  },
  hero: {
    height: HERO_HEIGHT,
    paddingTop: 54,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    width: W,
    height: HERO_HEIGHT + 30,
    opacity: 0.9,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netflixMark: {
    color: '#E50914',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    maxWidth: W * 0.88,
  },
  seriesPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E50914',
  },
  seriesPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 39,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 12,
  },
  metaStrong: {
    color: '#46D369',
    fontSize: 13,
    fontWeight: '900',
  },
  metaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  genreText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '800',
  },
  synopsis: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 13,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  playButton: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E50914',
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  infoButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  section: {
    paddingTop: 12,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionKicker: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  railContent: {
    paddingLeft: 18,
    paddingRight: 6,
    gap: 12,
  },
  railPosterWrap: {
    width: POSTER_WIDTH,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  railPosterWrapActive: {
    borderColor: '#E50914',
    transform: [{ translateY: -4 }],
  },
  railPoster: {
    width: '100%',
    height: '100%',
  },
  railPosterShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  railRankBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  railRankText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  comingGrid: {
    paddingHorizontal: 18,
    gap: 12,
  },
  comingCard: {
    height: 132,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  comingImg: {
    width: '100%',
    height: '100%',
  },
  comingShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  comingInfo: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
  },
  comingTitle: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  comingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  comingMetaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
});
