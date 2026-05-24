import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CONTACT = {
  name: 'Ховд аймгийн Хөгжимт Драмын Театр',
  address: 'Hovd Theater',
  phone: '+976 7777-2292',
  phoneDial: '+97677772292',
  email: 'khovdthearer1950@gmail.com',
  mapsUrl: 'https://www.google.com/maps/place/Ховд+аймаг',
  mapsQuery: 'Hovd Theater',
};

const quickActions = [
  { key: 'call', label: 'Утсаар холбогдох', icon: 'call-outline' as IoniconsName },
  { key: 'mail', label: 'Имэйл бичих', icon: 'mail-outline' as IoniconsName },
  { key: 'map', label: 'Газрын зураг дээр харах', icon: 'navigate-outline' as IoniconsName },
  { key: 'share', label: 'Хуваалцах', icon: 'share-social-outline' as IoniconsName },
];

export default function ContactScreen() {
  const router = useRouter();
  const { colors, isLight } = useTheme();
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);

  const openUrl = async (url: string, fallbackMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Unsupported URL');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Алдаа', fallbackMessage);
    }
  };

  const handleAction = async (key: string) => {
    if (key === 'call') {
      await openUrl(`tel:${CONTACT.phoneDial}`, 'Утасны дуудлага нээж чадсангүй.');
      return;
    }
    if (key === 'mail') {
      await openUrl(
        `mailto:${CONTACT.email}?subject=${encodeURIComponent('Холбоо барих')}`,
        'Имэйл апп нээж чадсангүй.'
      );
      return;
    }
    if (key === 'map') {
      const url = Platform.select({
        ios: `maps://?q=${encodeURIComponent(CONTACT.mapsQuery)}`,
        android: `geo:0,0?q=${encodeURIComponent(CONTACT.mapsQuery)}`,
        default: CONTACT.mapsUrl,
      }) || CONTACT.mapsUrl;
      await openUrl(url, 'Газрын зураг нээж чадсангүй.');
      return;
    }
    await Share.share({
      message: `${CONTACT.name}\n${CONTACT.address}\nУтас: ${CONTACT.phone}\nИмэйл: ${CONTACT.email}\n${CONTACT.mapsUrl}`,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Холбоо барих</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isLight ? ['#FFFFFF', '#EEF7F5'] : ['#151622', '#0E1717']}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="location-outline" size={18} color={colors.teal} />
            <Text style={styles.heroBadgeText}>Бид хаана вэ?</Text>
          </View>
          <Text style={styles.heroTitle}>{CONTACT.name}</Text>
          <Text style={styles.heroText}>{CONTACT.address}</Text>
        </LinearGradient>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionButton}
              onPress={() => void handleAction(action.key)}
              activeOpacity={0.82}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={21} color={colors.teal} />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Мэдээлэл</Text>
        <View style={styles.infoCard}>
          <ContactRow
            icon="location-outline"
            label="Хаяг"
            value={CONTACT.address}
            colors={colors}
            styles={styles}
          />
          <ContactRow
            icon="call-outline"
            label="Утас"
            value={CONTACT.phone}
            colors={colors}
            styles={styles}
            onPress={() => void handleAction('call')}
          />
          <ContactRow
            icon="mail-outline"
            label="Имэйл"
            value={CONTACT.email}
            colors={colors}
            styles={styles}
            onPress={() => void handleAction('mail')}
          />
        </View>

        <Text style={styles.sectionTitle}>Байршил</Text>
        <TouchableOpacity style={styles.mapCard} activeOpacity={0.86} onPress={() => void handleAction('map')}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 18 }).map((_, index) => (
              <View key={index} style={styles.mapBlock} />
            ))}
          </View>
          <View style={styles.pinWrap}>
            <View style={styles.pin}>
              <Ionicons name="location-sharp" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.pinTitle}>Төв талбайн зүүн талд</Text>
            <Text style={styles.pinSub}>Google Maps дээр зам авах</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gold} />
          <Text style={styles.noticeText}>
            About хуудсан дээрх холбоо барих мэдээлэлтэй ижил эх сурвалжаас харуулж байна.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
  colors,
  styles,
}: {
  icon: IoniconsName;
  label: string;
  value: string;
  onPress?: () => void;
  colors: typeof COLORS;
  styles: ReturnType<typeof createStyles>;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.teal} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textSub} />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.82}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.infoRow}>{content}</View>;
}

const createStyles = (colors: typeof COLORS, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 58,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.white, fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 40 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  hero: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    minHeight: 190,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    backgroundColor: colors.tealDim,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    marginBottom: SPACING.md,
  },
  heroBadgeText: { color: colors.teal, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 25, fontWeight: '900', lineHeight: 31, marginBottom: SPACING.sm },
  heroText: { color: colors.textDim, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionButton: {
    width: '48.7%',
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  sectionTitle: {
    color: isLight ? '#8A8F9A' : 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { color: colors.textSub, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '800', lineHeight: 19 },
  mapCard: {
    height: 230,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: isLight ? 0.42 : 0.26,
  },
  mapBlock: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 0.5,
    borderColor: colors.border2,
    backgroundColor: isLight ? '#EAF1F0' : '#172022',
  },
  pinWrap: { alignItems: 'center', paddingHorizontal: SPACING.lg },
  pin: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: colors.coral,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pinTitle: { color: colors.white, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  pinSub: { color: colors.textSub, fontSize: 12, fontWeight: '700', marginTop: 5 },
  notice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.18)',
    backgroundColor: 'rgba(245,200,66,0.08)',
    padding: SPACING.md,
  },
  noticeText: { color: colors.textDim, fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '600' },
});
