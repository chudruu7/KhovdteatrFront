// src/api/qpayAPI.js  (CINEMA-FRONT)

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://khovdteatrbackend.onrender.com/";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const qpayAPI = {
  // ── Invoice үүсгэх (QR код авах) ────────────────────────────────────────
  // params: { bookingId, amount, seats?, movieTitle? }
  // returns: { success, data: { invoiceId, qrCode, qrText, urls } }
  createInvoice: async (params) => {
    const res = await axios.post(`${API_URL}/qpay/invoice`, params, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // ── Төлбөрийн статус шалгах ──────────────────────────────────────────────
  // invoiceId: QPay-аас авсан invoice id
  // returns: { success, data: { paid, status, payments } }
  checkPayment: async (invoiceId) => {
    const res = await axios.get(`${API_URL}/qpay/payment/${invoiceId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // ── Booking-ийг PAID болгох ──────────────────────────────────────────────
  // Төлбөр амжилттай болсны дараа дуудна
  confirmBooking: async (bookingId) => {
    const res = await axios.post(
      `${API_URL}/bookings/${bookingId}/confirm`,
      {},
      { headers: getAuthHeader() }
    );
    return res.data;
  },

  // ── Invoice цуцлах ───────────────────────────────────────────────────────
  cancelInvoice: async (invoiceId) => {
    const res = await axios.delete(`${API_URL}/qpay/invoice/${invoiceId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};

export default qpayAPI;