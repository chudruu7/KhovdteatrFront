import axios from 'axios';
import { API_BASE_URL } from './config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const wireAPI = {
  createCheckout: async ({ bookingId, successUrl }) => {
    const res = await axios.post(
      `${API_BASE_URL}/wire/checkout`,
      { bookingId, successUrl },
      { headers: getAuthHeader() },
    );
    return res.data;
  },

  checkPaymentStatus: async (bookingId) => {
    const res = await axios.get(`${API_BASE_URL}/wire/payments/${bookingId}/status`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  cancelBooking: async (bookingId) => {
    const res = await axios.post(
      `${API_BASE_URL}/bookings/${bookingId}/cancel`,
      {},
      { headers: getAuthHeader() },
    );
    return res.data;
  },
};

export default wireAPI;
