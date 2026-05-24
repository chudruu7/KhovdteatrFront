import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Modal, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { bookingAPI } from '../api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

// ── Types ─────────────────────────────────────────────────────────────────────
type BookingStatus = 'active' | 'used' | 'cancelled' | 'expired' | 'pending';

type BookingItem = {
  id?:            string;
  _id?:           string;
  title?:         string;
  movieTitle?:    string;
  movie?:         { title?: string };
  date?:          string;
  dateISO?:       string;
  time?:          string;
  showDatetime?:  string;
  hall?:          string;
  schedule?:      {
    showTime?: string;
    startTime?: string;
    hall?: { hallName?: string; name?: string };
    movie?: { title?: string };
  };
  seats?:         string[];
  totalPrice?:    number;
  status?:        BookingStatus | string;
  paymentStatus?: string;
  paymentMethod?: string;
  payment?:       { method?: string; status?: string };
  bookingCode?:   string;
  customerName?:  string;
  customerEmail?: string;
  customerPhone?: string;
  customer?:      { name?: string; email?: string; phone?: string };
  userName?:      string;
  userEmail?:     string;
  userPhone?:     string;
  createdAt?:     string;
  qrPayload?:     string;
  verifyUrl?:     string;
  ticketStatus?:  { isActive?: boolean; label?: string; reason?: string };
};

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  active:    'Идэвхтэй',
  pending:   'Хүлээгдэж байна',
  used:      'Ашигласан',
  cancelled: 'Цуцлагдсан',
  expired:   'Хугацаа дууссан',
};

// Status pill color — teal for active/pending, muted for others
const statusIsMuted = (status?: string) =>
  status === 'used' || status === 'cancelled' || status === 'expired';

const money = (value?: number) => `${(value || 0).toLocaleString()}₮`;
const getBookingId = (booking: BookingItem, fallback: string) => booking.id || booking._id || fallback;
const getTitle = (booking: BookingItem | any) =>
  booking?.title || booking?.movieTitle || booking?.movie?.title || booking?.schedule?.movie?.title || 'Тодорхойгүй кино';
const getVerifyUrl = (booking: BookingItem) =>
  booking.verifyUrl || `https://khovdteatr-web-pied.vercel.app/ticket-verify/${booking.bookingCode || booking.id || booking._id}`;
const formatTheaterDateTime = (value?: string) => {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  return {
    date: date.toLocaleDateString('mn-MN', { timeZone: 'Asia/Hovd' }),
    time: date.toLocaleTimeString('mn-MN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Hovd',
    }),
  };
};
const getShowDateTime = (booking: BookingItem) => {
  const fromDateTime = formatTheaterDateTime(
    booking.showDatetime || booking.schedule?.showTime || booking.schedule?.startTime
  );
  return {
    date: booking.date || booking.dateISO || fromDateTime.date || '—',
    time: booking.time || fromDateTime.time || '—',
  };
};
const getHall = (booking: BookingItem) =>
  booking.hall || booking.schedule?.hall?.hallName || booking.schedule?.hall?.name || '—';
const getSeats = (booking: BookingItem) =>
  Array.isArray(booking.seats) ? booking.seats.map((seat: any) => typeof seat === 'string' ? seat : seat.seatId || seat.id).filter(Boolean) : [];
const getPaymentMethod = (booking: BookingItem) => {
  const method = String(booking.paymentMethod || booking.payment?.method || 'qpay').toLowerCase();
  if (method === 'qpay' || !method) return 'QPay';
  if (method === 'card') return 'Карт';
  if (method === 'cash') return 'Бэлэн';
  return booking.paymentMethod || booking.payment?.method || 'QPay';
};
const getPaymentStatus = (booking: BookingItem) => booking.paymentStatus || booking.payment?.status || 'pending';
const getCustomerName = (booking: BookingItem) =>
  booking.customerName || booking.userName || booking.customer?.name || '—';
const getCustomerEmail = (booking: BookingItem) =>
  booking.customerEmail || booking.userEmail || booking.customer?.email || '—';
