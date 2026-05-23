import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, USER_KEY } from '../api';
import { Platform } from 'react-native';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (profile: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    providerId: string;
  }) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const TOKEN_KEY = 'token';

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
};

const saveToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
};

const clearToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};

const saveUser = async (user: any) => {
  if (Platform.OS === 'web') localStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearUser = async () => {
  if (Platform.OS === 'web') localStorage.removeItem(USER_KEY);
  else await AsyncStorage.removeItem(USER_KEY);
};

const getSavedUser = async () => {
  const raw = Platform.OS === 'web'
    ? localStorage.getItem(USER_KEY)
    : await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<any>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistAuth = async (data: { token: string; user: any }) => {
    await saveToken(data.token);
    await saveUser(data.user);
    setToken(data.token);
    setUser(data.user);
  };

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        setToken(t);
        try {
          const cachedUser = await getSavedUser();
          if (cachedUser) setUser(cachedUser);
          const profile = await authAPI.getProfile();
          const freshUser = profile.user || profile;
          setUser(freshUser);
          await saveUser(freshUser);
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    await persistAuth(data);
  };

  const googleLogin = async (profile: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    providerId: string;
  }) => {
    const data = await authAPI.socialLogin({
      ...profile,
      provider: 'google',
    });
    await persistAuth(data);
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const data = await authAPI.register(name, email, password, phone);
    await persistAuth(data);
  };

  const logout = async () => {
    await clearToken();
    await clearUser();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
