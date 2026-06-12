import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Share, Alert, Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingAPI } from '../../api';

const { width: W } = Dimensions.get('window');
const TICKET_QR_SIZE = Math.min(280, Math.max(240, W - 80));
const BOOKING_CACHE_KEY = 'kdt_cached_bookings';

// ─── Мөнгөн дүн форматлах ───────────────────────────────────────────────────────
const money = (n: number) => n.toLocaleString() + ' ₮';

// Захиалгын огноо форматлах
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Seat { id: string; type: 'adult' | 'child'; }

// ─── Амжилттай болсон Анимаци ───────────────────────────────────────────────────────
function SuccessCheck() {
  const ringScale   = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0)).current;
  const pulseScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale,   { toValue: 1, useNativeDriver: true, tension: 50, friction: 6 }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 5 }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.checkOuter}>
      <Animated.View style={[
        styles.glowRingOuter,
        { opacity: ringOpacity, transform: [{ scale: ringScale }] },
      ]} />
      <Animated.View style={[styles.checkCircleWrap, { transform: [{ scale: pulseScale }] }]}>
        <LinearGradient colors={['#34D399', '#059669']} style={styles.checkCircle}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ─── Мэдээллийн мөр (Тод контрасттай) ───────────────────────────────────────────────
function TicketRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.ticketRow}>
      <Text style={styles.ticketRowLabel}>{label}</Text>
      <Text style={[styles.ticketRowValue, accent && styles.ticketRowAccent]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Үндсэн дэлгэц ──────────────────────────────────────────────────────────────
export default function TicketScreen() {
  const router = useRouter();
  const {
    orderId, movieTitle, date, time,
    seats, totalPrice, customerName,
    customerEmail, emailStatus, emailReason,
    hall, adultPrice, childPrice, paymentMethod,
  } = useLocalSearchParams<{
    orderId: string;
    movieTitle: string;
    date: string;
    time: string;
    seats: string;
    totalPrice: string;
    customerName: string;
    customerEmail?: string;
    emailStatus?: 'sent' | 'failed' | 'unknown';
    emailReason?: string;
    hall?: string;
    adultPrice?: string;
    childPrice?: string;
    paymentMethod?: string;
  }>();

  let parsedSeats: Seat[] = [];
  try { parsedSeats = JSON.parse(seats || '[]'); } catch { /* хоосон үлдээх */ }

  const seatIds  = parsedSeats.map(s => s.id).join(', ') || '—';
  const total    = parseInt(totalPrice || '0', 10);
  const adultCnt = parsedSeats.filter(s => s.type === 'adult').length;
  const childCnt = parsedSeats.filter(s => s.type === 'child').length;
  const adultTicketPrice = parseInt(String(adultPrice || '15000'), 10) || 15000;
  const childTicketPrice = parseInt(String(childPrice || '10000'), 10) || 10000;
  const bookedAt = formatNow();
  const emailState = emailStatus || 'unknown';
  const emailBanner = emailState === 'sent'
    ? {
        icon: 'mail-open' as const,
        title: 'Имэйл илгээгдлээ',
        text: customerEmail ? `Тасалбарын мэдээлэл ${customerEmail} хаяг руу явсан.` : 'Тасалбарын мэдээлэл имэйл рүү илгээгдсэн.',
        style: styles.emailSent,
      }
    : emailState === 'failed'
      ? {
          icon: 'alert-circle' as const,
          title: 'Имэйл илгээгдсэнгүй',
          text: emailReason || 'Тасалбар хадгалагдсан. Доорх товчоор дахин илгээж болно.',
          style: styles.emailFailed,
        }
      : {
          icon: 'mail-outline' as const,
          title: 'Имэйл төлөв шалгагдаагүй',
          text: 'Тасалбар хадгалагдсан. Шаардлагатай бол доорх товчоор имэйл дахин илгээнэ.',
          style: styles.emailUnknown,
        };

  const qrPayload = `https://khovdteatr-web-pied.vercel.app/ticket-verify/${orderId}`;

  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(20)).current;
  const cardFade   = useRef(new Animated.Value(0)).current;
  const btnFade    = useRef(new Animated.Value(0)).current;
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(btnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const cacheTicket = async () => {
      const cached = await AsyncStorage.getItem(BOOKING_CACHE_KEY).catch(() => null);
      const list = cached ? JSON.parse(cached) : [];
      const bookingId = String(orderId);
      const nextTicket = {
        id: bookingId,
        _id: bookingId,
        bookingCode: bookingId,
        movieTitle,
        title: movieTitle,
        date,
        time,
        hall,
        seats: parsedSeats,
        totalPrice: total,
        customerName,
        status: 'active',
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || 'wire',
        verifyUrl: qrPayload,
        createdAt: new Date().toISOString(),
      };
      const withoutDuplicate = Array.isArray(list)
        ? list.filter((item: any) => String(item.id || item._id || item.bookingCode) !== bookingId)
        : [];
      await AsyncStorage.setItem(BOOKING_CACHE_KEY, JSON.stringify([nextTicket, ...withoutDuplicate]));
    };

    cacheTicket().catch(() => {});
  }, [orderId]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎬 ${movieTitle}\n📅 ${date} · ${time}\n💺 Суудал: ${seatIds}\n🎫 Захиалгын код: ${orderId}`,
      });
    } catch {
      Alert.alert('Алдаа', 'Хуваалцах боломжгүй байна');
    }
  };

  const handleResendEmail = async () => {
    if (!orderId || sendingEmail) return;
    setSendingEmail(true);
    try {
      const res = await bookingAPI.resendConfirmation(String(orderId));
      if (res.success && res.email?.success) {
        Alert.alert('Амжилттай', 'Тасалбарын мэдээллийг имэйлээр дахин илгээлээ.');
        return;
      }
      Alert.alert('Имэйл илгээгдсэнгүй', res.message || 'Дахин оролдоно уу.');
    } catch (error: any) {
      Alert.alert('Алдаа гарлаа', error?.message || 'Хүсэлт амжилтгүй боллоо.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── АМЖИЛТТАЙ БАЯР ХҮРГЭХ ХЭСЭГ ── */}
        <Animated.View style={[styles.successWrap, { opacity: headerFade }]}>
          <SuccessCheck />
          <Text style={styles.successTitle}>Захиалга баталгаажлаа!</Text>
          <Text style={styles.successSub}>Ухаалаг тасалбарыг үүдэнд уншуулж нэвтэрнэ үү.</Text>
          <View style={[styles.emailBanner, emailBanner.style]}>
            <Ionicons name={emailBanner.icon} size={19} color="#FFFFFF" />
            <View style={styles.emailBannerTextWrap}>
              <Text style={styles.emailBannerTitle}>{emailBanner.title}</Text>
              <Text style={styles.emailBannerText}>{emailBanner.text}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── ТАСАЛБАРЫН КАРТ ── */}
        <Animated.View style={[
          styles.ticketCard,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}>

          {/* Дээд хэсэг: Киноны үндсэн мэдээлэл */}
          <View style={styles.ticketTop}>
            <View style={styles.ticketHeaderRow}>
              <View>
                <Text style={styles.cinemaTitle}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Амжилттай</Text>
              </View>
            </View>

            <Text style={styles.movieTitle}>{movieTitle || '—'}</Text>

            {/* Үндсэн 3 том мэдээлэл (Том фонтоор) */}
            <View style={styles.metaGrid}>
              <View style={styles.metaGridCell}>
                <Text style={styles.metaGridLabel}>ОГНОО</Text>
                <Text style={styles.metaGridValue}>{date || '—'}</Text>
              </View>
              <View style={styles.metaGridCell}>
                <Text style={styles.metaGridLabel}>ЦАГ</Text>
                <Text style={styles.metaGridValue}>{time || '—'}</Text>
              </View>
              <View style={styles.metaGridCell}>
                <Text style={styles.metaGridLabel}>ТАНХИМ</Text>
                <Text style={styles.metaGridValue}>{hall || 'Үндсэн'}</Text>
              </View>
            </View>
          </View>

          {/* Тасалбар таслах зураас */}
          <View style={styles.tearRow}>
            <View style={styles.punchLeft} />
            <View style={styles.tearLine} />
            <View style={styles.punchRight} />
          </View>

          {/* Доод хэсэг: Дэлгэрэнгүй текст мэдээллүүд */}
          <View style={styles.ticketBottom}>
            <TicketRow label="ЗАХИАЛГЫН КОД" value={orderId || '—'} accent />
            <TicketRow label="СУУДЛЫН ДУГААР" value={seatIds} />
            <TicketRow label="ЗАХИАЛАГЧ" value={customerName || '—'} />
            
            {adultCnt > 0 && (
              <TicketRow label="ТОМ ХҮН" value={`${adultCnt} × ${money(adultTicketPrice)}`} />
            )}
            {childCnt > 0 && (
              <TicketRow label="ХҮҮХЭД" value={`${childCnt} × ${money(childTicketPrice)}`} />
            )}
            
            <TicketRow label="ҮЗВЭРИЙН ЦАГ" value={bookedAt} />

            {/* Нийт төлбөр - Маш тод харагдахуйц хайрцаг */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>НИЙТ ТӨЛБӨР:</Text>
              <Text style={styles.totalAmount}>{money(total)}</Text>
            </View>
          </View>

          {/* ── QR КОД ХЭСЭГ (Цагаан дэвсгэртэй, уншихад хамгийн хялбар) ── */}
          <View style={styles.qrSection}>
            <Text style={styles.qrSectionLabel}>ТА QR КОД ШАЛГУУЛЖ НЭВРЭХ ТУЛ ХАДГАЛНА УУ</Text>
            
            <View style={styles.qrBox}>
              <QRCode
                value={qrPayload}
                size={TICKET_QR_SIZE}
                backgroundColor="#FFFFFF"
                color="#000000"
                ecl="H"
              />
            </View>

            <Text style={styles.qrHint}>
              Гэрэл ойхоос сэргийлж дэлгэцийнхээ тод байдлыг (Brightness) дээд зэргээр нэмнэ үү.
            </Text>
          </View>
        </Animated.View>

        {/* ── ҮЙЛДЛИЙН ТОВЧЛУУРУУД (Том, дарахад хялбар) ── */}
        <Animated.View style={[styles.buttonGroup, { opacity: btnFade }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color="#000000" />
            <Text style={styles.primaryBtnText}>Нүүр хуудас руу буцах</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.secondaryBtnText}>Тасалбар хуваалцах</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, sendingEmail && { opacity: 0.5 }]}
            onPress={handleResendEmail}
            activeOpacity={0.8}
            disabled={sendingEmail}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" />
            <Text style={styles.secondaryBtnText}>
              {sendingEmail ? 'Илгээж байна...' : 'Имэйл дахин илгээх'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── СТИЛЬ ТОХИРГОО (Accessibility & High Contrast) ───────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' }, // Нүдэнд ээлтэй гүн хөх өнгө

  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },

  // Амжилттай хэсэг
  successWrap: { alignItems: 'center', marginBottom: 24, width: '100%' },
  emailBanner: {
    width: '100%',
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
  },
  emailSent: { backgroundColor: 'rgba(16,185,129,0.18)', borderColor: 'rgba(52,211,153,0.35)' },
  emailFailed: { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: 'rgba(248,113,113,0.38)' },
  emailUnknown: { backgroundColor: 'rgba(59,130,246,0.16)', borderColor: 'rgba(96,165,250,0.34)' },
  emailBannerTextWrap: { flex: 1 },
  emailBannerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginBottom: 3 },
  emailBannerText: { color: '#D1D5DB', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  checkOuter:    { marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  glowRingOuter: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(52,211,153,0.15)',
  },
  checkCircleWrap: { zIndex: 2 },
  checkCircle: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    color: '#9CA3AF', // Илүү тод саарал уншихад амар
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Тасалбарын карт
  ticketCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B', // Бараан саарал суурь дэвсгэр
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },

  // Тасалбарын дээд тал
  ticketTop: { padding: 20, backgroundColor: '#1E293B' },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cinemaTitle: { fontSize: 13, fontWeight: 'bold', color: '#F59E0B', letterSpacing: 0.5 }, // Алтан шаргал
  activeBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: { color: '#34D399', fontSize: 11, fontWeight: 'bold' },
  movieTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 16,
  },

  // Үндсэн 3-н багана мэдээлэл
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaGridCell: { flex: 1 },
  metaGridLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 },
  metaGridValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },

  // Таслах зураас
  tearRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', height: 20 },
  punchLeft:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0B0F19', marginLeft: -10 },
  tearLine:   { flex: 1, height: 1, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  punchRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0B0F19', marginRight: -10 },

  // Тасалбарын доод тал
  ticketBottom: {
    backgroundColor: '#111827', // Текст уншихад илүү хялбар болгох үүднээс гүн бараан өнгө
    padding: 20,
    gap: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ticketRowLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  ticketRowValue: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', textAlign: 'right' },
  ticketRowAccent: { color: '#2DD4BF', fontSize: 16, fontWeight: 'bold' }, // Маш тод оюу ногоон

  // Нийт төлбөрийн хайрцаг
  totalBox: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  totalLabel:  { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#34D399' },

  // QR код хэсэг
  qrSection: {
    backgroundColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  qrSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  qrHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    paddingHorizontal: 10,
  },

  // Товчлуурууд
  buttonGroup: { width: '100%', gap: 12, marginTop: 12 },
  primaryBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Харанхуйд хамгийн тод харагдах цагаан товчлуур
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 16 },

  secondaryBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
