import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Dimensions, StatusBar, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Typed Icon helper ───────────────────────────────────────────────────────
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<string, IconName> = {
  mail:     'mail-outline',
  lock:     'lock-closed-outline',
  eye:      'eye-outline',
  'eye-off':'eye-off-outline',
  google:   'logo-google',
};
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Ionicons name={ICONS[name] ?? 'ellipse-outline'} size={size} color={color} />
);

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
  const focusAnim   = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1, duration: 500, delay, useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0, duration: 500, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onFocus = () =>
    Animated.timing(focusAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  const onBlur  = () =>
    Animated.timing(focusAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', COLORS.teal],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.03)', 'rgba(20,184,166,0.05)'],
  });
  const iconColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.25)', COLORS.teal],
  });

  return (
    <Animated.View style={[
      styles.inputWrapper,
      { opacity: entranceAnim, transform: [{ translateY: translateAnim }] }
    ]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputContainer, { borderColor, backgroundColor: bgColor }]}>
        <Animated.View style={{ marginRight: 12 }}>
          {/* Ionicons can't take Animated color directly — use JS interpolation via listener */}
          <AnimatedIcon name={iconName} focusAnim={focusAnim} />
        </Animated.View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.18)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={COLORS.teal}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {rightElement}
      </Animated.View>
    </Animated.View>
  );
}

// Animated icon color workaround for Ionicons
function AnimatedIcon({ name, focusAnim }: { name: string; focusAnim: Animated.Value }) {
  const [color, setColor] = useState('rgba(255,255,255,0.25)');
  useEffect(() => {
    const id = focusAnim.addListener(({ value }) => {
      const r = Math.round(255 * (1 - value) + 20 * value);
      const g = Math.round(255 * (1 - value) + 184 * value);
      const b = Math.round(255 * (1 - value) + 166 * value);
      const a = (0.25 * (1 - value) + 1 * value).toFixed(2);
      setColor(`rgba(${r},${g},${b},${a})`);
    });
    return () => focusAnim.removeListener(id);
  }, [focusAnim]);
  return <Icon name={name} size={16} color={color} />;
}

