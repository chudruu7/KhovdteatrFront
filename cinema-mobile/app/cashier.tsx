import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
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

const getParam = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;

function StationScanner({ stationKey, onLogout, user }: { stationKey: string; onLogout: () => void; user?: any }) {
  const videoRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastValueRef = useRef('');
  const submittingRef = useRef(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitScan = useCallback(async (value: string) => {
    const qrData = String(value || '').trim();
    if (!qrData || submittingRef.current) return;
    if (lastValueRef.current === qrData) return;

    lastValueRef.current = qrData;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const data = await cashierAPI.submitStationScan(stationKey, qrData);
      setMessage(data.booking?.movieTitle ? `${data.booking.movieTitle} уншигдлаа` : 'QR уншигдлаа');
      setManualCode('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'QR уншихад алдаа гарлаа.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setTimeout(() => {
        lastValueRef.current = '';
      }, 900);
    }
  }, [stationKey]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setError('Камер scanner одоогоор browser дээр ажиллана. Доорх талбарт кодоо гараар оруулж болно.');
      return;
    }

    let alive = true;
    const startScanner = async () => {
      try {
        const video = videoRef.current;
        const BarcodeDetectorCtor = (globalThis as any).BarcodeDetector;

        if (BarcodeDetectorCtor && video) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          video.srcObject = stream;
          await video.play?.();

          const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
          const scan = async () => {
            if (!alive) return;
            try {
              if (video.readyState >= 2) {
                const codes = await detector.detect(video);
                const value = codes?.[0]?.rawValue;
                if (value) submitScan(value);
              }
            } catch {
              // Transient frame decode failures are normal while the camera moves.
            }
            scanLoopRef.current = requestAnimationFrame(scan);
          };

          scanLoopRef.current = requestAnimationFrame(scan);
          controlsRef.current = {
            stop: () => stream.getTracks().forEach((track: MediaStreamTrack) => track.stop()),
          };
          return;
        }

        // @ts-ignore Optional web-only fallback; package may be injected by the web bundle.
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 650,
        });
        controlsRef.current = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result: any) => {
            if (!alive || !result) return;
            submitScan(result.getText());
          }
        );
      } catch (err: any) {
        setError(err?.message || 'Камер нээж чадсангүй. Browser permission зөвшөөрөөд дахин оролдоно уу.');
      }
    };

    startScanner();

    return () => {
      alive = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      controlsRef.current?.stop?.();
    };
  }, [submitScan]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Ховд аймгийн Хөгжимт драмын театр</Text>
          <Text style={styles.title}>QR уншуулах</Text>
          <Text style={styles.userText}>{user?.name || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.coral} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scannerCard}>
          <Text style={styles.label}>Station</Text>
          <Text style={styles.stationKey}>{stationKey}</Text>

          <View style={styles.cameraFrame}>
            {Platform.OS === 'web'
              ? React.createElement('video', {
                  ref: videoRef,
                  muted: true,
                  playsInline: true,
                  autoPlay: true,
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000',
                  },
                })
              : (
                <View style={styles.cameraFallback}>
                  <Ionicons name="scan-outline" size={44} color={COLORS.teal} />
                  <Text style={styles.hint}>Browser scanner ашиглахын тулд QR холбоосыг утасны browser-оор нээнэ үү.</Text>
                </View>
              )}
          </View>

          {submitting && (
            <View style={styles.inlineStatus}>
              <ActivityIndicator color={COLORS.teal} />
              <Text style={styles.inlineStatusText}>Илгээж байна...</Text>
            </View>
          )}
          {!!message && <Text style={styles.successText}>{message}</Text>}
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Гараар оруулах код</Text>
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="ticket-verify/... эсвэл booking id"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.input}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => submitScan(manualCode)} disabled={submitting || !manualCode.trim()}>
            {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>Илгээх</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function CashierScreen() {
  const { logout, user } = useAuth();
  const params = useLocalSearchParams<{ station?: string | string[]; scan?: string | string[] }>();
  const stationKey = getParam(params.station);
  const scanMode = getParam(params.scan);
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [admitting, setAdmitting] = useState(false);

  if (stationKey && scanMode === '1') {
    return <StationScanner stationKey={stationKey} onLogout={logout} user={user} />;
  }

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

  const refreshTicket = async () => {
    if (loading) return;
    if (!code.trim()) {
      setBooking(null);
      return;
    }
    await checkTicket();
  };

  const allowed = Boolean(booking?.admission?.allowed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../assets/kdt.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.brandText}>
            <Text style={styles.kicker}>Ховд аймгийн Хөгжимт драмын театр</Text>
            <Text style={styles.title}>Тасалбар шалгах дэлгэц</Text>
            <Text style={styles.userText}>{user?.name || user?.email}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={refreshTicket} style={styles.refreshBtn} disabled={loading}>
            <Ionicons name="refresh-outline" size={22} color={COLORS.teal} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.coral} />
          </TouchableOpacity>
        </View>
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
  brandRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logo: { width: 48, height: 48, flexShrink: 0 },
  brandText: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginLeft: SPACING.sm },
  kicker: { color: COLORS.teal, fontSize: 11, fontWeight: '900' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  userText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 },
  refreshBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(20,184,166,0.12)', alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232,96,122,0.12)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { backgroundColor: '#10141D', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: SPACING.lg },
  scannerCard: { backgroundColor: '#10141D', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(20,184,166,0.22)', padding: SPACING.lg },
  stationKey: { color: COLORS.teal, fontSize: 13, fontWeight: '900', marginTop: 6, marginBottom: SPACING.md },
  cameraFrame: { height: 430, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cameraFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  inlineStatus: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  inlineStatusText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '700' },
  successText: { color: COLORS.teal, fontSize: 14, fontWeight: '900', marginTop: SPACING.md },
  errorText: { color: COLORS.coral, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: SPACING.md },
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
