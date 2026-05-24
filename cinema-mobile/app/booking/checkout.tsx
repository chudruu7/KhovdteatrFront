import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { bookingAPI, qpayAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { SPACING, RADIUS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isBookableShowTime } from '../../utils/showtime';

// ── Helpers ──────────────────────────────────────────────────────────────────
function money(n: number) { return n.toLocaleString() + '₮'; }
function genId() { return 'TK-' + Date.now().toString(36).toUpperCase().slice(-5); }
function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// In DEV on a real device, auto-confirm payment for testing
const isMobilePaymentTestPaid = __DEV__ && Platform.OS !== 'web';

// ── Types ─────────────────────────────────────────────────────────────────────
type QpayStep = 'idle' | 'loading' | 'qr' | 'success' | 'error';

interface Seat { id: string; type: 'adult' | 'child'; }
interface BankUrl { name: string; link: string; logo?: string; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params  = useLocalSearchParams<{
    movieId: string; movieTitle: string; posterUrl: string;
    date: string; time: string; scheduleId: string;
    seats: string; totalPrice: string; showTime?: string;
  }>();

  const seats      = JSON.parse(params.seats || '[]') as Seat[];
  const totalPrice = parseInt(params.totalPrice || '0', 10);

  // Form state
  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  // QPay state
  const [qpayStep,  setQpayStep]  = useState<QpayStep>('idle');
  const [invoiceId, setInvoiceId] = useState('');
  const [qrCode,    setQrCode]    = useState('');
  const [bankUrls,  setBankUrls]  = useState<BankUrl[]>([]);
  const [errMsg,    setErrMsg]    = useState('');
  const [timeLeft,  setTimeLeft]  = useState(180);
  const [bookingId, setBookingId] = useState('');

  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prevent duplicate confirmation calls
  const paidRef  = useRef(false);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = () => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => cleanup(), []);

  // ── Navigate to ticket screen ────────────────────────────────────────────
  const goToTicket = (bId: string, customerName: string, customerEmail: string) => {
    router.replace({
      pathname: '/booking/ticket',
      params: {
        orderId:       bId,
        movieTitle:    params.movieTitle,
        posterUrl:     params.posterUrl,
        date:          params.date,
        time:          params.time,
        seats:         params.seats,
        totalPrice:    params.totalPrice,
        customerName,
        customerEmail,
      },
    });
  };

  // ── Mark booking paid & navigate ─────────────────────────────────────────
  const completePaidBooking = async (bId: string) => {
    if (paidRef.current) return;   // guard against double-call
    paidRef.current = true;
    cleanup();
    try {
      await qpayAPI.confirmBooking(bId);
    } catch (error: any) {
      paidRef.current = false;
      setErrMsg(error?.response?.data?.message || 'Төлбөр баталгаажуулахад алдаа гарлаа.');
      setQpayStep('error');
      return;
    }
    setQpayStep('success');
    setTimeout(() => goToTicket(bId, name, email), 1200);
  };

  // ── QPay: create invoice ─────────────────────────────────────────────────
  const initQPay = async (bId: string) => {
    paidRef.current = false;
    setQpayStep('loading');
    setTimeLeft(180);
    cleanup();
    try {
      const res = await qpayAPI.createInvoice({
        bookingId:  String(bId),
        amount:     totalPrice,
        seats:      seats.map(s => s.id),
        movieTitle: params.movieTitle,
      });
      if (!res.success) throw new Error('Invoice үүсгэхэд алдаа гарлаа');
      const { invoiceId: ivId, qrCode: qr, urls = [] } = res.data;
      setInvoiceId(ivId);
      setQrCode(qr || '');
      setBankUrls(urls);
      setQpayStep('qr');
      startPoll(ivId, bId);
      startTimer();
    } catch (e: any) {
      setErrMsg(e?.message || 'QPay холболтын алдаа');
      setQpayStep('error');
    }
  };

  // ── QPay: poll payment status ────────────────────────────────────────────
  const startPoll = (ivId: string, bId: string) => {
    pollRef.current = setInterval(async () => {
      if (paidRef.current) return;
      try {
        const res = await qpayAPI.checkPayment(ivId);
        if (res.success && res.data?.paid) {
          await completePaidBooking(bId);
        }
      } catch { /* silent — keep polling */ }
    }, 3000);
  };

  // ── QPay: countdown timer ────────────────────────────────────────────────
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          cleanup();
          setQpayStep('error');
          setErrMsg('Төлбөрийн хугацаа дууслаа. Дахин оролдоно уу.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Cancel & go back ────────────────────────────────────────────────────
  const handleCancel = async () => {
    cleanup();
    if (invoiceId) {
      try { await qpayAPI.cancelInvoice(invoiceId); } catch { /* best-effort */ }
    }
    if (bookingId) {
      try { await qpayAPI.cancelBooking(bookingId); } catch { /* best-effort */ }
    }
    setQpayStep('idle');
  };

  // ── Main pay handler ─────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!isBookableShowTime(params.showTime, params.date, params.time)) {
      Alert.alert('Анхааруулга', 'Энэ үзвэрийн цаг өнгөрсөн тул тасалбар захиалах боломжгүй.');
      router.back();
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Анхааруулга', 'Бүх талбарыг бөглөнө үү');
      return;
    }
    setLoading(true);
    let bId = genId();
    try {
      try {
        const res = await bookingAPI.create({
          scheduleId: params.scheduleId,
          movieId:    params.movieId,
          movieTitle: params.movieTitle,
          date:       params.date,
          time:       params.time,
          seats:      seats.map(s => ({ seatId: s.id, type: s.type })),
          totalPrice,
          customer:   { name: name.trim(), email: email.trim(), phone: phone.trim() },
          status:     'pending',
        });
        bId = res.bookingId || res.booking?._id || res._id || bId;
      } catch { /* use generated id on API failure */ }

      setBookingId(bId);

      if (isMobilePaymentTestPaid) {
        await completePaidBooking(bId);
      } else {
        await initQPay(bId);
      }
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // QPay overlay
  // ════════════════════════════════════════════════════════════════════════════
  if (qpayStep !== 'idle') {
    return (
      <View style={styles.qpayContainer}>
        <LinearGradient colors={[colors.bg, colors.bgElevate]} style={StyleSheet.absoluteFill} />

        <View style={styles.qpayCard}>
          {/* ── Header ── */}
          <LinearGradient colors={[colors.teal, '#13c4a3']} style={styles.qpayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.qpayHeaderTitle}>QPay төлбөр</Text>
              <Text style={styles.qpayHeaderSub} numberOfLines={1}>{params.movieTitle}</Text>
            </View>
            {qpayStep !== 'success' && (
              <TouchableOpacity onPress={handleCancel} style={styles.qpayClose} hitSlop={8}>
                <Text style={styles.qpayCloseText}>✕</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* ── Body ── */}
          <View style={styles.qpayBody}>
            {/* Amount chip */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Төлбөрийн дүн</Text>
              <Text style={styles.amountValue}>{money(totalPrice)}</Text>
            </View>

            {/* Loading */}
            {qpayStep === 'loading' && (
              <>
                <ActivityIndicator color={colors.teal} size="large" style={{ marginTop: 8 }} />
                <Text style={styles.qpayHint}>QR код бэлдэж байна…</Text>
              </>
            )}

            {/* QR */}
            {qpayStep === 'qr' && (
              <>
                <View style={styles.qrWrap}>
                  <Image
                    source={{
                      uri: qrCode
                        ? `data:image/png;base64,${qrCode}`
                        : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invoiceId)}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                <Text style={[styles.timer, { color: timeLeft < 30 ? colors.coral : colors.teal }]}>
                  ⏱ {fmt(timeLeft)} дотор төлнө үү
                </Text>

                {bankUrls.length > 0 && (
                  <>
                    <Text style={styles.qpayHint}>Эсвэл банкаа сонгоно уу:</Text>
                    <View style={styles.banksGrid}>
                      {bankUrls.slice(0, 6).map((u, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.bankBtn}
                          onPress={() => {
                            if (u?.link) Linking.openURL(u.link).catch(() => {});
                          }}
                        >
                          <Text style={styles.bankText}>{u?.name || `Банк ${i + 1}`}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.qpayHint}>Банкны аппаараа QR уншуулна уу</Text>
              </>
            )}

            {/* Success */}
            {qpayStep === 'success' && (
              <>
                <View style={[styles.resultIcon, styles.resultIconSuccess]}>
                  <Text style={{ fontSize: 32 }}>✓</Text>
                </View>
                <Text style={[styles.resultTitle, { color: colors.teal }]}>Төлбөр амжилттай!</Text>
                <Text style={styles.qpayHint}>Тасалбар бэлдэж байна…</Text>
                <ActivityIndicator color={colors.teal} style={{ marginTop: SPACING.md }} />
              </>
            )}

            {/* Error */}
            {qpayStep === 'error' && (
              <>
                <View style={[styles.resultIcon, styles.resultIconError]}>
                  <Text style={{ fontSize: 32 }}>✕</Text>
                </View>
                <Text style={[styles.resultTitle, { color: colors.coral }]}>Алдаа гарлаа</Text>
                <Text style={styles.qpayHint}>{errMsg}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => initQPay(bookingId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryText}>Дахин оролдох</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Checkout form
  // ════════════════════════════════════════════════════════════════════════════
  const adultCount = seats.filter(s => s.type === 'adult').length;
  const childCount = seats.filter(s => s.type === 'child').length;

  const summaryRows: [string, string | null][] = [
    ['Кино',      params.movieTitle || null],
    ['Огноо',     params.date       || null],
    ['Цаг',       params.time       || null],
    ['Суудлууд',  seats.map(s => s.id).join(', ')  || null],
    ['Том хүн',   adultCount > 0 ? `${adultCount} ширхэг` : null],
    ['Хүүхэд',    childCount > 0 ? `${childCount} ширхэг` : null],
  ];

  const fields = [
    { label: 'НЭР',   value: name,  set: setName,  placeholder: 'Таны нэр',         type: 'default'       },
    { label: 'ИМЭЙЛ', value: email, set: setEmail, placeholder: 'name@example.com', type: 'email-address' },
    { label: 'УТАС',  value: phone, set: setPhone, placeholder: '9911xxxx',          type: 'phone-pad'     },
  ] as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Захиалга баталгаажуулах</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Захиалгын тойм</Text>
            {summaryRows
              .filter((row): row is [string, string] => row[1] !== null)
              .map(([k, v]) => (
                <View key={k} style={styles.row}>
                  <Text style={styles.rowKey}>{k}</Text>
                  <Text style={styles.rowVal} numberOfLines={2}>{v}</Text>
                </View>
              ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Нийт дүн</Text>
              <Text style={styles.totalVal}>{money(totalPrice)}</Text>
            </View>
          </View>

          {/* Customer info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Хувийн мэдээлэл</Text>
            {fields.map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textSub}
                  keyboardType={f.type}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>⚠ Анхааруулга</Text>
            <Text style={styles.warningText}>• Кино, огноо, цагаа сайтар шалгана уу.</Text>
            <Text style={styles.warningText}>• Төлбөр төлсний дараа тасалбар буцаах боломжгүй.</Text>
            <Text style={styles.warningText}>• Цаг эхлэхээс 10 минутын өмнө ирнэ үү.</Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer pay button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payBtn, loading && { opacity: 0.6 }]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.teal, '#13c4a3']} style={styles.payGrad}>
              {loading ? (
                <ActivityIndicator color="#0f261c" />
              ) : (
                <Text style={styles.payText}>
                  {isMobilePaymentTestPaid ? 'Тест төлбөр батлах' : 'QPay-р төлөх'} · {money(totalPrice)}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // Form
  container:    { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md },
  backBtn:      { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backText:     { color: colors.white, fontSize: 18, fontWeight: '700' },
  headerTitle:  { color: colors.white, fontSize: 16, fontWeight: '700' },
  scroll:       { padding: SPACING.lg },
  card:         { backgroundColor: colors.bgCard, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.md },
  cardTitle:    { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowKey:       { color: colors.textSub, fontSize: 13 },
  rowVal:       { color: colors.white, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.md, marginTop: SPACING.sm },
  totalKey:     { color: colors.white, fontSize: 15, fontWeight: '700' },
  totalVal:     { color: colors.teal, fontSize: 18, fontWeight: '800' },
  field:        { marginBottom: SPACING.md },
  fieldLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.textSub, marginBottom: 6 },
  input:        { backgroundColor: colors.bgElevate, borderRadius: RADIUS.sm, padding: SPACING.md, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  warning:      { backgroundColor: 'rgba(255,179,71,0.05)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,179,71,0.2)' },
  warningTitle: { color: '#ffb347', fontWeight: '700', fontSize: 13, marginBottom: SPACING.sm },
  warningText:  { color: 'rgba(255,179,71,0.7)', fontSize: 12, lineHeight: 20 },
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  payBtn:       { borderRadius: RADIUS.md, overflow: 'hidden' },
  payGrad:      { padding: SPACING.md + 2, alignItems: 'center' },
  payText:      { color: '#0f261c', fontWeight: '800', fontSize: 16 },

  // QPay overlay
  qpayContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  qpayCard:          { width: '100%', maxWidth: 360, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border2 },
  qpayHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  qpayHeaderTitle:   { color: '#0f261c', fontWeight: '800', fontSize: 15 },
  qpayHeaderSub:     { color: 'rgba(15,38,28,0.65)', fontSize: 11, marginTop: 2 },
  qpayClose:         { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  qpayCloseText:     { color: '#0f261c', fontWeight: '800', fontSize: 16 },
  qpayBody:          { padding: SPACING.lg, alignItems: 'center', gap: SPACING.md },
  amountBox:         { backgroundColor: 'rgba(29,233,182,0.08)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29,233,182,0.2)', width: '100%' },
  amountLabel:       { color: colors.textSub, fontSize: 11, marginBottom: 4 },
  amountValue:       { color: colors.teal, fontSize: 28, fontWeight: '800' },
  qrWrap:            { padding: 8, backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 3, borderColor: colors.teal },
  qrImage:           { width: 200, height: 200 },
  timer:             { fontSize: 15, fontWeight: '700' },
  banksGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  bankBtn:           { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: colors.bgElevate, borderWidth: 1, borderColor: colors.border },
  bankText:          { color: colors.textDim, fontSize: 11 },
  qpayHint:          { color: colors.textSub, fontSize: 12, textAlign: 'center' },
  resultIcon:        { width: 72, height: 72, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  resultIconSuccess: { backgroundColor: 'rgba(29,233,182,0.12)', borderColor: colors.teal },
  resultIconError:   { backgroundColor: 'rgba(232,96,122,0.12)', borderColor: colors.coral },
  resultTitle:       { fontSize: 20, fontWeight: '800' },
  retryBtn:          { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.teal, borderRadius: RADIUS.md },
  retryText:         { color: '#0f261c', fontWeight: '700' },
});
