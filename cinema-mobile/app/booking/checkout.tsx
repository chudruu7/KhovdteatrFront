import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { bookingAPI, wireAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { SPACING, RADIUS, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isBookableShowTime } from '../../utils/showtime';
import { safeBack } from '../../utils/navigation';
import { Ionicons } from '@expo/vector-icons';

// ── Helpers ──────────────────────────────────────────────────────────────
function money(n: number) { return n.toLocaleString() + ' ₮'; }
function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Types ────────────────────────────────────────────────────────────────
type QpayStep = 'idle' | 'loading' | 'qr' | 'external' | 'success' | 'error';

interface Seat { id: string; type: 'adult' | 'child'; }
interface BankUrl { name: string; link: string; logo?: string; }

const isUrl = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(String(value || ''));
const isImageUrl = (value: string) => (
  /^data:image\//i.test(String(value || '')) ||
  /\.(avif|bmp|gif|ico|jpeg|jpg|png|svg|webp)(\?|#|$)/i.test(String(value || ''))
);

function parseWireAction(nextAction: any) {
  const banks: BankUrl[] = [];
  const qrImages: string[] = [];
  const qrTexts: string[] = [];

  const firstString = (obj: any, keys: string[]) => {
    for (const key of keys) {
      if (typeof obj?.[key] === 'string' && obj[key]) return obj[key];
    }
    return '';
  };

  const visit = (value: any, parentLabel = 'Төлөх', path: string[] = []) => {
    if (!value) return;
    if (typeof value === 'string') {
      const key = path.join('.').toLowerCase();
      if ((/qr_image|qrimage/.test(key) || isImageUrl(value)) && !/(logo|icon|avatar|thumbnail)/.test(key)) {
        qrImages.push(value);
        return;
      }
      if ((/qr_text|qrtext|qr_code|qrcode/.test(key) || (!isUrl(value) && value.length > 40)) && !isImageUrl(value)) {
        qrTexts.push(value);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, parentLabel, [...path, String(index)]));
      return;
    }
    if (typeof value === 'object') {
      const name = firstString(value, ['name', 'title', 'bank', 'operator', 'description']) || parentLabel;
      const link = firstString(value, ['deeplink', 'link', 'url', 'payment_url', 'checkout_url', 'redirect_url', 'web_url']);
      const logo = firstString(value, ['logo', 'icon', 'image', 'thumbnail']);
      if (link && isUrl(link) && !isImageUrl(link)) {
        banks.push({ name, link, logo: isImageUrl(logo) ? logo : undefined });
      }
      Object.entries(value).forEach(([key, child]) => visit(child, name, [...path, key]));
    }
  };

  visit(nextAction);
  const seen = new Set<string>();
  return {
    banks: banks.filter((bank) => {
      const id = `${bank.name}-${bank.link}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
    qrImage: [...new Set(qrImages)][0] || '',
    qrText: [...new Set(qrTexts)][0] || '',
  };
}

function toPrice(value: string | undefined, fallback: number) {
  const parsed = parseInt(String(value || fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ── Component ────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params  = useLocalSearchParams<{
    movieId: string; movieTitle: string; posterUrl: string;
    date: string; time: string; scheduleId: string;
    seats: string; totalPrice: string; showTime?: string; adultPrice?: string; childPrice?: string; adultCount?: string; childCount?: string;
  }>();

  const seats      = JSON.parse(params.seats || '[]') as Seat[];
  const prices = {
    adult: toPrice(params.adultPrice, 15000),
    child: toPrice(params.childPrice, 10000),
  };
  const adultCount = seats.filter(s => s.type === 'adult').length;
  const childCount = seats.filter(s => s.type === 'child').length;
  const totalPrice = adultCount * prices.adult + childCount * prices.child;
  const [confirmedTotalPrice, setConfirmedTotalPrice] = useState<number | null>(null);
  const payableTotal = confirmedTotalPrice ?? totalPrice;
  const payableTotalRef = useRef(totalPrice);

  // Form state
  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  // Payment state
  const [qpayStep,  setQpayStep]  = useState<QpayStep>('idle');
  const [invoiceId, setInvoiceId] = useState('');
  const [qrCode,    setQrCode]    = useState('');
  const [bankUrls,  setBankUrls]  = useState<BankUrl[]>([]);
  const [wireQrImage, setWireQrImage] = useState('');
  const [wireQrText, setWireQrText] = useState('');
  const [checkingWire, setCheckingWire] = useState(false);
  const [errMsg,    setErrMsg]    = useState('');
  const [timeLeft,  setTimeLeft]  = useState(180);
  const [bookingId, setBookingId] = useState('');

  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paidRef  = useRef(false);
  const payInFlightRef = useRef(false);
  const bankOpenInFlightRef = useRef(false);
  const statusCheckInFlightRef = useRef(false);

  // ── Cleanup ────────────────────────────────────────────────────────────
  const cleanup = () => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => cleanup(), []);
  useEffect(() => {
    payableTotalRef.current = payableTotal;
  }, [payableTotal]);

  // ── Navigate to ticket screen ─────────────────────────────────────────
  const goToTicket = (bId: string, customerName: string, customerEmail: string, emailResult?: any) => {
    const emailStatus = emailResult
      ? (emailResult.success ? 'sent' : 'failed')
      : 'unknown';
    router.replace({
      pathname: '/booking/ticket',
      params: {
        orderId:       bId,
        movieTitle:    params.movieTitle,
        posterUrl:     params.posterUrl,
        date:          params.date,
        time:          params.time,
        seats:         params.seats,
        totalPrice:    String(payableTotalRef.current),
        adultPrice:    params.adultPrice,
        childPrice:    params.childPrice,
        customerName,
        customerEmail,
        emailStatus,
        emailReason: emailResult?.reason || emailResult?.error || emailResult?.message || '',
        paymentMethod: 'wire',
      },
    });
  };

  // ── Mark booking paid & navigate ──────────────────────────────────────
  const completePaidBooking = async (bId: string, skipServerConfirm = false, knownEmailResult?: any) => {
    if (paidRef.current) return;
    paidRef.current = true;
    cleanup();

    let emailResult = knownEmailResult;
    if (!skipServerConfirm) {
      try {
        const alreadyPaid = await isBookingPaid(bId);
        if (!alreadyPaid) throw new Error('Төлбөр хараахан баталгаажаагүй байна.');
      } catch (error: any) {
        const alreadyPaid = await isBookingPaid(bId);
        if (!alreadyPaid) {
          paidRef.current = false;
          setErrMsg(error?.response?.data?.message || 'Төлбөр баталгаажуулахад алдаа гарлаа. Дахин оролдоно уу.');
          setQpayStep('error');
          return;
        }
      }
    }

    setQpayStep('success');
    setTimeout(() => goToTicket(bId, name.trim(), email.trim(), emailResult), 1200);
  };

  const isBookingPaid = async (bId: string) => {
    try {
      const res = await bookingAPI.getById(bId);
      const booking = res.booking || res;
      const status = booking.paymentStatus || booking.payment?.status;
      return status === 'paid';
    } catch {
      return false;
    }
  };

  const completeTestPayment = async () => {};

  const initWireCheckout = async (bId: string) => {
    paidRef.current = false;
    setQpayStep('loading');
    setTimeLeft(600);
    setWireQrImage('');
    setWireQrText('');
    setBankUrls([]);
    cleanup();
    try {
      const res = await wireAPI.createCheckout({
        bookingId: String(bId),
        successUrl: `https://khovdteatr-web-pied.vercel.app/ticket-verify/${bId}`,
      });
      const action = parseWireAction(res?.data?.nextAction);
      if (!res.success) throw new Error('QR үүсгэхэд алдаа гарлаа.');
      setWireQrImage(action.qrImage);
      setWireQrText(action.qrText);
      setBankUrls(action.banks);
      setQpayStep('external');
      startWirePoll(bId);
      startTimer();
    } catch (e: any) {
      setErrMsg(e?.response?.data?.message || e?.message || 'Төлбөрийн хэсэг нээхэд алдаа гарлаа.');
      setQpayStep('error');
    }
  };

  const startWirePoll = (bId: string) => {
    pollRef.current = setInterval(async () => {
      if (paidRef.current || statusCheckInFlightRef.current) return;
      statusCheckInFlightRef.current = true;
      try {
        const res = await wireAPI.checkPaymentStatus(bId);
        if (res.success && res.paid) {
          await completePaidBooking(bId, true, res.email);
        }
      } catch { /* silent — keep polling */ }
      finally {
        statusCheckInFlightRef.current = false;
      }
    }, 3000);
  };

  // ── Wire: poll payment status ─────────────────────────────────────────
  const checkWirePaymentNow = async (messageWhenPending = 'Төлбөр хараахан баталгаажаагүй байна. Банкны апп дээр алдаа гарсан бол дахин QR уншуулахгүйгээр дансны хуулгаа шалгана уу.') => {
    if (!bookingId) {
      setErrMsg('Захиалгын дугаар олдсонгүй. Шинэ захиалга эхлүүлнэ үү.');
      return false;
    }

    if (statusCheckInFlightRef.current) return false;
    statusCheckInFlightRef.current = true;
    setCheckingWire(true);
    try {
      const res = await wireAPI.checkPaymentStatus(bookingId);
      if (res.success && res.paid) {
        await completePaidBooking(bookingId, true, res.email);
        return true;
      }
      setErrMsg(messageWhenPending);
      return false;
    } catch (e: any) {
      setErrMsg(e?.response?.data?.message || 'Төлбөр баталгаажуулахад алдаа гарлаа. Давхар төлөлтөөс сэргийлж дахин QR уншуулахгүй байна.');
      return false;
    } finally {
      statusCheckInFlightRef.current = false;
      setCheckingWire(false);
    }
  };

  // Wire countdown timer ─────────────────────────────────────────────
  const openBankUrl = async (url?: string) => {
    if (!url || bankOpenInFlightRef.current) return;
    bankOpenInFlightRef.current = true;
    try {
      await Linking.openURL(url);
    } catch {
      // Ignore deeplink failures; the payment status poll remains active.
    } finally {
      setTimeout(() => {
        bankOpenInFlightRef.current = false;
      }, 2500);
    }
  };

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

  // ── Cancel & go back ──────────────────────────────────────────────────
  const handleCancel = async () => {
    cleanup();
    if (bookingId) {
      try { await bookingAPI.cancelBooking(bookingId); } catch { /* best-effort */ }
    }
    setQpayStep('idle');
  };

  // ── Main pay handler ──────────────────────────────────────────────────
  const handlePay = async () => {
    if (payInFlightRef.current || loading || qpayStep !== 'idle') return;
    if (!isBookableShowTime(params.showTime, params.date, params.time)) {
      Alert.alert('Анхааруулга', 'Энэ үзвэрийн цаг өнгөрсөн тул тасалбар захиалах боломжгүй.');
      safeBack(router, '/booking/seats');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Анхааруулга', 'Бүх талбарыг бөглөнө үү');
      return;
    }
    payInFlightRef.current = true;
    setLoading(true);
    try {
      const res = await bookingAPI.create({
        scheduleId: params.scheduleId,
        movieId:    params.movieId,
        movieTitle: params.movieTitle,
        date:       params.date,
        time:       params.time,
        seats:      seats.map(s => ({ seatId: s.id, type: s.type })),
        totalPrice,
        ticketSummary: {
          adultCount,
          childCount,
          adultPrice: prices.adult,
          childPrice: prices.child,
        },
        customer:   { name: name.trim(), email: email.trim(), phone: phone.trim() },
        paymentMethod: 'wire',
        status:     'pending',
      });
      const bId = res.bookingId || res.booking?._id || res._id;
      if (!bId) throw new Error('Захиалгын дугаар үүссэнгүй. Дахин оролдоно уу.');
      const bookedTotalPrice = Number(res.totalPrice || res.booking?.totalPrice) || totalPrice;
      setConfirmedTotalPrice(bookedTotalPrice);
      payableTotalRef.current = bookedTotalPrice;

      setBookingId(bId);
      await initWireCheckout(bId);
    } catch (error: any) {
      const message = error?.response?.data?.message
        || error?.message
        || 'Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.';
      setErrMsg(message);
      setQpayStep('error');
    } finally {
      payInFlightRef.current = false;
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // Payment overlay
  // ════════════════════════════════════════════════════════════════════════
  if (qpayStep !== 'idle') {
    return (
      <View style={styles.qpayContainer}>
        <LinearGradient colors={[colors.bg, colors.bgElevate]} style={StyleSheet.absoluteFill} />

        <View style={styles.qpayCard}>
          {/* ── Header ── */}
          <LinearGradient colors={['#e11d48', '#f59e0b']} style={styles.qpayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.qpayHeaderTitle}>Төлбөрийн сонголт</Text>
              <Text style={styles.qpayHeaderSub} numberOfLines={1}>{params.movieTitle}</Text>
            </View>
            {qpayStep !== 'success' && (
              <TouchableOpacity onPress={handleCancel} style={styles.qpayClose} hitSlop={8}>
                <Ionicons name="close" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* ── Body ── */}
          <ScrollView
            style={styles.qpayBodyScroll}
            contentContainerStyle={styles.qpayBody}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {/* Amount chip */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Төлбөрийн дүн</Text>
              <Text style={styles.amountValue}>{money(payableTotal)}</Text>
            </View>

            {/* Loading */}
            {qpayStep === 'loading' && (
              <>
                <ActivityIndicator color={colors.teal} size="large" style={{ marginTop: 16 }} />
                <Text style={styles.qpayHint}>Төлбөрийн QR үүсгэж байна...</Text>
              </>
            )}

            {/* External / Wire */}
            {qpayStep === 'external' && (
              <>
                <View style={styles.qrWrap}>
                  {wireQrImage ? (
                    <Image source={{ uri: wireQrImage }} style={styles.qrImage} resizeMode="contain" />
                  ) : wireQrText ? (
                    <QRCode value={wireQrText} size={200} backgroundColor="#fff" />
                  ) : (
                    <View style={[styles.qrImage, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="qr-code-outline" size={40} color={colors.textSub} />
                      <Text style={[styles.qpayHint, { marginTop: 8 }]}>QR мэдээлэл олдсонгүй</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.resultTitle, { color: colors.teal, marginTop: 8 }]}></Text>
                <Text style={styles.qpayHint}>QR уншуулах эсвэл банкны апп сонгож төлбөрөө төлнө үү.</Text>
                <View style={[styles.timerWrap, { borderColor: timeLeft < 60 ? colors.coral : colors.teal }]}>
                  <Ionicons name="time-outline" size={16} color={timeLeft < 60 ? colors.coral : colors.teal} />
                  <Text style={[styles.timer, { color: timeLeft < 60 ? colors.coral : colors.teal }]}>
                    {fmt(timeLeft)} дотор төлнө үү
                  </Text>
                </View>
                {bankUrls.length > 0 && (
                  <ScrollView
                    style={styles.bankScroll}
                    contentContainerStyle={styles.banksGrid}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {bankUrls.map((u, i) => (
                      <TouchableOpacity
                        key={`${u.link}-${i}`}
                        style={styles.bankBtn}
                        onPress={() => openBankUrl(u?.link)}
                        activeOpacity={0.7}
                      >
                        {u?.logo ? (
                          <Image source={{ uri: u.logo }} style={styles.bankLogo} resizeMode="contain" />
                        ) : (
                          <View style={styles.bankLogoFallback}>
                            <Text style={styles.bankLogoText}>{String(u?.name || 'Б').slice(0, 1)}</Text>
                          </View>
                        )}
                        <Text style={styles.bankText} numberOfLines={2}>{u?.name || `Банк ${i + 1}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity
                  style={styles.checkPaymentBtn}
                  onPress={() => checkWirePaymentNow()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.teal} />
                  <Text style={styles.checkPaymentText}>{checkingWire ? 'Баталгаажуулж байна...' : 'Төлбөр баталгаажуулах'}</Text>
                </TouchableOpacity>
                {!!errMsg && (
                  <View style={styles.errorHintBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.coral} />
                    <Text style={[styles.qpayHint, { color: colors.coral, marginLeft: 6, flex: 1 }]}>{errMsg}</Text>
                  </View>
                )}
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

                <View style={[styles.timerWrap, { borderColor: timeLeft < 30 ? colors.coral : colors.teal }]}>
                  <Ionicons name="time-outline" size={16} color={timeLeft < 30 ? colors.coral : colors.teal} />
                  <Text style={[styles.timer, { color: timeLeft < 30 ? colors.coral : colors.teal }]}>
                    {fmt(timeLeft)} дотор төлнө үү
                  </Text>
                </View>

                {bankUrls.length > 0 && (
                  <>
                    <Text style={styles.qpayHint}>Эсвэл банкаа сонгоно уу:</Text>
                    <View style={styles.banksGrid}>
                      {bankUrls.slice(0, 6).map((u, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.bankBtn}
                          onPress={() => openBankUrl(u?.link)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.bankText}>{u?.name || `Банк ${i + 1}`}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.qpayHint}>Банкны апп-аараа QR уншуулна уу</Text>

                <TouchableOpacity
                  style={styles.testPayBtn}
                  onPress={completeTestPayment}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flask-outline" size={16} color={colors.teal} />
                  <Text style={styles.testPayText}>[TEST] Төлөгдсөн болгох</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Success */}
            {qpayStep === 'success' && (
              <>
                <View style={[styles.resultIcon, styles.resultIconSuccess]}>
                  <Ionicons name="checkmark" size={32} color={colors.teal} />
                </View>
                <Text style={[styles.resultTitle, { color: colors.teal }]}>Төлбөр амжилттай!</Text>
                <Text style={styles.qpayHint}>Тасалбар бэлдэж байна...</Text>
                <ActivityIndicator color={colors.teal} style={{ marginTop: SPACING.md }} />
              </>
            )}

            {/* Error */}
            {qpayStep === 'error' && (
              <>
                <View style={[styles.resultIcon, styles.resultIconError]}>
                  <Ionicons name="close" size={32} color={colors.coral} />
                </View>
                <Text style={[styles.resultTitle, { color: colors.coral }]}>Алдаа гарлаа</Text>
                <Text style={styles.qpayHint}>{errMsg}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => checkWirePaymentNow('Төлбөр баталгаажаагүй байна. Давхар гүйлгээнээс сэргийлж шинэ QR үүсгэсэнгүй.')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={18} color="#ffffff" />
                  <Text style={styles.retryText}>{checkingWire ? 'Баталгаажуулж байна...' : 'Төлбөр баталгаажуулах'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // Checkout form
  // ════════════════════════════════════════════════════════════════════════
  const summaryRows: [string, string | null][] = [
    ['Үзвэр',      params.movieTitle || null],
    ['Огноо',      params.date       || null],
    ['Цаг',        params.time       || null],
    ['Суудлууд',   seats.map(s => s.id).join(', ')  || null],
    ['Том хүн',    adultCount > 0 ? `${adultCount} × ${money(prices.adult)}` : null],
    ['Хүүхэд',     childCount > 0 ? `${childCount} × ${money(prices.child)}` : null],
  ];

  const fields = [
    { label: 'НЭР',   value: name,  set: setName,  placeholder: 'Таны нэр',          icon: 'person-outline' as const,     type: 'default'       },
    { label: 'ИМЭЙЛ', value: email, set: setEmail, placeholder: 'name@example.com',   icon: 'mail-outline' as const,       type: 'email-address' },
    { label: 'УТАС',  value: phone, set: setPhone, placeholder: '9911xxxx',           icon: 'call-outline' as const,       type: 'phone-pad'     },
  ] as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack(router, '/booking/seats')} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
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
            <View style={styles.cardTitleRow}>
              <Ionicons name="receipt-outline" size={20} color={colors.teal} />
              <Text style={styles.cardTitle}>Захиалгын тойм</Text>
            </View>
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
              <Text style={styles.totalVal}>{money(payableTotal)}</Text>
            </View>
          </View>

          {/* Customer info */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-outline" size={20} color={colors.teal} />
              <Text style={styles.cardTitle}>Захиалагчийн мэдээлэл</Text>
            </View>
            {fields.map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon} size={18} color={colors.textSub} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={f.set}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textDim}
                    keyboardType={f.type}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <View style={styles.warningTitleRow}>
              <Ionicons name="warning-outline" size={18} color="#ffb347" />
              <Text style={styles.warningTitle}>Анхааруулга</Text>
            </View>
            <Text style={styles.warningText}>• Үзвэр, огноо, цагаа сайн шалгана уу.</Text>
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
            disabled={loading || qpayStep !== 'idle'}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#e11d48', '#f59e0b']} style={styles.payGrad}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.payBtnContent}>
                  <Ionicons name="card-outline" size={20} color="#ffffff" />
                  <Text style={styles.payText}>
                    Төлбөр төлөх · {money(payableTotal)}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // Form
  container:     { flex: 1, backgroundColor: colors.bg },
  header:        { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, 
    paddingTop: 60, 
    paddingBottom: SPACING.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border 
  },
  backBtn:       { 
    width: 38, 
    height: 38, 
    borderRadius: RADIUS.full, 
    backgroundColor: colors.bgCard, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  headerTitle:   { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll:        { padding: SPACING.lg },
  card:          { 
    backgroundColor: colors.bgCard, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.lg, 
    borderWidth: 1, 
    borderColor: colors.border, 
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: 8 },
  cardTitle:     { color: colors.text, fontSize: 16, fontWeight: '700' },
  row:           { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  rowKey:        { color: colors.textSub, fontSize: 14 },
  rowVal:        { color: colors.text, fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  totalRow:      { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: SPACING.md, 
    marginTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: colors.teal + '30',
  },
  totalKey:      { color: colors.text, fontSize: 16, fontWeight: '700' },
  totalVal:      { color: colors.teal, fontSize: 20, fontWeight: '800' },
  field:         { marginBottom: SPACING.md },
  fieldLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.textSub, marginBottom: 6 },
  inputWrap:     { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.bgElevate, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: colors.border,
    overflow: 'hidden',
  },
  inputIcon:     { paddingLeft: SPACING.md },
  input:         { 
    flex: 1, 
    padding: SPACING.md, 
    color: colors.text, 
    fontSize: 15,
  },
  warning:       { 
    backgroundColor: 'rgba(255,179,71,0.05)', 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md, 
    borderWidth: 1, 
    borderColor: 'rgba(255,179,71,0.2)' 
  },
  warningTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: 6 },
  warningTitle:  { color: '#ffb347', fontWeight: '700', fontSize: 14 },
  warningText:   { color: 'rgba(255,179,71,0.8)', fontSize: 12, lineHeight: 20, paddingLeft: 24 },
  footer:        { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: SPACING.lg, 
    backgroundColor: colors.bg, 
    borderTopWidth: 1, 
    borderTopColor: colors.border 
  },
  payBtn:        { borderRadius: RADIUS.lg, overflow: 'hidden' },
  payGrad:       { padding: SPACING.md + 4, alignItems: 'center' },
  payBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payText:       { color: '#ffffff', fontWeight: '800', fontSize: 17 },

  // Payment overlay
  qpayContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  qpayCard:          { 
    width: '100%', 
    maxWidth: 380, 
    maxHeight: '92%',
    borderRadius: RADIUS.xl, 
    overflow: 'hidden', 
    backgroundColor: colors.bgCard, 
    borderWidth: 1, 
    borderColor: colors.border2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  qpayHeader:        { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.lg 
  },
  qpayHeaderTitle:   { color: '#ffffff', fontWeight: '800', fontSize: 17 },
  qpayHeaderSub:     { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 4 },
  qpayClose:         { 
    width: 36, 
    height: 36, 
    borderRadius: RADIUS.full, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  qpayBodyScroll:    { width: '100%' },
  qpayBody:          { padding: SPACING.lg, alignItems: 'center', gap: SPACING.md },
  amountBox:         { 
    backgroundColor: 'rgba(29,233,182,0.08)', 
    borderRadius: RADIUS.lg, 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: SPACING.md, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(29,233,182,0.2)', 
    width: '100%' 
  },
  amountLabel:       { color: colors.textSub, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  amountValue:       { color: colors.teal, fontSize: 32, fontWeight: '800' },
  qrWrap:            { 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: RADIUS.lg, 
    borderWidth: 3, 
    borderColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  qrImage:           { width: 200, height: 200, borderRadius: RADIUS.sm },
  timerWrap:         {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(29,233,182,0.05)',
  },
  timer:             { fontSize: 14, fontWeight: '700' },
  bankScroll:        { width: '100%', maxHeight: 220 },
  banksGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 4 },
  bankBtn:           { 
    width: 80, 
    minHeight: 84, 
    paddingHorizontal: 6, 
    paddingVertical: 10, 
    borderRadius: RADIUS.md, 
    backgroundColor: colors.bgElevate, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6 
  },
  bankLogo:          { width: 36, height: 36, borderRadius: RADIUS.sm },
  bankLogoFallback:  { 
    width: 36, 
    height: 36, 
    borderRadius: RADIUS.sm, 
    backgroundColor: 'rgba(29,233,182,0.12)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bankLogoText:      { color: colors.teal, fontWeight: '800', fontSize: 16 },
  bankText:          { color: colors.textDim, fontSize: 10, textAlign: 'center', lineHeight: 13 },
  testPayBtn:        { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%', 
    paddingVertical: 12, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: colors.teal, 
    backgroundColor: 'rgba(29,233,182,0.08)', 
    justifyContent: 'center',
  },
  testPayText:       { color: colors.teal, fontSize: 13, fontWeight: '800' },
  checkPaymentBtn:   {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(29,233,182,0.12)',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29,233,182,0.3)',
  },
  checkPaymentText:  { color: colors.teal, fontSize: 14, fontWeight: '700' },
  qpayHint:          { color: colors.textSub, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorHintBox:      {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(232,96,122,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(232,96,122,0.2)',
  },
  resultIcon:        { 
    width: 80, 
    height: 80, 
    borderRadius: RADIUS.full, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3 
  },
  resultIconSuccess: { backgroundColor: 'rgba(29,233,182,0.12)', borderColor: colors.teal },
  resultIconError:   { backgroundColor: 'rgba(232,96,122,0.12)', borderColor: colors.coral },
  resultTitle:       { fontSize: 22, fontWeight: '800' },
  retryBtn:          { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.sm + 2, 
    backgroundColor: colors.coral, 
    borderRadius: RADIUS.md 
  },
  retryText:         { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
