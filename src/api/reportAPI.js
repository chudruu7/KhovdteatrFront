// ================================================================
// reportAPI.js
// Байршил: frontend/src/api/reportAPI.js
// ================================================================

import { api } from './config.js'; // ← axios-г устгаж, config-оос api авна

// ─── Туслах: query string үүсгэх ──────────────────────────
const toParams = (filters = {}) => {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.append(k, v);
  });
  return p.toString() ? `?${p.toString()}` : '';
};

// ================================================================
// DASHBOARD
// ================================================================
export const getDashboard = (filters) =>
  api.get(`/reports/dashboard${toParams(filters)}`);

// ================================================================
// САНХҮҮГИЙН ТАЙЛАН
// ================================================================
export const getDailySales     = (filters) => api.get(`/reports/financial/daily${toParams(filters)}`);
export const getMonthlySales   = (filters) => api.get(`/reports/financial/monthly${toParams(filters)}`);
export const getPaymentMethods = (filters) => api.get(`/reports/financial/payment-methods${toParams(filters)}`);
export const getRefunds        = (filters) => api.get(`/reports/financial/refunds${toParams(filters)}`);

// ================================================================
// КИНО БА ҮЗЭЛТИЙН ТАЙЛАН
// ================================================================
export const getMovieViewership     = (filters) => api.get(`/reports/movies/viewership${toParams(filters)}`);
export const getTopMovies           = (filters) => api.get(`/reports/movies/top${toParams(filters)}`);
export const getNewReleases         = (filters) => api.get(`/reports/movies/new-releases${toParams(filters)}`);
export const getSchedulePerformance = (filters) => api.get(`/reports/movies/schedule-performance${toParams(filters)}`);

// ================================================================
// ТАСАЛБАР ЗАХИАЛГЫН ТАЙЛАН
// ================================================================
export const getBookingChannels = (filters) => api.get(`/reports/tickets/channels${toParams(filters)}`);
export const getAdvanceBooking  = (filters) => api.get(`/reports/tickets/advance${toParams(filters)}`);
export const getSeatTypes       = (filters) => api.get(`/reports/tickets/seat-types${toParams(filters)}`);
export const getDiscounts       = (filters) => api.get(`/reports/tickets/discounts${toParams(filters)}`);

// ================================================================
// ТАНХИМ БА ДҮҮРГЭЛТИЙН ТАЙЛАН
// ================================================================
export const getHallOccupancy = (filters) => api.get(`/reports/halls/occupancy${toParams(filters)}`);
export const getPeakHours     = (filters) => api.get(`/reports/halls/peak-hours${toParams(filters)}`);
export const getLostRevenue   = (filters) => api.get(`/reports/halls/lost-revenue${toParams(filters)}`);

// ================================================================
// ҮЗЭГЧ БА ИДЭВХИЙН ТАЙЛАН
// ================================================================
export const getUserActivity  = (filters) => api.get(`/reports/audience/activity${toParams(filters)}`);
export const getLoyaltyReport = (filters) => api.get(`/reports/audience/loyalty${toParams(filters)}`);
export const getDemographics  = (filters) => api.get(`/reports/audience/demographics${toParams(filters)}`);
export const getCancellations = (filters) => api.get(`/reports/audience/cancellations${toParams(filters)}`);