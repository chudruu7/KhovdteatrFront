import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<any>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        setToken(t);
        try {
          const profile = await authAPI.getProfile();
          setUser(profile.user || profile);
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
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
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const data = await authAPI.register(name, email, password, phone);
    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await clearToken();
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