// ─── Pressable Button with scale feedback ────────────────────────────────────
function PressButton({
  onPress, disabled, loading, label, style, textStyle, colors,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  style?: any;
  textStyle?: any;
  colors?: readonly [string, string, ...string[]];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {colors ? (
          <LinearGradient colors={colors} style={styles.gradientButton}>
            {loading
              ? <ActivityIndicator color="#0A0A0E" size="small" />
              : <Text style={[styles.loginButtonText, textStyle]}>{label}</Text>
            }
          </LinearGradient>
        ) : (
          <View style={styles.gradientButton}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[styles.socialButtonText, textStyle]}>{label}</Text>
            }
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router          = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // Entrance animations
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const logoSlide  = useRef(new Animated.Value(-24)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const formSlide  = useRef(new Animated.Value(32)).current;
  const ornamentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(logoAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(ornamentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim,  { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGoogleSuccess = useCallback(
    async (p: { name: string; email: string; avatarUrl?: string | null; providerId: string }) => {
      await googleLogin(p);
    }, [googleLogin]
  );
  const { startGoogleAuth, googleLoading } = useGoogleAuth(handleGoogleSuccess);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Анхааруулга', 'Имэйл хаягаа оруулна уу');
    if (!password)     return Alert.alert('Анхааруулга', 'Нууц үгээ оруулна уу');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.message ?? 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Layered background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0D1117', '#0A0A0E', '#080808']}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative teal glow orb */}
        <View style={styles.glowOrb} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Brand Logo ── */}
          <Animated.View style={[
            styles.logoContainer,
            { opacity: logoAnim, transform: [{ translateY: logoSlide }] }
          ]}>
            {/* Decorative film-reel dots */}
            <Animated.View style={[styles.reelRow, { opacity: ornamentAnim }]}>
              {[...Array(5)].map((_, i) => <View key={i} style={styles.reelDot} />)}
            </Animated.View>

            <View style={styles.logoBorder}>
              <Image
                source={require('../../assets/kdt.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brandTitle}>ХОВД АЙМГИЙН</Text>
            <Text style={styles.brandSubtitle}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>

            {/* Gold accent line */}
            <View style={styles.goldLine} />
          </Animated.View>

          {/* ── Form Card ── */}
          <Animated.View style={[
            styles.formCard,
            { opacity: formAnim, transform: [{ translateY: formSlide }] }
          ]}>
            {/* Card top accent */}
            <View style={styles.cardAccentBar} />

            <View style={styles.cardInner}>
              <Text style={styles.welcomeTitle}>Нэвтрэх</Text>
              <Text style={styles.welcomeSubtitle}>
                Нэвтэрнэ үү
              </Text>

              {/* Inputs */}
              <AnimatedInput
                label="ИМЭЙЛ ХАЯГ"
                iconName="mail"
                placeholder="И-мэйл хаягаа оруулна уу"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                delay={200}
              />

              <AnimatedInput
                label="НУУЦ ҮГ"
                iconName="lock"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                delay={300}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPwd(p => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon
                      name={showPwd ? 'eye-off' : 'eye'}
                      size={16}
                      color="rgba(255,255,255,0.3)"
                    />
                  </TouchableOpacity>
                }
              />

              {/* Forgot */}
              <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Нууц үгээ мартсан уу?</Text>
              </TouchableOpacity>

              {/* Login CTA */}
              <PressButton
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                label="НЭВТРЭХ"
                style={styles.loginButton}
                colors={['#1ECFBD', '#0D9488', '#0A7A6E']}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>эсвэл</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
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
                    <Text style={styles.socialButtonText}>Google-ээр нэвтрэх</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Register */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.registerLink}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>
                  Шинэ хэрэглэгч үү?{' '}
                  <Text style={styles.registerHighlight}>Бүртгэл үүсгэх</Text>
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
const TEAL   = '#14B8A6';
const GOLD   = '#C5A880';
const WHITE  = '#FFFFFF';
const BG     = '#0A0A0E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Glow orb behind form
  glowOrb: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(20,184,166,0.045)',
    top: height * 0.15,
    alignSelf: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 44,
  },

  // ── Logo block ──
  logoContainer: { alignItems: 'center', marginBottom: 28 },

  reelRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  reelDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(197,168,128,0.35)',
  },

  logoBorder: {
    width: 96, height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(197,168,128,0.2)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 14,
    shadowColor: TEAL,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  brandLogo: { width: 80, height: 80 },

  brandTitle: {
    fontSize: 20, fontWeight: '900',
    color: WHITE, letterSpacing: 6,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 9, fontWeight: '700',
    color: GOLD, letterSpacing: 2.5,
    textAlign: 'center', marginBottom: 14,
  },
  goldLine: {
    width: 40, height: 1,
    backgroundColor: 'rgba(197,168,128,0.45)',
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
  cardAccentBar: {
    height: 2,
    backgroundColor: TEAL,
    opacity: 0.6,
  },
  cardInner: {
    backgroundColor: 'rgba(15,16,20,0.95)',
    padding: 24,
  },

  welcomeTitle: {
    fontSize: 22, fontWeight: '900',
    color: WHITE, letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    marginBottom: 24, lineHeight: 18,
    fontStyle: 'italic',
  },

  // ── Inputs ──
  inputWrapper: { marginBottom: 18 },
  inputLabel: {
    fontSize: 9, fontWeight: '800',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 7,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 50,
  },
  input: {
    flex: 1, height: '100%',
    color: WHITE, fontSize: 14, fontWeight: '500',
  },

  // Forgot
  forgotButton: { alignSelf: 'flex-end', marginBottom: 22, marginTop: 2 },
  forgotText: { color: TEAL, fontSize: 12, fontWeight: '600' },

  // Login button
  loginButton: {
    borderRadius: 12, overflow: 'hidden',
    marginBottom: 22,
    shadowColor: TEAL,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gradientButton: { height: 50, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: {
    color: '#0A0A0E', fontWeight: '900',
    fontSize: 13, letterSpacing: 1.5,
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText: {
    marginHorizontal: 12, color: 'rgba(255,255,255,0.22)',
    fontSize: 10, fontWeight: '600', letterSpacing: 0.5,
  },

  // Social button
  socialButton: {
    height: 50, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 26,
  },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  socialButtonText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },

  // Register
  registerLink: { alignItems: 'center' },
  registerText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  registerHighlight: { color: TEAL, fontWeight: '700' },
});