const getCustomerPhone = (booking: BookingItem) =>
  booking.customerPhone || booking.userPhone || booking.customer?.phone || '—';

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const router        = useRouter();
  const params        = useLocalSearchParams<{ mode?: string }>();
  const { colors }    = useTheme();
  const styles        = useMemo(() => createStyles(colors), [colors]);
  const mode          = params.mode === 'tickets' ? 'tickets' : 'history';

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openTicketDetails = async (booking: BookingItem, fallbackId: string) => {
    if (mode !== 'tickets') return;

    const bookingId = getBookingId(booking, fallbackId);
    setSelected(booking);
    setDetailsLoading(true);

    try {
      const data = await bookingAPI.getById(bookingId);
      setSelected({ ...booking, ...(data.booking ?? data) });
    } catch {
      setSelected(booking);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    bookingAPI.getMine()
      .then((data: any) => {
        if (!mounted) return;
        const list: BookingItem[] = Array.isArray(data)
          ? data
          : data.bookings ?? data.data ?? [];
        setBookings(list);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Захиалгын түүх татахад алдаа гарлаа.');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{mode === 'tickets' ? 'Миний тасалбарууд' : 'Захиалгын түүх'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>

      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.coral} />
          <Text style={styles.emptyTitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError('');
              setLoading(true);
              bookingAPI.getMine()
                .then((data: any) => {
                  const list: BookingItem[] = Array.isArray(data)
                    ? data
                    : data.bookings ?? data.data ?? [];
                  setBookings(list);
                })
                .catch((err: any) => setError(err?.response?.data?.message || 'Алдаа гарлаа.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>

      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="ticket-outline" size={52} color={colors.textSub} />
          <Text style={styles.emptyTitle}>Одоогоор захиалга байхгүй байна</Text>
          <Text style={styles.emptySub}>Кино захиалсны дараа энд харагдана</Text>
        </View>

      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {bookings.map((booking, index) => {
            const title  = getTitle(booking);
            const bId    = booking.id    || booking._id        || `${title}-${index}`;
            const seats  = getSeats(booking).join(', ') || '—';
            const show   = getShowDateTime(booking);
            const muted  = statusIsMuted(booking.status);
            const label  = STATUS_LABEL[booking.status ?? '']  || booking.status || '—';
            const content = (
              <>
                {/* Card top */}
                <View style={styles.cardTop}>
                  <View style={styles.movieIcon}>
                    <Ionicons name={mode === 'tickets' ? 'ticket-outline' : 'film-outline'} size={22} color={colors.teal} />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.movieTitle} numberOfLines={2}>{title}</Text>
                    <Text style={styles.meta}>{show.date} · {show.time}</Text>
                  </View>
                  <View style={[styles.statusPill, muted && styles.statusPillMuted]}>
                    <Text style={[styles.statusText, muted && styles.statusTextMuted]}>
                      {label}
                    </Text>
                  </View>
                </View>

                {[
                  { label: 'Танхим',  value: getHall(booking) },
                  { label: 'Суудал',  value: seats },
                  { label: 'Төлбөрийн төлөв', value: getPaymentStatus(booking) === 'paid' ? 'Төлөгдсөн' : 'Хүлээгдэж байна' },
                ].map(({ label: lbl, value }) => (
                  <View key={lbl} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{lbl}</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
                  </View>
                ))}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Нийт дүн</Text>
                  <Text style={styles.price}>{money(booking.totalPrice)}</Text>
                </View>

                {mode === 'tickets' && (
                  <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>Дэлгэрэнгүй харах</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.teal} />
                  </View>
                )}
              </>
            );

            return mode === 'tickets' ? (
              <TouchableOpacity key={bId} style={styles.card} activeOpacity={0.85} onPress={() => openTicketDetails(booking, bId)}>
                {content}
              </TouchableOpacity>
            ) : (
              <View key={bId} style={styles.card}>
                {content}
              </View>
            );
          })}
        </ScrollView>
      )}

      <TicketDetailsModal
        booking={selected}
        loading={detailsLoading}
        onClose={() => setSelected(null)}
        styles={styles}
        colors={colors}
      />
    </View>
  );
}

