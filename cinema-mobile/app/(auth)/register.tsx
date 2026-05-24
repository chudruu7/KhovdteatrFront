// app/(auth)/register.tsx
import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Dimensions, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────
const TEAL  = '#14B8A6';
const GOLD  = '#C5A880';
const WHITE = '#FFFFFF';
const BG    = '#0A0A0E';

// ─── Icon helper ─────────────────────────────────────────────────────────────
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<string, IconName> = {
  'arrow-left': 'arrow-back',
  user:         'person-outline',
  mail:         'mail-outline',
  phone:        'call-outline',
  lock:         'lock-closed-outline',
  shield:       'shield-checkmark-outline',
  eye:          'eye-outline',
  'eye-off':    'eye-off-outline',
  google:       'logo-google',
};
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Ionicons name={ICONS[name] ?? 'ellipse-outline'} size={size} color={color} />
);

// ─── Animated icon color (Ionicons doesn't accept Animated.Value) ─────────────
function AnimatedIcon({ name, focusAnim }: { name: string; focusAnim: Animated.Value }) {
  const [color, setColor] = useState('rgba(255,255,255,0.25)');
  useEffect(() => {
    const id = focusAnim.addListener(({ value }) => {
      const r = Math.round(255 * (1 - value) + 20  * value);
      const g = Math.round(255 * (1 - value) + 184 * value);
      const b = Math.round(255 * (1 - value) + 166 * value);
      const a = (0.25 * (1 - value) + 1 * value).toFixed(2);
      setColor(`rgba(${r},${g},${b},${a})`);
    });
    return () => focusAnim.removeListener(id);
  }, [focusAnim]);
  return <Icon name={name} size={15} color={color} />;
}

// ─── Animated Input Field ────────────────────────────────────────────────────
function AnimatedInput({
  label, iconName, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize,
  rightElement, delay = 0,
}: {
  label: string;
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightElement?: React.ReactNode;
  delay?: number;
}) {
  const focusAnim    = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(slideAnim,    { toValue: 0, duration: 480, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onFocus = () =>
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur  = () =>
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', TEAL],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.03)', 'rgba(20,184,166,0.05)'],
  });

  return (
    <Animated.View style={[
      styles.inputWrapper,
      { opacity: entranceAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputContainer, { borderColor, backgroundColor: bgColor }]}>
        <View style={{ marginRight: 10 }}>
          <AnimatedIcon name={iconName} focusAnim={focusAnim} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.18)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={TEAL}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {rightElement}
      </Animated.View>
    </Animated.View>
  );
}

