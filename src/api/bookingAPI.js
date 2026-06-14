import { api } from './config';

const bookingAPI = {
  getAll: async () => {
    try {
      const data = await api.get('/bookings');
      return { success: true, bookings: data.bookings || data };
    } catch (err) {
      console.error('bookingAPI.getAll error:', err);
      return { success: false, error: err.message };
    }
  },

  getStats: async () => {
    try {
      const data = await api.get('/bookings/stats');
      return { success: true, stats: data.stats || data };
    } catch (err) {
      console.error('bookingAPI.getStats error:', err);
      return { success: false, error: err.message };
    }
  },

  cancel: async (id) => {
    try {
      const data = await api.post(`/bookings/${id}/cancel`, {});
      return { success: true, data };
    } catch (err) {
      console.error('bookingAPI.cancel error:', err);
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const data = await api.delete(`/cleanup/booking/${id}`);
      return { success: true, data };
    } catch (err) {
      console.error('bookingAPI.delete error:', err);
      throw err;
    }
  },

  hideForMe: async (id) => {
    try {
      const data = await api.delete(`/bookings/${id}/my-history`);
      return { success: true, data };
    } catch (err) {
      console.error('bookingAPI.hideForMe error:', err);
      throw err;
    }
  },

  // ✅ Нэмэгдсэн — api helper ашиглаж байна
  markExpired: async () => {
    try {
      const data = await api.post('/cleanup/mark-expired', {});
      return { success: true, data };
    } catch (err) {
      console.error('bookingAPI.markExpired error:', err);
      throw err;
    }
  },

  getMyBookings: async () => {
    try {
      const data = await api.get('/bookings/my-history');
      return { success: true, bookings: data.bookings || data };
    } catch (err) {
      console.error('bookingAPI.getMyBookings error:', err);
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const data = await api.get(`/bookings/${id}`);
      return { success: true, booking: data.booking || data };
    } catch (err) {
      console.error('bookingAPI.getById error:', err);
      return { success: false, error: err.message };
    }
  },

  verify: async (id) => {
    try {
      const data = await api.get(`/bookings/verify/${id}`);
      return { success: true, data };
    } catch (err) {
      console.error('bookingAPI.verify error:', err);
      return { success: false, error: err.message };
    }
  },
};

export default bookingAPI;