function TicketDetailsModal({
  booking, loading, onClose, styles, colors,
}: {
  booking: BookingItem | null;
  loading: boolean;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: typeof COLORS;
}) {
  if (!booking) return null;

  const title = getTitle(booking);
  const qrPayload = getVerifyUrl(booking);
  const show = getShowDateTime(booking);
  const seats = getSeats(booking);
  const paymentStatus = getPaymentStatus(booking);
  const statusIsActive = Boolean(booking.ticketStatus?.isActive ?? (booking.status === 'active' && paymentStatus === 'paid'));
  const rows = [
    { label: 'Захиалгын код', value: booking.bookingCode || booking.id || booking._id || '—', accent: true },
    { label: 'Кино', value: title },
    { label: 'Огноо', value: show.date },
    { label: 'Цаг', value: show.time },
    { label: 'Танхим', value: getHall(booking) },
    { label: 'Суудал', value: seats.join(', ') || '—' },
    { label: 'Нийт дүн', value: money(booking.totalPrice), accent: true },
    { label: 'Төлбөрийн хэлбэр', value: getPaymentMethod(booking) },
    { label: 'Төлбөрийн төлөв', value: paymentStatus === 'paid' ? 'Төлөгдсөн' : 'Хүлээгдэж байна' },
    { label: 'Төлөв', value: STATUS_LABEL[booking.status ?? ''] || booking.status || '—' },
    { label: 'Хэрэглэгч', value: getCustomerName(booking) },
    { label: 'Имэйл', value: getCustomerEmail(booking) },
    { label: 'Утас', value: getCustomerPhone(booking) },
  ];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalKicker}>Дижитал тасалбар</Text>
              <Text style={styles.modalTitle} numberOfLines={2}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.qrWrap}>
                <QRCode
                  value={qrPayload}
                  size={150}
                  backgroundColor="#FFFFFF"
                  color="#0A0A0E"
                  ecl="H"
                />
              </View>
              <Text style={styles.qrHint}>Үүдэнд энэ QR кодыг уншуулна уу</Text>
              <View style={[styles.ticketStatusBadge, statusIsActive ? styles.ticketStatusActive : styles.ticketStatusInactive]}>
                <Text style={[styles.ticketStatusText, statusIsActive ? styles.ticketStatusTextActive : styles.ticketStatusTextInactive]}>
                  {booking.ticketStatus?.label || (statusIsActive ? 'Идэвхтэй' : 'Идэвхгүй')}
                </Text>
              </View>
              {rows.map((row) => (
                <View key={row.label} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{row.label}</Text>
                  <Text style={[styles.modalValue, row.accent && styles.modalValueAccent]}>{row.value}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (colors: typeof COLORS) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  header:          { paddingTop: 58, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton:      { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title:           { color: colors.white, fontSize: 18, fontWeight: '800' },
  headerSpacer:    { width: 40 },

  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle:      { color: colors.textDim, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  emptySub:        { color: colors.textSub, fontSize: 13, textAlign: 'center' },

  retryBtn:        { marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.teal, borderRadius: RADIUS.md },
  retryText:       { color: '#0f261c', fontWeight: '700', fontSize: 14 },

  list:            { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  card:            { backgroundColor: colors.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, padding: SPACING.md, gap: SPACING.sm },

  cardTop:         { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xs },
  movieIcon:       { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: colors.tealDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitleWrap:   { flex: 1, minWidth: 0 },
  movieTitle:      { color: colors.white, fontSize: 15, fontWeight: '800' },
  meta:            { color: colors.textSub, marginTop: 3, fontSize: 12 },

  statusPill:      { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: colors.tealDim, flexShrink: 0 },
  statusPillMuted: { backgroundColor: 'rgba(255,255,255,0.06)' },
  statusText:      { color: colors.teal, fontSize: 10, fontWeight: '800' },
  statusTextMuted: { color: colors.textSub },

  detailRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  detailLabel:     { color: colors.textSub, fontSize: 13, flexShrink: 0 },
  detailValue:     { color: colors.text, fontSize: 13, flex: 1, textAlign: 'right' },
  price:           { color: colors.gold, fontSize: 15, fontWeight: '900' },
  tapHint:         { marginTop: SPACING.xs, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  tapHintText:     { color: colors.teal, fontSize: 12, fontWeight: '800' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', padding: SPACING.lg, justifyContent: 'center' },
  modalCard:       { maxHeight: '82%', backgroundColor: colors.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border2, padding: SPACING.lg },
  modalHeader:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.md, marginBottom: SPACING.md },
  modalKicker:     { color: colors.teal, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 5 },
  modalTitle:      { color: colors.white, fontSize: 20, fontWeight: '900', maxWidth: 250 },
  closeButton:     { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: colors.bgElevate, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  modalLoading:    { paddingVertical: SPACING.xl, alignItems: 'center' },
  qrWrap:          { alignSelf: 'center', padding: 12, backgroundColor: '#fff', borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  qrHint:          { color: colors.textSub, textAlign: 'center', fontSize: 12, marginBottom: SPACING.md },
  ticketStatusBadge: { alignSelf: 'center', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, marginBottom: SPACING.md },
  ticketStatusActive: { backgroundColor: 'rgba(29,233,182,0.14)' },
  ticketStatusInactive: { backgroundColor: 'rgba(232,96,122,0.14)' },
  ticketStatusText: { fontSize: 12, fontWeight: '900' },
  ticketStatusTextActive: { color: colors.teal },
  ticketStatusTextInactive: { color: colors.coral },
  modalRow:        { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 5 },
  modalLabel:      { color: colors.textSub, fontSize: 11, fontWeight: '700' },
  modalValue:      { color: colors.text, fontSize: 14, fontWeight: '700' },
  modalValueAccent:{ color: colors.teal, fontSize: 15, fontWeight: '900' },
});
