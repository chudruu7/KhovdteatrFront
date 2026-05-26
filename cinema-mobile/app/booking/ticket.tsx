// app/booking/ticket.tsx
import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Share, Alert, Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../../constants/theme';

const { width: W } = Dimensions.get('window');
const TICKET_QR_SIZE = Math.min(280, Math.max(230, W - 92));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (n: number) => n.toLocaleString() + ' ₮';

// Захиалгын огноо форматлах
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Seat { id: string; type: 'adult' | 'child'; }

// ─── Animated Checkmark ───────────────────────────────────────────────────────
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
          Animated.timing(pulseScale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
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
        <LinearGradient colors={['#1ECFBD', '#0D9488']} style={styles.checkCircle}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <Ionicons name="checkmark" size={34} color="#0A0A0E" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────
function TicketRow({
  label, value, accent = false, small = false,
}: {
  label: string; value: string; accent?: boolean; small?: boolean;
}) {
  return (
    <View style={styles.ticketRow}>
      <Text style={styles.ticketRowLabel}>{label}</Text>
      <Text
        style={[
          styles.ticketRowValue,
          accent && styles.ticketRowAccent,
          small  && styles.ticketRowSmall,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TicketScreen() {
  const router = useRouter();
  const {
    orderId, movieTitle, date, time,
    seats, totalPrice, customerName,
    hall, adultPrice, childPrice,
  } = useLocalSearchParams<{
    orderId: string;
    movieTitle: string;
    date: string;
    time: string;
    seats: string;
    totalPrice: string;
    customerName: string;
    hall?: string;
    adultPrice?: string;
    childPrice?: string;
  }>();

  let parsedSeats: Seat[] = [];
  try { parsedSeats = JSON.parse(seats || '[]'); } catch { /* keep empty */ }

  const seatIds  = parsedSeats.map(s => s.id).join(', ') || '—';
  const total    = parseInt(totalPrice || '0', 10);
  const adultCnt = parsedSeats.filter(s => s.type === 'adult').length;
  const childCnt = parsedSeats.filter(s => s.type === 'child').length;
  const bookedAt = formatNow();

  const qrPayload = `https://khovdteatr-web-pied.vercel.app/ticket-verify/${orderId}`;

  // Entrance animations
  const headerFade  = useRef(new Animated.Value(0)).current;
  const cardSlide   = useRef(new Animated.Value(36)).current;
  const cardFade    = useRef(new Animated.Value(0)).current;
  const qrSlide     = useRef(new Animated.Value(20)).current;
  const qrFade      = useRef(new Animated.Value(0)).current;
  const btnFade     = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(qrFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(qrSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(btnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(confettiAnim, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎬 ${movieTitle}\n📅 ${date} · ${time}\n💺 ${seatIds}\n🎫 Захиалгын код: ${orderId}`,
      });
    } catch {
      Alert.alert('Алдаа', 'Хуваалцах боломжгүй байна');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative orbs */}
      <Animated.View style={[styles.bgOrb,      { opacity: confettiAnim }]} />
      <Animated.View style={[styles.bgOrbSmall, { opacity: confettiAnim }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── SUCCESS HEADER ── */}
        <Animated.View style={[styles.successWrap, { opacity: headerFade }]}>
          <SuccessCheck />
          <Text style={styles.successTitle}>Захиалга баталгаажлаа!</Text>
          <Text style={styles.successSub}>Таны дижитал тасалбар бэлэн боллоо</Text>
          <View style={styles.reelRow}>
            {[...Array(7)].map((_, i) => (
              <View key={i} style={[styles.reelDot, i === 3 && styles.reelDotActive]} />
            ))}
          </View>
        </Animated.View>

        {/* ── TICKET CARD ── */}
        <Animated.View style={[
          styles.ticketCard,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}>

          {/* ── Ticket Top ── */}
          <LinearGradient colors={['#181825', '#121220']} style={styles.ticketTop}>
            {/* Cinema brand + active badge */}
            <View style={styles.ticketHeaderRow}>
              <View>
                <Text style={styles.cinemaSubtitle}>ХОВД АЙМГИЙН</Text>
                <Text style={styles.cinemaTitle}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
              </View>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>ИДЭВХТЭЙ</Text>
              </View>
            </View>

            <View style={styles.goldBar} />

            {/* Movie title */}
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle || '—'}</Text>

            {/* 3-column meta grid */}
            <View style={styles.metaGrid}>
              {[
                { label: 'ОГНОО',  value: date || '—' },
                { label: 'ЦАГ',    value: time || '—' },
                { label: 'ТАНХИМ', value: hall || 'Үндсэн' },
              ].map(({ label, value }, i, arr) => (
                <View key={label} style={styles.metaGridCell}>
                  <Text style={styles.metaGridLabel}>{label}</Text>
                  <Text style={styles.metaGridValue}>{value}</Text>
                  {i < arr.length - 1 && <View style={styles.metaGridDivider} />}
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ── Punch-hole tear line ── */}
          <View style={styles.tearRow}>
            <View style={styles.punchLeft} />
            {[...Array(14)].map((_, i) => <View key={i} style={styles.tearDash} />)}
            <View style={styles.punchRight} />
          </View>

          {/* ── Ticket Bottom — detail rows ── */}
          <View style={styles.ticketBottom}>

            <SectionTitle title="ЗАХИАЛГЫН МЭДЭЭЛЭЛ" />

            <TicketRow label="ЗАХИАЛГЫН КОД"   value={orderId || '—'} accent />
            <View style={styles.rowDivider} />
            <TicketRow label="СУУДЛЫН ДУГААР"  value={seatIds} />
            <View style={styles.rowDivider} />
            <TicketRow label="ЗАХИАЛАГЧ"        value={customerName || '—'} />
            <View style={styles.rowDivider} />
            <TicketRow label="ЗАХИАЛСАН ОГНОО" value={bookedAt} small />

            {(adultCnt > 0 || childCnt > 0) && (
              <>
                <View style={[styles.rowDivider, { marginTop: 4 }]} />
                <SectionTitle title="ТАСАЛБАРЫН ДЭЛГЭРЭНГҮЙ" />

                {adultCnt > 0 && (
                  <>
                    <TicketRow
                      label="НАСАНД ХҮРСЭН"
                      value={`${adultCnt} × ${adultPrice ? money(parseInt(adultPrice)) : '—'}`}
                    />
                    <View style={styles.rowDivider} />
                  </>
                )}
                {childCnt > 0 && (
                  <>
                    <TicketRow
                      label="ХҮҮХЭД"
                      value={`${childCnt} × ${childPrice ? money(parseInt(childPrice)) : '—'}`}
                    />
                    <View style={styles.rowDivider} />
                  </>
                )}
              </>
            )}

            {/* Total */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>НИЙТ ТӨЛБӨР</Text>
              <Text style={styles.totalAmount}>{money(total)}</Text>
            </View>
          </View>

          {/* ── QR Code Section ── */}
          <View style={styles.qrSection}>
            <View style={styles.qrHeaderRow}>
              <Ionicons name="qr-code-outline" size={14} color="rgba(255,255,255,0.3)" />
              <Text style={styles.qrSectionLabel}>ҮҮДЭНД УНШУУЛАХ QR КОД</Text>
            </View>

            <View style={styles.qrBox}>
              <QRCode
                value={qrPayload}
                size={TICKET_QR_SIZE}
                backgroundColor="#FFFFFF"
                color="#0A0A0E"
                ecl="H"
              />
            </View>

            <Text style={styles.qrHint}>
              Кассчинд энэ QR кодыг уншуулан орно уу{'\n'}
              Дэлгэцийн тод байдлыг дээд зэргээр тохируулна уу
            </Text>

            {/* Order ID below QR for manual lookup */}
            <View style={styles.qrOrderRow}>
              <Text style={styles.qrOrderLabel}>КОД: </Text>
              <Text style={styles.qrOrderValue}>{orderId || '—'}</Text>
            </View>
          </View>

          {/* Bottom barcode decoration */}
          <View style={styles.barcodeRow}>
            {[...Array(28)].map((_, i) => (
              <View
                key={i}
                style={[styles.barLine, {
                  height: 16 + (i % 3) * 8,
                  opacity: 0.3 + (i % 4) * 0.15,
                }]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── ACTION BUTTONS ── */}
        <Animated.View style={[styles.buttonGroup, { opacity: btnFade }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#FFFFFF', '#F0F0F0']} style={styles.primaryBtnGrad}>
              <Ionicons name="home-sharp" size={17} color="#0A0A0E" />
              <Text style={styles.primaryBtnText}>Нүүр хуудас руу буцах</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={17} color="#FFF" />
            <Text style={styles.secondaryBtnText}>Тасалбар хуваалцах</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push('/bookings?mode=tickets')}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>Захиалгуудаа харах →</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0E' },

  bgOrb: {
    position: 'absolute',
    width: W * 1.1, height: W * 1.1,
    borderRadius: W * 0.55,
    backgroundColor: 'rgba(20,184,166,0.04)',
    top: -W * 0.4, alignSelf: 'center',
  },
  bgOrbSmall: {
    position: 'absolute',
    width: W * 0.6, height: W * 0.6,
    borderRadius: W * 0.3,
    backgroundColor: 'rgba(197,168,128,0.03)',
    bottom: 60, right: -W * 0.2,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    alignItems: 'center',
  },

  // ── Success header ──
  successWrap: { alignItems: 'center', marginBottom: 28, width: '100%' },

  checkOuter:    { marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  glowRingOuter: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.2)',
  },
  checkCircleWrap: { zIndex: 2 },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#14B8A6',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  successTitle: {
    fontSize: 22, fontWeight: '900',
    color: '#FFF', letterSpacing: -0.5,
    marginBottom: 6,
  },
  successSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13, fontWeight: '500',
    marginBottom: 18,
  },

  reelRow:      { flexDirection: 'row', gap: 6 },
  reelDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  reelDotActive:{ backgroundColor: '#C5A880', width: 18, borderRadius: 3 },

  // ── Ticket Card ──
  ticketCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  // Top
  ticketTop:       { padding: 22, paddingTop: 24 },
  ticketHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  cinemaSubtitle: { fontSize: 8, fontWeight: '700', letterSpacing: 2, color: '#C5A880', marginBottom: 2 },
  cinemaTitle:    { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, color: 'rgba(255,255,255,0.8)' },

  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(20,184,166,0.1)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
  },
  activeDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#14B8A6' },
  activeText: { color: '#14B8A6', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

  goldBar: { height: 1, backgroundColor: 'rgba(197,168,128,0.3)', marginBottom: 18 },

  movieTitle: {
    fontSize: 22, fontWeight: '900',
    color: '#FFF', letterSpacing: -0.5,
    lineHeight: 28, marginBottom: 22,
  },

  metaGrid:         { flexDirection: 'row' },
  metaGridCell:     { flex: 1, position: 'relative' },
  metaGridLabel:    { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  metaGridValue:    { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  metaGridDivider:  { position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Tear
  tearRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0C0C14', height: 22 },
  punchLeft:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0A0A0E', marginLeft: -11 },
  tearDash:   { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 2, borderRadius: 1 },
  punchRight: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0A0A0E', marginRight: -11 },

  // Bottom
  ticketBottom: {
    backgroundColor: '#0F0F1C',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
  },

  sectionTitleWrap: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 4, marginTop: 6,
  },
  sectionTitle: {
    fontSize: 8, fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(197,168,128,0.5)',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(197,168,128,0.12)' },

  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  ticketRowLabel: {
    fontSize: 9, fontWeight: '800',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    flex: 1, paddingTop: 2,
  },
  ticketRowValue: {
    fontSize: 14, fontWeight: '700',
    color: '#FFF', textAlign: 'right', flex: 2,
  },
  ticketRowAccent: { color: '#14B8A6', letterSpacing: 1, fontWeight: '900' },
  ticketRowSmall:  { fontSize: 12 },

  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  totalBox: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(20,184,166,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.18)',
  },
  totalLabel:  { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: 'rgba(20,184,166,0.8)' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },

  // ── QR Section ──
  qrSection: {
    backgroundColor: '#0C0C18',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  qrHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  qrSectionLabel: {
    fontSize: 9, fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.3)',
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#14B8A6',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  qrHint: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 18,
  },
  qrOrderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,184,166,0.06)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.12)',
  },
  qrOrderLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(20,184,166,0.6)' },
  qrOrderValue: { fontSize: 13, fontWeight: '900', color: '#14B8A6', letterSpacing: 1 },

  // Barcode decoration
  barcodeRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#0F0F1C',
    paddingHorizontal: 22, paddingBottom: 16,
    gap: 3, justifyContent: 'center',
  },
  barLine: { width: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.25)' },

  // ── Buttons ──
  buttonGroup: { width: '100%', gap: 10 },

  primaryBtn:     { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#0A0A0E', fontWeight: '900', fontSize: 15 },

  secondaryBtn: {
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  ghostBtn:     { alignItems: 'center', paddingVertical: 8 },
  ghostBtnText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' },
});
