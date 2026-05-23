// app/(auth)/register.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  ImageBackground, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '../../api/firebase';

const { width, height } = Dimensions.get('window');
const iconMap: Record<string, any> = {
  'arrow-left': 'arrow-back',
  'user-plus': 'person-add-outline',
  user: 'person-outline',
  mail: 'mail-outline',
  phone: 'call-outline',
  lock: 'lock-closed-outline',
  shield: 'shield-checkmark-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  google: 'logo-google',
};
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Ionicons name={iconMap[name] || 'ellipse-outline'} size={size} color={color} />
);

export default function RegisterScreen() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Анхааруулга', 'Нэрээ оруулна уу');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Анхааруулга', 'Имэйл хаягаа оруулна уу');
      return false;
    }
    if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      Alert.alert('Анхааруулга', 'Зөвхөн Gmail хаягаар бүртгүүлэх боломжтой');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Анхааруулга', 'Утасны дугаараа оруулна уу');
      return false;
    }
    if (!password) {
      Alert.alert('Анхааруулга', 'Нууц үгээ оруулна уу');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Анхааруулга', 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Анхааруулга', 'Нууц үг таарахгүй байна');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim());
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.';
      Alert.alert('Алдаа', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Google бүртгэл', 'Google бүртгэл mobile web дээр идэвхтэй. Native app-д Expo OAuth тохиргоо хэрэгтэй.');
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('Google бүртгэлээс имэйл авах боломжгүй байна.');
      }
      if (!firebaseUser.email.toLowerCase().endsWith('@gmail.com')) {
        throw new Error('Зөвхөн Gmail хаягаар бүртгүүлэх боломжтой.');
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
          ? 'Google бүртгэлийн цонх хаагдлаа.'
          : error?.response?.data?.message || error?.message || 'Google-р бүртгүүлэхэд алдаа гарлаа.';
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
      <LinearGradient
        colors={['rgba(0,0,0,0.88)', 'rgba(0,0,0,0.96)']}
        style={styles.overlay}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Буцах товч */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={20} color="#fff" />
              <Text style={styles.backText}>Буцах</Text>
            </TouchableOpacity>

            {/* Лого хэсэг */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.coral, '#e74c3c']}
                style={styles.logoCircle}
              >
                <Icon name="user-plus" size={36} color="#fff" />
              </LinearGradient>
            </View>

            {/* Форм карт */}
            <View style={styles.formCard}>
              <Text style={styles.title}>Бүртгүүлэх</Text>
              <Text style={styles.subtitle}>Шинэ бүртгэл үүсгэх</Text>

              {/* Нэр */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>НЭР</Text>
                <View style={styles.inputContainer}>
                  <Icon name="user" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Таны нэр"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    selectionColor={COLORS.teal}
                  />
                </View>
              </View>

              {/* Имэйл */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ИМЭЙЛ</Text>
                <View style={styles.inputContainer}>
                  <Icon name="mail" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={COLORS.teal}
                  />
                </View>
              </View>

              {/* Утас */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>УТАС</Text>
                <View style={styles.inputContainer}>
                  <Icon name="phone" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="9911xxxx"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    selectionColor={COLORS.teal}
                  />
                </View>
              </View>

              {/* Нууц үг */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>НУУЦ ҮГ</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    selectionColor={COLORS.teal}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name={showPassword ? "eye-off" : "eye"} size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Нууц үг баталгаажуулах */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>НУУЦ ҮГ БАТАЛГААЖУУЛАХ</Text>
                <View style={styles.inputContainer}>
                  <Icon name="shield" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    selectionColor={COLORS.teal}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Бүртгүүлэх товч */}
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister} 
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.teal, '#0d9488']}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Бүртгүүлэх</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Тусгаарлагч */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Эсвэл</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Сошиал бүртгэл */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialIconButton} onPress={handleGoogleRegister} disabled={loading}>
                  <Icon name="google" size={24} color="#fff" />
                  <Text style={styles.socialText}>Google-р нэвтрэх</Text>
                </TouchableOpacity>
              </View>

              {/* Нэвтрэх холбоос */}
              <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
                <Text style={styles.loginText}>
                  Бүртгэлтэй юу? <Text style={styles.loginHighlight}>Нэвтрэх</Text>
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
  background: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  backText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: SPACING.lg,
  },
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
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    color: COLORS.white,
    fontSize: 15,
  },
  registerButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  gradientButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  socialIconButton: {
    minWidth: 180,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginHighlight: {
    color: COLORS.teal,
    fontWeight: '700',
  },
});
