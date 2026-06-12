import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { safeBack } from '../../utils/navigation';
import { DEFAULT_AVATAR, SYSTEM_AVATARS } from '../../constants/avatars';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ONBOARDING_PENDING_KEY = 'kdt_onboarding_pending';
const ONBOARDING_SEEN_KEY = 'kdt_onboarding_seen';

function fieldError(message: string) {
  Alert.alert('Анхааруулга', message);
}

function getApiMessage(err: any) {
  return err?.response?.data?.message || err?.message || '';
}

function AvatarSelector({
  selectedId,
  onSelect,
  disabled,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const selectedAvatar = useMemo(
    () => SYSTEM_AVATARS.find((avatar) => avatar.id === selectedId) ?? SYSTEM_AVATARS[0],
    [selectedId]
  );

  return (
    <View style={styles.avatarPanel}>
      <Text style={styles.avatarLabel}>АВАТАР СОНГОХ</Text>

      <View style={styles.avatarPreviewWrap}>
        <Image source={{ uri: selectedAvatar.url }} style={styles.avatarPreview} />
        <View style={styles.avatarCheck}>
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.avatarChoices}>
        {SYSTEM_AVATARS.map((avatar) => {
          const selected = avatar.id === selectedId;
          return (
            <TouchableOpacity
              key={avatar.id}
              activeOpacity={0.82}
              disabled={disabled}
              onPress={() => onSelect(avatar.id)}
              style={[styles.avatarChoice, selected && styles.avatarChoiceSelected, disabled && styles.disabled]}
            >
              <Image source={{ uri: avatar.url }} style={styles.avatarChoiceImage} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Field({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
}: {
  label: string;
  icon: IconName;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={18} color="#8C92A3" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#7F8594"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor="#A855F7"
        />
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(SYSTEM_AVATARS[0].id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (profile: { name: string; email: string; avatarUrl?: string | null; providerId: string }) => {
      const data = await googleLogin(profile);
      if (data?.isNewUser) {
        await AsyncStorage.setItem(ONBOARDING_PENDING_KEY, '1');
        await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
      }
    },
    [googleLogin]
  );
  const { startGoogleAuth, googleLoading } = useGoogleAuth(handleGoogleSuccess);

  const validate = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!name.trim()) return fieldError('Нэрээ оруулна уу'), false;
    if (!trimmedEmail || !trimmedEmail.includes('@')) return fieldError('Хүчинтэй имэйл хаяг оруулна уу'), false;
    if (!trimmedEmail.endsWith('@gmail.com')) return fieldError('Зөвхөн Gmail хаягаар бүртгүүлэх боломжтой'), false;
    if (!password) return fieldError('Нууц үгээ оруулна уу'), false;
    if (password.length < 6) return fieldError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'), false;
    if (password !== confirmPassword) return fieldError('Нууц үгнүүд тохирохгүй байна'), false;
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const selectedAvatar = SYSTEM_AVATARS.find((avatar) => avatar.id === selectedAvatarId);
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        avatarUrl: selectedAvatar?.url ?? DEFAULT_AVATAR,
      });
      await AsyncStorage.setItem(ONBOARDING_PENDING_KEY, '1');
      await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      const message = getApiMessage(err);
      const readable = err?.response?.status === 409
        ? 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна. Нэвтрэх хэсгээр орно уу.'
        : message || 'Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.';
      Alert.alert('Алдаа', readable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#111827', '#070A12', '#1A1028']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => safeBack(router, '/(auth)/login')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={require('../../assets/kdt.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.backSpacer} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.brand}>ХОВД АЙМГИЙН ХӨГЖИМТ ДРАМЫН ТЕАТР</Text>
            <Text style={styles.subtitle}>Шинэ хэрэглэгчээр бүртгэл үүсгэх</Text>
          </View>

          <View style={styles.card}>
            <AvatarSelector selectedId={selectedAvatarId} onSelect={setSelectedAvatarId} disabled={loading} />

            <Field label="Нэр" icon="person-outline" placeholder="Өөрийн нэрээ оруулна уу" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field label="Имэйл" icon="mail-outline" placeholder="Имэйл@жишээ.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field label="Нууц үг" icon="lock-closed-outline" placeholder="Нууц үгээ оруулна уу" value={password} onChangeText={setPassword} secureTextEntry />
            <Text style={styles.helper}>Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой</Text>
            <Field label="Нууц үг баталгаажуулах" icon="shield-checkmark-outline" placeholder="Нууц үгээ дахин оруулна уу" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            <TouchableOpacity activeOpacity={0.9} disabled={loading} onPress={handleRegister} style={[styles.submit, loading && styles.disabled]}>
              <LinearGradient colors={['#9B35F4', '#3167F2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Бүртгүүлэх</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Эсвэл</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={startGoogleAuth} disabled={loading || googleLoading}>
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                  <Text style={styles.googleText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => safeBack(router, '/(auth)/login')} style={styles.loginLink}>
              <Text style={styles.loginText}>Бүртгэлтэй юу? <Text style={styles.loginHighlight}>Нэвтрэх</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#070A12' },
  glowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(155,53,244,0.22)',
    top: -120,
    right: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(49,103,242,0.16)',
    bottom: -100,
    left: -80,
  },
  scroll: { paddingTop: Platform.OS === 'ios' ? 58 : 42, paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 42 },
  logo: { width: 56, height: 56 },
  titleBlock: { alignItems: 'center', marginBottom: 22 },
  brand: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#B6BBC8', fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: 'rgba(7,10,18,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 26,
    padding: 18,
  },
  avatarPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.76)',
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  avatarLabel: { color: '#B9BCCA', textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  avatarPreviewWrap: { alignSelf: 'center', marginTop: 14, marginBottom: 16 },
  avatarPreview: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: '#A855F7' },
  avatarCheck: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B3DF4',
    borderWidth: 2,
    borderColor: '#10131E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChoices: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  avatarChoice: {
    width: 58,
    height: 58,
    borderRadius: 17,
    overflow: 'hidden',
    opacity: 0.45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarChoiceSelected: { opacity: 1, borderWidth: 2, borderColor: '#A855F7', transform: [{ scale: 1.08 }] },
  avatarChoiceImage: { width: '100%', height: '100%' },
  field: { marginBottom: 16 },
  fieldLabel: { color: '#D5D8E2', fontSize: 14, fontWeight: '800', marginBottom: 9 },
  inputShell: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, height: '100%', color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  helper: { color: '#777D8F', fontSize: 12, marginTop: -9, marginBottom: 16 },
  submit: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  submitGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: '#A8ADBA', fontSize: 13 },
  googleButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { color: '#A8ADBA', fontSize: 14 },
  loginHighlight: { color: '#A855F7', fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
