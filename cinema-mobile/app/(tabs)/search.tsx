import { useEffect, useMemo, useState, useCallback } from 'react';
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
import { RADIUS, SPACING, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80';

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Зарлал',
  news: 'Мэдээ',
  promotion: 'Урамшуулал',
  event: 'Үйл явдал',
};

function str(value: any): string {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.title || '';
  return String(value);
}

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizeNews(data: any): any[] {
  const list = Array.isArray(data) ? data : data?.news || data?.data || [];
  return Array.isArray(list) ? list : [];
}

interface ContentBlock {
  id: string;
  type: string;
  value: string;
  caption?: string;
}

function normalizeContent(value: any): ContentBlock[] {
  if (!value) return [];
  const source = typeof value === 'string'
    ? (() => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [{ type: 'text', value }];
        } catch {
          return [{ type: 'text', value }];
        }
      })()
    : Array.isArray(value)
      ? value
      : [{ type: 'text', value: str(value) }];

  return source
    .map((block: any, index: number) => ({
      id: block?.id || `${block?.type || 'text'}-${index}`,
      type: block?.type || 'text',
      value: str(block?.value ?? block?.text ?? block?.content ?? block),
      caption: str(block?.caption),
    }))
    .filter((block) => block.value);
}

export default function NewsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [news, setNews] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchNews = useCallback(async (refresh = false) => {
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
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(news.map((item) => item.category).filter(Boolean).map(String)));
    return ['all', ...values];
  }, [news]);

  // Гүйцэтгэлийг оновчилж, slice болон filter-ийг нэг дор хийх
  const { featured, rest } = useMemo(() => {
    const filtered = activeCategory === 'all' 
      ? news 
      : news.filter((item) => String(item.category) === activeCategory);
      
    return {
      featured: filtered[0] || null,
      rest: filtered.slice(1),
    };
  }, [activeCategory, news]);

  const selectedBlocks = useMemo(() => {
    return normalizeContent(selected?.content || selected?.body);
  }, [selected]);

  const handleCloseModal = useCallback(() => setSelected(null), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.coral} size="large" />
        <Text style={styles.loadingText}>Мэдээ ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal 
        visible={!!selected} 
        animationType="slide" 
        presentationStyle="pageSheet" // iOS дээр доош шударч хаах боломжтой болгоно
        onRequestClose={handleCloseModal}
      >
        <View style={styles.detailContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHero}>
              <Image 
                source={{ uri: str(selected?.image) || FALLBACK }} 
                style={styles.detailImage} 
                resizeMode="cover"
              />
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent']} style={StyleSheet.absoluteFill} />
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailCategory}>
                {CATEGORY_LABELS[selected?.category] || str(selected?.category) || 'Мэдээ'}
              </Text>
              <Text style={styles.detailTitle}>{str(selected?.title)}</Text>
              <Text style={styles.detailMeta}>
                {formatDate(selected?.publishedAt || selected?.createdAt)} · {str(selected?.author) || 'Редакц'}
              </Text>
              {!!(selected?.excerpt || selected?.summary) && (
                <Text style={styles.detailExcerpt}>{str(selected?.excerpt || selected?.summary)}</Text>
              )}
              {selectedBlocks.length > 0 ? (
                <View style={styles.detailBlocks}>
                  {selectedBlocks.map((block) => {
                    if (block.type === 'image') {
                      return (
                        <View key={block.id} style={styles.detailImageBlock}>
                          <Image source={{ uri: block.value }} style={styles.detailInlineImage} resizeMode="cover" />
                          {!!block.caption && <Text style={styles.detailCaption}>{block.caption}</Text>}
                        </View>
                      );
                    }
                    if (block.type === 'quote') {
                      return <Text key={block.id} style={styles.detailQuote}>{block.value}</Text>;
                    }
                    return <Text key={block.id} style={styles.detailContent}>{block.value}</Text>;
                  })}
                </View>
              ) : (
                <Text style={styles.detailContent}>Дэлгэрэнгүй мэдээлэл удахгүй нэмэгдэнэ.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} tintColor={colors.coral} colors={[colors.coral]} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Ховд аймгийн Хөгжимт Драмын Театр</Text>
          <Text style={styles.title}>Мэдээ мэдээлэл</Text>
          <Text style={styles.subtitle}>Театрын зарлал, шинэчлэл, урамшуулал нэг дор.</Text>
        </View>

        {news.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={58} color={colors.textSub} />
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
                <Image source={{ uri: str(featured.image) || FALLBACK }} style={styles.featuredImage} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.featuredShade} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCategory}>
                    {CATEGORY_LABELS[featured.category] || str(featured.category) || 'Мэдээ'}
                  </Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{str(featured.title)}</Text>
                  <Text style={styles.featuredExcerpt} numberOfLines={2}>{str(featured.excerpt || featured.summary)}</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.newsList}>
              {rest.map((item) => {
                const itemId = item._id || item.id || item.title;
                return (
                  <TouchableOpacity
                    key={itemId}
                    style={styles.newsCard}
                    activeOpacity={0.86}
                    onPress={() => setSelected(item)}
                  >
                    <Image source={{ uri: str(item.image) || FALLBACK }} style={styles.newsImage} resizeMode="cover" />
                    <View style={styles.newsInfo}>
                      <View style={styles.newsMetaRow}>
                        <Text style={styles.newsCategory}>
                          {CATEGORY_LABELS[item.category] || str(item.category) || 'Мэдээ'}
                        </Text>
                        <Text style={styles.newsDate}>{formatDate(item.publishedAt || item.createdAt)}</Text>
                      </View>
                      <Text style={styles.newsTitle} numberOfLines={2}>{str(item.title)}</Text>
                      <Text style={styles.newsExcerpt} numberOfLines={2}>{str(item.excerpt || item.summary)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textSub, fontSize: 13, fontWeight: '700' },
  header: {
    paddingTop: 62,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  kicker: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: { color: colors.white, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textSub, fontSize: 13, lineHeight: 18, marginTop: 6 },
  categoryRow: { paddingHorizontal: SPACING.lg, gap: 8, paddingBottom: SPACING.md },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  categoryText: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  categoryTextActive: { color: '#fff' },
  featuredCard: {
    height: 320,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.lg,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '80%' },
  featuredInfo: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  featuredCategory: { color: colors.coral, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  featuredTitle: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  featuredExcerpt: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginTop: 6 },
  newsList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  newsCard: {
    flexDirection: 'row',
    height: 115,
    borderRadius: RADIUS.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  newsImage: { width: 110, height: '100%' },
  newsInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  newsMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  newsCategory: { color: colors.coral, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  newsDate: { color: colors.textSub, fontSize: 10, fontWeight: '600' },
  newsTitle: { color: colors.white, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  newsExcerpt: { color: colors.textSub, fontSize: 12, lineHeight: 16 },
  empty: { alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '800', marginTop: 14 },
  emptyText: { color: colors.textSub, fontSize: 13, textAlign: 'center', marginTop: 4 },
  detailContainer: { flex: 1, backgroundColor: colors.bg },
  detailHero: { height: 280, backgroundColor: colors.bgCard },
  detailImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 20, // pageSheet үед дээрээс арай бага зай авна
    right: 16,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { padding: SPACING.lg },
  detailCategory: { color: colors.coral, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  detailTitle: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  detailMeta: { color: colors.textSub, fontSize: 12, marginTop: 8, fontWeight: '600' },
  detailExcerpt: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 22,
    marginTop: SPACING.lg,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.coral,
    opacity: 0.9
  },
  detailBlocks: { marginTop: SPACING.lg, gap: SPACING.md },
  detailContent: { color: colors.textDim, fontSize: 14, lineHeight: 22 },
  detailQuote: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.coral,
    opacity: 0.85
  },
  detailImageBlock: { gap: SPACING.xs },
  detailInlineImage: { width: '100%', height: 200, borderRadius: RADIUS.md },
  detailCaption: { color: colors.textSub, fontSize: 11, textAlign: 'center', marginTop: 4 },
});
