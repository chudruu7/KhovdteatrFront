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

  // ✅ Нэмэгдсэн — api helper ашиглаж байна
  getMyBookings: async () => {
    try {
      const data = await api.get('/bookings/my-history');
      return { success: true, bookings: data.bookings || data };
    } catch (err) {
      console.error('bookingAPI.getMyBookings error:', err);
      return { success: false, error: err.message };
    }
  },
};

export default bookingAPI;