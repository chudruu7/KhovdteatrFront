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
  mail:      'mail-outline',
  lock:      'lock-closed-outline',
  eye:       'eye-outline',
  'eye-off': 'eye-off-outline',
  google:    'logo-google',
  arrow:     'arrow-forward-outline',
};
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Ionicons name={ICONS[name] ?? 'ellipse-outline'} size={size} color={color} />
);

// ─── Animated Input Field ────────────────────────────────────────────────────
function AnimatedInput({
  iconName, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize,
  rightElement, delay = 0,
}: {
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
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1, duration: 600, delay, useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0, duration: 600, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onFocus = () =>
    Animated.timing(focusAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  const onBlur  = () =>
    Animated.timing(focusAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E3E7EE', '#C5A880'],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F8FAFC', '#FFF8E8'],
  });
  const scale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <Animated.View style={[
      styles.inputWrapper,
      { opacity: entranceAnim, transform: [{ translateY: translateAnim }] }
    ]}>
      <Animated.View style={[styles.inputContainer, { borderColor, backgroundColor: bgColor, transform: [{ scale }] }]}>
        <View style={{ marginRight: 12 }}>
          <AnimatedIcon name={iconName} focusAnim={focusAnim} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor="#C5A880"
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
  const [color, setColor] = useState('#6B7280');
  useEffect(() => {
    const id = focusAnim.addListener(({ value }) => {
      const r = Math.round(107 * (1 - value) + 197 * value);
      const g = Math.round(114 * (1 - value) + 168 * value);
      const b = Math.round(128 * (1 - value) + 128 * value);
      setColor(`rgb(${r},${g},${b})`);
    });
    return () => focusAnim.removeListener(id);
  }, [focusAnim]);
  return <Icon name={name} size={18} color={color} />;
}

// ─── Modern Gradient Button with shine effect ────────────────────────────────
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
  const shineAnim = useRef(new Animated.Value(-100)).current;
  
  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, bounciness: 0 }).start();
    // Trigger shine animation
    Animated.timing(shineAnim, { toValue: width, duration: 600, useNativeDriver: true }).start();
    setTimeout(() => shineAnim.setValue(-100), 600);
  };
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 0 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <LinearGradient 
          colors={colors || ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']} 
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color={colors ? "#000" : "#C5A880"} size="small" />
          ) : (
            <>
              <Text style={[colors ? styles.loginButtonText : styles.socialButtonText, textStyle]}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Animated dots background ─────────────────────────────────────────────────
function AnimatedBackground() {
  const dotsAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  
  const translateX = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.3],
  });
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F7FBFF', '#FFF9EF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.dotsGrid, { transform: [{ translateX }] }]}>
        {[...Array(50)].map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </Animated.View>
      <View style={styles.softAccent} />
      <View style={styles.softAccent2} />
    </View>
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
  const logoSlide  = useRef(new Animated.Value(-40)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const formSlide  = useRef(new Animated.Value(50)).current;
  const ornamentAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeIn, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(logoAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(ornamentAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <AnimatedBackground />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Logo ── */}
          <Animated.View style={[
            styles.logoContainer,
            { opacity: logoAnim, transform: [{ translateY: logoSlide }] }
          ]}>
            <Animated.View style={[styles.reelRow, { opacity: ornamentAnim }]}>
              <LinearGradient colors={['#C5A880', '#E8D5A4']} style={styles.reelDotBig} />
              <LinearGradient colors={['#8B1E2D', '#B23A48']} style={styles.reelDotBig} />
              <LinearGradient colors={['#C5A880', '#E8D5A4']} style={styles.reelDotBig} />
            </Animated.View>

            <View style={styles.logoBorder}>
              <LinearGradient
                colors={['rgba(197,168,128,0.24)', 'rgba(139,30,45,0.24)']}
                style={styles.logoGradient}
              />
              <Image
                source={require('../../assets/kdt.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brandTitle}>ХОВД АЙМГИЙН</Text>
            <Text style={styles.brandSubtitle}>ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
            <View style={styles.goldLine} />
          </Animated.View>

          {/* ── Form Card ── */}
          <Animated.View style={[
            styles.formCard,
            { opacity: formAnim, transform: [{ translateY: formSlide }] }
          ]}>
            <LinearGradient
              colors={['#FFFFFF', '#FBFCFE']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardInner}>
                <Text style={styles.welcomeTitle}>Нэвтрэх</Text>
                <Text style={styles.welcomeSubtitle}>Үргэлжлүүлэхийн тулд нэвтэрнэ үү</Text>

                {/* Inputs */}
                <AnimatedInput
                  iconName="mail"
                  placeholder="Имэйл хаягаа оруулна уу"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  delay={100}
                />

                <AnimatedInput
                  iconName="lock"
                  placeholder="Нууц үгээ оруулна уу"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  delay={200}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPwd(p => !p)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Icon
                        name={showPwd ? 'eye-off' : 'eye'}
                        size={18}
                        color="#6B7280"
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
                  colors={['#C5A880', '#A47C42']}
                />

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ЭСВЭЛ</Text>
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
                    <ActivityIndicator color="#C5A880" size="small" />
                  ) : (
                    <View style={styles.socialInner}>
                      <Icon name="google" size={20} color="#EA4335" />
                      <Text style={styles.socialButtonText}>Google-р нэвтрэх</Text>
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
                    Бүртгэлгүй хэрэглэгч үү?{' '}
                    <Text style={styles.registerHighlight}>Бүртгүүлэх</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const TEAL   = '#C5A880';
const GOLD   = '#C5A880';
const WHITE  = '#FFFFFF';
const TEXT   = '#111827';
const MUTED  = '#5F6673';
const BG     = '#F7FBFF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Animated Background
  dotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.04,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    width: 2,
    height: 2,
    backgroundColor: '#C5A880',
    margin: 8,
    borderRadius: 1,
  },
  softAccent: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(197,168,128,0.18)',
    top: -height * 0.3,
    right: -width * 0.5,
    shadowColor: GOLD,
    shadowRadius: 120,
    shadowOpacity: 0.12,
  },
  softAccent2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(139,30,45,0.08)',
    bottom: -height * 0.2,
    left: -width * 0.3,
    shadowColor: '#8B1E2D',
    shadowRadius: 100,
    shadowOpacity: 0.08,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },

  // ── Logo block ──
  logoContainer: { alignItems: 'center', marginBottom: 28 },

  reelRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  reelDotBig: {
    width: 6, height: 6, borderRadius: 3,
  },

  logoBorder: {
    width: 110, height: 110,
    borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: TEAL,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'hidden',
  },
  logoGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  brandLogo: { width: 90, height: 90 },

  brandTitle: {
    fontSize: 20, fontWeight: '800',
    color: TEXT, letterSpacing: 4,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandSubtitle: {
    fontSize: 9, fontWeight: '700',
    color: GOLD, letterSpacing: 2.5,
    textAlign: 'center', marginBottom: 14,
  },
  goldLine: {
    width: 60, height: 2,
    backgroundColor: 'rgba(197,168,128,0.4)',
    borderRadius: 1,
  },

  // ── Form Card (Premium Glassmorphism) ──
  formCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    shadowColor: '#8A93A3',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 15,
  },
  cardGradient: {
    borderRadius: 32,
  },
  cardInner: {
    padding: 28,
  },

  welcomeTitle: {
    fontSize: 28, fontWeight: '800',
    color: TEXT, letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14, color: MUTED,
    marginBottom: 32,
    fontWeight: '500',
  },

  // ── Inputs ──
  inputWrapper: { marginBottom: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 18, height: 58,
  },
  input: {
    flex: 1, height: '100%',
    color: TEXT, fontSize: 15, fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Forgot
  forgotButton: { alignSelf: 'flex-end', marginBottom: 28, marginTop: 8 },
  forgotText: { color: TEAL, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Login button
  loginButton: {
    borderRadius: 20, overflow: 'hidden',
    marginBottom: 24,
    shadowColor: TEAL,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  gradientButton: { 
    height: 58, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row',
    gap: 8,
  },
  loginButtonText: {
    color: '#020305', fontWeight: '800',
    fontSize: 15, letterSpacing: 1.5,
  },
  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E6EAF0' },
  dividerText: {
    marginHorizontal: 16, color: '#7A8290',
    fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
  },

  // Social button
  socialButton: {
    height: 54, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E6EAF0',
    marginBottom: 28,
  },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialButtonText: { color: TEXT, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  // Register
  registerLink: { alignItems: 'center' },
  registerText: { color: MUTED, fontSize: 14, fontWeight: '500' },
  registerHighlight: { color: TEAL, fontWeight: '700', letterSpacing: 0.3 },
});
