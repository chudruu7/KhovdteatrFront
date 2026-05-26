import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cashierAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const money = (value?: number) => `${Number(value || 0).toLocaleString('mn-MN')}₮`;

const extractBookingCode = (value: string) => {
  const raw = value.trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed.bookingCode) return String(parsed.bookingCode);
    if (parsed.verifyUrl) return extractBookingCode(parsed.verifyUrl);
  } catch {}
  const match = raw.match(/ticket-verify\/([^/?#]+)/);
  return match?.[1] || raw.replace(/^#/, '');
};

export default function CashierScreen() {
  const { logout, user } = useAuth();
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [admitting, setAdmitting] = useState(false);

  const checkTicket = async () => {
    const bookingId = extractBookingCode(code);
    if (!bookingId) return Alert.alert('Анхаар', 'QR URL эсвэл захиалгын код оруулна уу.');
    setLoading(true);
    try {
      const data = await cashierAPI.getTicket(bookingId);
      setBooking(data.booking);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.message || err?.message || 'Тасалбар шалгахад алдаа гарлаа.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const admit = async () => {
    if (!booking?.id) return;
    setAdmitting(true);
    try {
      const data = await cashierAPI.admitTicket(booking.id);
      setBooking(data.booking);
      Alert.alert('Амжилттай', 'Тасалбар нэвтрүүлэгдлээ.');
    } catch (err: any) {
      Alert.alert('Нэвтрүүлэх боломжгүй', err?.response?.data?.message || err?.message || 'Алдаа гарлаа.');
    } finally {
      setAdmitting(false);
    }
  };

  const allowed = Boolean(booking?.admission?.allowed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Gate control</Text>
          <Text style={styles.title}>Cashier шалгалт</Text>
          <Text style={styles.userText}>{user?.name || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.coral} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>QR URL / захиалгын код</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="ticket-verify/... эсвэл booking id"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.input}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={checkTicket} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>Шалгах</Text>}
          </TouchableOpacity>
          <Text style={styles.hint}>
            Камертай QR scanner ашиглах бол компьютер дээрх /cashier station QR-ийг утасны browser-оор нээнэ.
          </Text>
        </View>

        {booking && (
          <View style={[styles.resultCard, allowed ? styles.valid : styles.invalid]}>
            <View style={styles.statusRow}>
              <Ionicons
                name={allowed ? 'checkmark-circle' : 'close-circle'}
                size={42}
                color={allowed ? COLORS.teal : COLORS.coral}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, { color: allowed ? COLORS.teal : COLORS.coral }]}>
                  {booking.admission?.label}
                </Text>
                <Text style={styles.reason}>{booking.admission?.reason}</Text>
              </View>
            </View>

            {[
              ['Үзвэр', booking.movieTitle],
              ['Огноо', booking.date],
              ['Цаг', booking.time],
              ['Танхим', booking.hall],
              ['Суудал', booking.seats?.join(', ')],
              ['Захиалагч', booking.customerName],
              ['Утас', booking.customerPhone],
              ['Нийт дүн', money(booking.totalPrice)],
            ].map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value || '—'}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.admitBtn, !allowed && styles.disabledBtn]} onPress={admit} disabled={!allowed || admitting}>
              {admitting ? <ActivityIndicator color="#000" /> : <Text style={styles.admitText}>Нэвтрүүлэх</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070A' },
  header: {
    paddingTop: 58,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: { color: COLORS.teal, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 },
  userText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232,96,122,0.12)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { backgroundColor: '#10141D', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: SPACING.lg },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  input: { marginTop: SPACING.sm, height: 52, borderRadius: RADIUS.md, backgroundColor: '#05070A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: SPACING.md },
  primaryBtn: { marginTop: SPACING.md, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#001310', fontSize: 15, fontWeight: '900' },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 18, marginTop: SPACING.md },
  resultCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.sm },
  valid: { backgroundColor: 'rgba(20,184,166,0.08)', borderColor: 'rgba(20,184,166,0.35)' },
  invalid: { backgroundColor: 'rgba(232,96,122,0.08)', borderColor: 'rgba(232,96,122,0.35)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  statusTitle: { fontSize: 22, fontWeight: '900' },
  reason: { color: 'rgba(255,255,255,0.62)', marginTop: 4, fontSize: 13, lineHeight: 18 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  rowValue: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 4 },
  admitBtn: { marginTop: SPACING.md, height: 54, borderRadius: RADIUS.md, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  admitText: { color: '#001310', fontSize: 15, fontWeight: '900' },
});
