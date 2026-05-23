import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { newsAPI } from '../../api';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80';

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Зарлал',
  news: 'Мэдээ',
  promotion: 'Урамшуулал',
  event: 'Үйл явдал',
};

function str(value: any) {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.title || '';
  return String(value);
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizeNews(data: any): any[] {
  const list = Array.isArray(data) ? data : data?.news || data?.data || [];
  return Array.isArray(list) ? list : [];
}

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchNews = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await newsAPI.getAll({ status: 'published', limit: 30 });
      setNews(normalizeNews(data));
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(news.map((item) => item.category).filter(Boolean).map(String)));
    return ['all', ...values];
  }, [news]);

  const filteredNews = useMemo(() => {
    if (activeCategory === 'all') return news;
    return news.filter((item) => String(item.category) === activeCategory);
  }, [activeCategory, news]);

  const featured = filteredNews[0];
  const rest = filteredNews.slice(1);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E50914" size="large" />
        <Text style={styles.loadingText}>Мэдээ ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.detailContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHero}>
              <Image source={{ uri: str(selected?.image) || FALLBACK }} style={styles.detailImage} />
              <LinearGradient colors={['rgba(0,0,0,0.05)', COLORS.bg]} style={StyleSheet.absoluteFill} />
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailCategory}>{CATEGORY_LABELS[selected?.category] || str(selected?.category) || 'Мэдээ'}</Text>
              <Text style={styles.detailTitle}>{str(selected?.title)}</Text>
              <Text style={styles.detailMeta}>{formatDate(selected?.publishedAt || selected?.createdAt)} · {str(selected?.author) || 'Редакц'}</Text>
              {!!(selected?.excerpt || selected?.summary) && (
                <Text style={styles.detailExcerpt}>{str(selected?.excerpt || selected?.summary)}</Text>
              )}
              <Text style={styles.detailContent}>{str(selected?.content) || 'Дэлгэрэнгүй мэдээлэл удахгүй нэмэгдэнэ.'}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} tintColor="#E50914" />}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Khovd Cinema</Text>
          <Text style={styles.title}>Мэдээ мэдээлэл</Text>
          <Text style={styles.subtitle}>Кино театрын зарлал, шинэчлэл, урамшуулал нэг дор.</Text>
        </View>

        {news.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={58} color="rgba(255,255,255,0.28)" />
            <Text style={styles.emptyTitle}>Одоогоор мэдээ байхгүй</Text>
            <Text style={styles.emptyText}>Нийтлэгдсэн мэдээ гармагц энд харагдана.</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((category) => {
                const active = category === activeCategory;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(category)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {category === 'all' ? 'Бүгд' : CATEGORY_LABELS[category] || category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {featured && (
              <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => setSelected(featured)}>
                <Image source={{ uri: str(featured.image) || FALLBACK }} style={styles.featuredImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.94)']} style={styles.featuredShade} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCategory}>{CATEGORY_LABELS[featured.category] || str(featured.category) || 'Мэдээ'}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{str(featured.title)}</Text>
                  <Text style={styles.featuredExcerpt} numberOfLines={2}>{str(featured.excerpt || featured.summary)}</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.newsList}>
              {rest.map((item) => (
                <TouchableOpacity
                  key={item._id || item.id || item.title}
                  style={styles.newsCard}
                  activeOpacity={0.86}
                  onPress={() => setSelected(item)}
                >
                  <Image source={{ uri: str(item.image) || FALLBACK }} style={styles.newsImage} />
                  <View style={styles.newsInfo}>
                    <View style={styles.newsMetaRow}>
                      <Text style={styles.newsCategory}>{CATEGORY_LABELS[item.category] || str(item.category) || 'Мэдээ'}</Text>
                      <Text style={styles.newsDate}>{formatDate(item.publishedAt || item.createdAt)}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>{str(item.title)}</Text>
                    <Text style={styles.newsExcerpt} numberOfLines={2}>{str(item.excerpt || item.summary)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 104 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textSub, fontSize: 13, fontWeight: '700' },
  header: {
    paddingTop: 62,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  kicker: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 5,
  },
  title: { color: COLORS.white, fontSize: 31, fontWeight: '900', letterSpacing: 0 },
  subtitle: { color: COLORS.textSub, fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 300 },
  categoryRow: { paddingHorizontal: SPACING.lg, gap: 8, paddingBottom: SPACING.md },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: '#E50914', borderColor: '#E50914' },
  categoryText: { color: COLORS.textDim, fontSize: 12, fontWeight: '800' },
  categoryTextActive: { color: '#fff' },
  featuredCard: {
    height: 315,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  featuredInfo: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  featuredCategory: { color: '#E50914', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  featuredTitle: { color: '#fff', fontSize: 25, lineHeight: 29, fontWeight: '900' },
  featuredExcerpt: { color: 'rgba(255,255,255,0.74)', fontSize: 13, lineHeight: 18, marginTop: 8 },
  newsList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  newsCard: {
    flexDirection: 'row',
    minHeight: 122,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  newsImage: { width: 112, minHeight: 122 },
  newsInfo: { flex: 1, padding: SPACING.md },
  newsMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  newsCategory: { color: '#E50914', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  newsDate: { color: COLORS.textSub, fontSize: 10, fontWeight: '700' },
  newsTitle: { color: COLORS.white, fontSize: 16, lineHeight: 20, fontWeight: '900' },
  newsExcerpt: { color: COLORS.textSub, fontSize: 12, lineHeight: 17, marginTop: 6 },
  empty: { alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  emptyTitle: { color: COLORS.white, fontSize: 17, fontWeight: '900', marginTop: 14 },
  emptyText: { color: COLORS.textSub, fontSize: 13, textAlign: 'center', marginTop: 5 },
  detailContainer: { flex: 1, backgroundColor: COLORS.bg },
  detailHero: { height: 310, backgroundColor: COLORS.bgCard },
  detailImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 18,
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { padding: SPACING.lg, marginTop: -24 },
  detailCategory: { color: '#E50914', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  detailTitle: { color: COLORS.white, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  detailMeta: { color: COLORS.textSub, fontSize: 12, marginTop: 10, fontWeight: '700' },
  detailExcerpt: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
    marginTop: SPACING.lg,
    paddingLeft: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#E50914',
  },
  detailContent: { color: COLORS.textDim, fontSize: 14, lineHeight: 24, marginTop: SPACING.lg },
});