// ─── Press Button with scale feedback ────────────────────────────────────────
function PressButton({
  onPress, disabled, loading, label,
  style, colors,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  style?: any;
  colors?: readonly [string, string, ...string[]];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spring    = (v: number) =>
    Animated.spring(scaleAnim, { toValue: v, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => spring(0.96)}
        onPressOut={() => spring(1)}
        disabled={disabled}
        activeOpacity={1}
      >
        {colors ? (
          <LinearGradient colors={colors} style={styles.gradientButton}>
            {loading
              ? <ActivityIndicator color="#0A0A0E" size="small" />
              : <Text style={styles.submitButtonText}>{label}</Text>}
          </LinearGradient>
        ) : (
          <View style={[styles.gradientButton, styles.outlineButton]}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.socialButtonText}>{label}</Text>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const hasLength  = password.length >= 8;
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const score      = [hasLength, hasUpper, hasNumber].filter(Boolean).length;
  const labels     = ['Сул', 'Дунд', 'Хүчтэй'];
  const colors_arr = [['#ef4444', '#dc2626'], ['#f59e0b', '#d97706'], ['#10b981', '#059669']];
  const idx        = Math.max(0, score - 1);

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              i < score && { backgroundColor: colors_arr[idx][0] },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: colors_arr[idx][0] }]}>
        {labels[idx]}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router             = useRouter();
  const { register, googleLogin } = useAuth();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const formSlide  = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formAnim,   { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(formSlide,  { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGoogleSuccess = useCallback(
    async (p: { name: string; email: string; avatarUrl?: string | null; providerId: string }) => {
      await googleLogin(p);
    }, [googleLogin]
  );
  const { startGoogleAuth, googleLoading } = useGoogleAuth(handleGoogleSuccess);

  const validateForm = (): boolean => {
    const checks: [boolean, string][] = [
      [!!name.trim(),                                          'Нэрээ оруулна уу'],
      [!!email.trim(),                                         'Имэйл хаягаа оруулна уу'],
      [email.trim().toLowerCase().endsWith('@gmail.com'),      'Зөвхөн Gmail хаягаар бүртгүүлэх боломжтой'],
      [!!phone.trim(),                                         'Утасны дугаараа оруулна уу'],
      [!!password,                                             'Нууц үгээ оруулна уу'],
      [password.length >= 6,                                   'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'],
      [password === confirmPassword,                           'Нууц үг таарахгүй байна'],
    ];
    for (const [ok, msg] of checks) {
      if (!ok) { Alert.alert('Анхааруулга', msg); return false; }
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim());
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.message ?? 'Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background layers */}
      <LinearGradient colors={['#0D1117', '#0A0A0E', '#080808']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOrb} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Header: back + brand ── */}
          <Animated.View style={[
            styles.headerRow,
            { opacity: headerAnim, transform: [{ translateY: headerSlide }] },
          ]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <View style={styles.backIconWrap}>
                <Icon name="arrow-left" size={18} color={WHITE} />
              </View>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              {/* Film reel dots */}
              <View style={styles.reelRow}>
                {[...Array(5)].map((_, i) => <View key={i} style={styles.reelDot} />)}
              </View>
              <Text style={styles.brandTitle}>ХОВД АЙМГИЙН</Text>
              <Text style={styles.brandSubtitle}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
              <View style={styles.goldLine} />
            </View>

            {/* Spacer to center brand */}
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* ── Form Card ── */}
          <Animated.View style={[
            styles.formCard,
            { opacity: formAnim, transform: [{ translateY: formSlide }] },
          ]}>
            {/* Top accent bar */}
            <View style={styles.cardAccentBar} />

            <View style={styles.cardInner}>
              <Text style={styles.formTitle}>Бүртгүүлэх</Text>
              <Text style={styles.formSubtitle}>Шинэ бүртгэл үүсгэх</Text>

              {/* Name */}
              <AnimatedInput
                label="НЭР"
                iconName="user"
                placeholder="Таны нэр"
                value={name}
                onChangeText={setName}
                delay={150}
              />

              {/* Email */}
              <AnimatedInput
                label="ИМЭЙЛ ХАЯГ"
                iconName="mail"
                placeholder="name@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                delay={220}
              />

              {/* Phone */}
              <AnimatedInput
                label="УТАСНЫ ДУГААР"
                iconName="phone"
                placeholder="9911xxxx"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                delay={290}
              />

              {/* Password */}
              <AnimatedInput
                label="НУУЦ ҮГ"
                iconName="lock"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                delay={360}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPwd(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name={showPwd ? 'eye-off' : 'eye'} size={15} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                }
              />
              {/* Strength meter under password */}
              <PasswordStrength password={password} />

              {/* Confirm Password */}
              <AnimatedInput
                label="НУУЦ ҮГ БАТАЛГААЖУУЛАХ"
                iconName="shield"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                delay={430}
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirm(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={15} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                }
              />

              {/* Submit */}
              <PressButton
                onPress={handleRegister}
                disabled={loading}
                loading={loading}
                label="БҮРТГҮҮЛЭХ"
                style={styles.submitButton}
                colors={['#1ECFBD', '#0D9488', '#0A7A6E']}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>эсвэл</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={startGoogleAuth}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.socialInner}>
                    <Icon name="google" size={17} color="#EA4335" />
                    <Text style={styles.socialButtonText}>Google-ээр бүртгүүлэх</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Login link */}
              <TouchableOpacity onPress={() => router.back()} style={styles.loginLink} activeOpacity={0.7}>
                <Text style={styles.loginText}>
                  Бүртгэлтэй юу?{' '}
                  <Text style={styles.loginHighlight}>Нэвтрэх</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  glowOrb: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(20,184,166,0.04)',
    top: -width * 0.3,
    alignSelf: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 44,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: { width: 40 },
  backIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  headerCenter: { alignItems: 'center' },
  reelRow: { flexDirection: 'row', gap: 5, marginBottom: 8 },
  reelDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(197,168,128,0.4)',
  },
  brandTitle: {
    fontSize: 15, fontWeight: '900',
    color: WHITE, letterSpacing: 6, marginBottom: 3,
  },
  brandSubtitle: {
    fontSize: 8, fontWeight: '700',
    color: GOLD, letterSpacing: 2,
    textAlign: 'center', marginBottom: 10,
  },
  goldLine: {
    width: 32, height: 1,
    backgroundColor: 'rgba(197,168,128,0.45)',
    alignSelf: 'center',
  },

  // ── Form Card ──
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  cardAccentBar: { height: 2, backgroundColor: TEAL, opacity: 0.6 },
  cardInner: {
    backgroundColor: 'rgba(15,16,20,0.95)',
    padding: 22,
  },

  formTitle: {
    fontSize: 20, fontWeight: '900',
    color: WHITE, letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    marginBottom: 20, fontStyle: 'italic',
  },

  // ── Inputs ──
  inputWrapper: { marginBottom: 14 },
  inputLabel: {
    fontSize: 9, fontWeight: '800',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 48,
  },
  input: {
    flex: 1, height: '100%',
    color: WHITE, fontSize: 14, fontWeight: '500',
  },

  // ── Password strength ──
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  strengthLabel: { fontSize: 10, fontWeight: '700', width: 40, textAlign: 'right' },

  // ── Submit button ──
  submitButton: {
    borderRadius: 12, overflow: 'hidden',
    marginTop: 6, marginBottom: 20,
    shadowColor: TEAL,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gradientButton: { height: 50, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: {
    color: '#0A0A0E', fontWeight: '900',
    fontSize: 13, letterSpacing: 1.5,
  },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText: {
    marginHorizontal: 12, color: 'rgba(255,255,255,0.22)',
    fontSize: 10, fontWeight: '600', letterSpacing: 0.5,
  },

  // ── Social button ──
  socialButton: {
    height: 50, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  outlineButton: { backgroundColor: 'rgba(255,255,255,0.04)' },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  socialButtonText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },

  // ── Login link ──
  loginLink: { alignItems: 'center' },
  loginText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  loginHighlight: { color: TEAL, fontWeight: '700' },
});