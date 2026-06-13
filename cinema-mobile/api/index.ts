import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = () => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl;

  if (Platform.OS === 'web') {
    return 'https://khovdteatrbackend.onrender.com/api';
  }

  return 'https://khovdteatrbackend.onrender.com/api';
};

export const BASE_URL = __DEV__
  ? getDevApiUrl()
  : 'https://khovdteatrbackend.onrender.com/api';

export const USER_KEY = 'user';
const TOKEN_KEY = 'token';

const getStoredToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableWakeupError = (error: any) => {
  const status = error?.response?.status;
  return !error?.response || status === 502 || status === 503 || status === 504;
};

api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const method = String(config?.method || 'get').toLowerCase();
    const canRetry = method === 'get' || method === 'head';

    if (!config || !canRetry || !isRetryableWakeupError(error)) {
      return Promise.reject(error);
    }

    const retryConfig = config as typeof config & { __retryCount?: number };
    retryConfig.__retryCount = Number(retryConfig.__retryCount || 0) + 1;
    if (retryConfig.__retryCount > 4) {
      error.message = 'Back-end server асаж байна. Түр хүлээгээд дахин оролдоно уу.';
      return Promise.reject(error);
    }

    await sleep(3500 * retryConfig.__retryCount);
    return api(retryConfig);
  }
);

// ─── AUTH API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  socialLogin: async (payload: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    provider: 'google' | 'facebook' | 'apple';
    providerId: string;
  }) => {
    const { data } = await api.post('/auth/social-login', payload);
    return data;
  },
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const cashierAPI = {
  getTicket: async (bookingId: string) => {
    const { data } = await api.get(`/cashier/tickets/${bookingId}`);
    return data;
  },
  admitTicket: async (bookingId: string) => {
    const { data } = await api.post(`/cashier/tickets/${bookingId}/admit`, {});
    return data;
  },
  submitStationScan: async (stationKey: string, qrData: string) => {
    const { data } = await api.post(`/cashier/stations/${stationKey}/scans`, { qrData });
    return data;
  },
};

// ─── MOVIE API ─────────────────────────────────────────────────────────────────
export const movieAPI = {
  getAll: async () => {
    const { data } = await api.get('/movies');
    return data;
  },
  getNowPlaying: async () => {
    const { data } = await api.get('/movies?status=nowShowing');
    return data;
  },
  getComingSoon: async () => {
    const { data } = await api.get('/movies?status=comingSoon');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/movies/${id}`);
    return data;
  },
  search: async (query: string) => {
    const { data } = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
    return data;
  },
};

export const newsAPI = {
  getAll: async (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {})
    ).toString();
    const { data } = await api.get(`/news${qs ? `?${qs}` : ''}`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/news/${id}`);
    return data;
  },
};

// ─── SCHEDULE API ──────────────────────────────────────────────────────────────
export const scheduleAPI = {
  // Өдрөөр хуваарь — schedule.tsx ашиглана
  getByDate: async (date: string) => {
    const { data } = await api.get(`/schedules?date=${date}`);
    return data;
  },

  // Үзвэр + өдрөөр — хэрэгтэй бол
  getByMovieAndDate: async (movieId: string, date: string) => {
    if (!movieId) {
      const { data } = await api.get(`/schedules?date=${date}`);
      return data;
    }
    const { data } = await api.get(`/schedules/${movieId}?date=${date}`);
    return data;
  },

  // Үзвэрийн бүх хуваарь
  getByMovie: async (movieId: string) => {
    const { data } = await api.get(`/schedules/${movieId}`);
    return data;
  },

  // Суудлын мэдээлэл
  getSeats: async (scheduleId: string) => {
    const { data } = await api.get(`/schedules/seats/${scheduleId}`);
    return data;
  },
};

// ─── BOOKING API ───────────────────────────────────────────────────────────────
export const bookingAPI = {
  create: async (payload: any) => {
    const { data } = await api.post('/bookings', payload);
    return data;
  },
  getMine: async () => {
    const { data } = await api.get('/bookings/my-history');
    return data;
  },
  getById: async (bookingId: string) => {
    const { data } = await api.get(`/bookings/${bookingId}`);
    return data;
  },
  resendConfirmation: async (bookingId: string) => {
    const { data } = await api.post(`/bookings/${bookingId}/resend-confirmation`, {});
    return data;
  },
  cancelBooking: async (bookingId: string) => {
    const { data } = await api.post(`/bookings/${bookingId}/cancel`, {});
    return data;
  },
};

export const wireAPI = {
  createCheckout: async (payload: { bookingId: string; successUrl?: string }) => {
    const { data } = await api.post('/wire/checkout', payload);
    return data;
  },
  checkPaymentStatus: async (bookingId: string) => {
    const { data } = await api.get(`/wire/payments/${bookingId}/status`, { timeout: 15000 });
    return data;
  },
};

export default api;
