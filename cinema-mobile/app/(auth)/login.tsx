import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  ImageBackground, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const iconMap: Record<string, IconName> = {
  film: 'film-outline',
  mail: 'mail-outline',
  lock: 'lock-closed-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  facebook: 'logo-facebook',
  google: 'logo-google',
  apple: 'logo-apple',
};

const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Ionicons name={iconMap[name] || 'ellipse-outline'} size={size} color={color} />
);

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Анхааруулга', 'Имэйл хаягаа оруулна уу');
      return;
    }
    if (!password) {
      Alert.alert('Анхааруулга', 'Нууц үгээ оруулна уу');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.';
      Alert.alert('Алдаа', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Google нэвтрэлт', 'Google нэвтрэлт mobile web дээр идэвхтэй. Native app-д Expo OAuth тохиргоо хэрэгтэй.');
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('Google бүртгэлээс имэйл авах боломжгүй байна.');
      }

      await googleLogin({
        name: firebaseUser.displayName || 'Хэрэглэгч',
        email: firebaseUser.email,
        avatarUrl: firebaseUser.photoURL,
        providerId: firebaseUser.uid,
      });
    } catch (error: any) {
      const code = error?.code || '';
      const message =
        code === 'auth/popup-closed-by-user'
          ? 'Google нэвтрэх цонх хаагдлаа.'
          : error?.response?.data?.message || error?.message || 'Google-р нэвтрэхэд алдаа гарлаа.';
      Alert.alert('Алдаа', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format' }}
      style={styles.background}
    >
      <LinearGradient colors={['rgba(0,0,0,0.88)', 'rgba(0,0,0,0.96)']} style={styles.overlay}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={[COLORS.coral, '#e74c3c']} style={styles.logoCircle}>
                <Icon name="film" size={42} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandName}>ХОВД КИНО</Text>
              <Text style={styles.brandSubtitle}>Кино театрын захиалгын систем</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.welcomeTitle}>Тавтай морил</Text>
              <Text style={styles.welcomeSubtitle}>Нэвтрэх</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ИМЭЙЛ</Text>
                <View style={styles.inputContainer}>
                  <Icon name="mail" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="И-мэйл хаяг"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={COLORS.teal}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>НУУЦ ҮГ</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Нууц үг"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    selectionColor={COLORS.teal}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Нууц үгээ мартсан уу?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[COLORS.teal, '#0d9488']} style={styles.gradientButton}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.loginButtonText}>Нэвтрэх</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Эсвэл</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialIconButton}>
                  <Icon name="facebook" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIconButton} onPress={handleGoogleLogin} disabled={loading}>
                  <Icon name="google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIconButton}>
                  <Icon name="apple" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
                <Text style={styles.registerText}>
                  Бүртгэл үүсгэх үү? <Text style={styles.registerHighlight}>Бүртгүүлэх</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width, height },
  overlay: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xxl,
  },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: { fontSize: 26, fontWeight: '800', color: COLORS.white, letterSpacing: 2, marginBottom: SPACING.xs },
  brandSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  welcomeTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, marginBottom: SPACING.sm },
  welcomeSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: SPACING.xl },
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.white, fontSize: 15 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: SPACING.xl },
  forgotText: { color: COLORS.teal, fontSize: 13, fontWeight: '500' },
  loginButton: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  gradientButton: { paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { marginHorizontal: SPACING.md, color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginBottom: SPACING.xl },
  socialIconButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  registerLink: { alignItems: 'center' },
  registerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  registerHighlight: { color: COLORS.teal, fontWeight: '700' },
});
