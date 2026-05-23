import api, { setToken, removeToken, USER_KEY } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// ─── AUTH FUNCTIONS ────────────────────────────────────────────────────────────

/** Нэвтрэх */
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  await setToken(data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
};

/** Бүртгүүлэх */
export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  await setToken(data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
};

/** Гарах */
export const logout = async (): Promise<void> => {
  await removeToken();
};

/** Одоогийн хэрэглэгчийн мэдээлэл авах */
export const getMe = async (): Promise<User> => {
  const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
  return data.user;
};

/** AsyncStorage-с хэрэглэгч унших (offline) */
export const getCachedUser = async (): Promise<User | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
