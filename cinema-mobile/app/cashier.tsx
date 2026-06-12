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
import { LinearGradient } from 'expo-linear-gradient';
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

function PremiumStationScanner({ stationKey, onLogout }: { stationKey: string; onLogout: () => void; user?: any }) {
  const videoRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastValueRef = useRef('');
  const submittingRef = useRef(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const submitScan = useCallback(async (value: string) => {
    const qrData = String(value || '').trim();
    if (!qrData || submittingRef.current) return;
    if (lastValueRef.current === qrData) return;

    lastValueRef.current = qrData;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const data = await cashierAPI.submitStationScan(stationKey, qrData);
      setMessage(data.booking?.movieTitle ? `${data.booking.movieTitle} уншигдлаа` : 'QR уншигдлаа');
      setManualCode('');
      setShowManualEntry(false);
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
              // Moving camera frames often fail to decode for a moment.
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
    <View style={styles.scanScreen}>
      <View style={styles.scanCameraLayer}>
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
                backgroundColor: '#05070A',
                filter: 'blur(10px) saturate(1.12)',
                transform: 'scale(1.06)',
              },
            })
          : (
            <LinearGradient
              colors={['#24142E', '#473149', '#D6C7AC', '#10131A']}
              start={{ x: 0.08, y: 0 }}
              end={{ x: 0.92, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
      </View>
      <LinearGradient
        colors={['rgba(12,7,17,0.68)', 'rgba(9,10,15,0.34)', 'rgba(5,7,10,0.78)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.scanTopBar}>
        <Text style={styles.scanTime}>17:43</Text>
        <View style={styles.scanSystemIcons}>
          <View style={styles.signalBars}>
            <View style={[styles.signalBar, { height: 5 }]} />
            <View style={[styles.signalBar, { height: 8 }]} />
            <View style={[styles.signalBar, { height: 11 }]} />
            <View style={[styles.signalBar, { height: 14 }]} />
          </View>
          <Text style={styles.scanNetwork}>LTE</Text>
          <View style={styles.battery}>
            <View style={styles.batteryLevel} />
          </View>
          <View style={styles.batteryCap} />
        </View>
      </View>

      <View style={styles.scanControlsRow}>
        <TouchableOpacity onPress={onLogout} style={styles.scanIconButton} activeOpacity={0.82}>
          <Ionicons name="close" size={31} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanHelpButton} activeOpacity={0.82}>
          <Ionicons name="help" size={18} color="rgba(255,255,255,0.86)" />
        </TouchableOpacity>
      </View>

      <View style={styles.scanInstructionWrap}>
        <Text style={styles.scanInstruction}>QR кодыг уншуулж төлнө үү.</Text>
      </View>

      <View style={styles.reticle} pointerEvents="none">
        <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
        <View style={[styles.reticleCorner, styles.reticleTopRight]} />
        <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
        <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
      </View>

      <View style={styles.scanBottomControls}>
        <TouchableOpacity style={styles.muteButton} activeOpacity={0.84}>
          <Ionicons name="flash-off" size={31} color="#FFFFFF" />
        </TouchableOpacity>

        {(submitting || !!message || !!error) && (
          <View style={styles.scanStatusPill}>
            {submitting && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text style={[styles.scanStatusText, error ? styles.scanStatusError : message ? styles.scanStatusSuccess : null]}>
              {submitting ? 'Илгээж байна...' : error || message}
            </Text>
          </View>
        )}

        {showManualEntry && (
          <View style={styles.manualPanel}>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="QR URL эсвэл захиалгын код"
              placeholderTextColor="rgba(255,255,255,0.48)"
              style={styles.scanInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.scanSubmitButton, (!manualCode.trim() || submitting) && styles.scanSubmitDisabled]}
              onPress={() => submitScan(manualCode)}
              disabled={submitting || !manualCode.trim()}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color="#090A0E" /> : <Ionicons name="arrow-forward" size={20} color="#090A0E" />}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => setShowManualEntry((value) => !value)}
          activeOpacity={0.86}
        >
          <Ionicons name="image-outline" size={25} color="#FFFFFF" />
          <Text style={styles.galleryButtonText}>код оруулах</Text>
        </TouchableOpacity>
      </View>
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
    return <PremiumStationScanner stationKey={stationKey} onLogout={logout} user={user} />;
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
  scanScreen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#05070A',
  },
  scanCameraLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05070A',
  },
  scanTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 55,
    paddingTop: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 8, 12, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  scanTime: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  scanSystemIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalBars: {
    width: 19,
    height: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  signalBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scanNetwork: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  battery: {
    width: 25,
    height: 13,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  batteryLevel: {
    width: 8,
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  batteryCap: {
    width: 2,
    height: 6,
    marginLeft: -3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scanControlsRow: {
    position: 'absolute',
    top: 67,
    left: 26,
    right: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHelpButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.58)',
    backgroundColor: 'rgba(15,16,22,0.22)',
  },
  scanInstructionWrap: {
    position: 'absolute',
    top: '24%',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  reticle: {
    position: 'absolute',
    top: '31.5%',
    alignSelf: 'center',
    width: '81%',
    maxWidth: 390,
    aspectRatio: 1,
  },
  reticleCorner: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderColor: '#FFFFFF',
  },
  reticleTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderTopLeftRadius: 26,
  },
  reticleTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderTopRightRadius: 26,
  },
  reticleBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderBottomLeftRadius: 26,
  },
  reticleBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderBottomRightRadius: 26,
  },
  scanBottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 35,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 17,
  },
  muteButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  scanStatusPill: {
    maxWidth: 360,
    minHeight: 43,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: 'rgba(8,9,13,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scanStatusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  scanStatusError: {
    color: '#FF8EA2',
  },
  scanStatusSuccess: {
    color: '#8EF2D5',
  },
  manualPanel: {
    width: '100%',
    maxWidth: 360,
    minHeight: 58,
    padding: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,9,13,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  scanInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 13,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scanSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scanSubmitDisabled: {
    opacity: 0.45,
  },
  galleryButton: {
    minWidth: 210,
    height: 58,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
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
