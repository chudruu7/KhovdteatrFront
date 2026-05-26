import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:5000/api` : 'http://localhost:5000/api';
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
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
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
  register: async (name: string, email: string, password: string, phone: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone });
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

  // Кино + өдрөөр — хэрэгтэй бол
  getByMovieAndDate: async (movieId: string, date: string) => {
    if (!movieId) {
      const { data } = await api.get(`/schedules?date=${date}`);
      return data;
    }
    const { data } = await api.get(`/schedules/${movieId}?date=${date}`);
    return data;
  },

  // Киноны бүх хуваарь
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
};

export const qpayAPI = {
  createInvoice: async (payload: any) => {
    const { data } = await api.post('/qpay/invoice', payload);
    return data;
  },
  checkPayment: async (invoiceId: string) => {
    const { data } = await api.get(`/qpay/payment/${invoiceId}`);
    return data;
  },
  confirmBooking: async (bookingId: string) => {
    const { data } = await api.post(`/bookings/${bookingId}/confirm`, {});
    return data;
  },
  cancelBooking: async (bookingId: string) => {
    const { data } = await api.post(`/bookings/${bookingId}/cancel`, {});
    return data;
  },
  cancelInvoice: async (invoiceId: string) => {
    const { data } = await api.delete(`/qpay/invoice/${invoiceId}`);
    return data;
  },
};

export default api;
