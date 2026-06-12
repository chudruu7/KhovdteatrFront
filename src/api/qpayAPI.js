// src/api/qpayAPI.js  (CINEMA-FRONT)

import axios from "axios";
import { API_BASE_URL } from "./config";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const qpayAPI = {
  // ── Invoice үүсгэх (QR код авах) ────────────────────────────────────────
  // params: { bookingId, amount, seats?, movieTitle? }
  // returns: { success, data: { invoiceId, qrCode, qrText, urls } }
  createInvoice: async (params) => {
    const res = await axios.post(`${API_BASE_URL}/qpay/invoice`, params, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // ── Төлбөрийн статус шалгах ──────────────────────────────────────────────
  // invoiceId: QPay-аас авсан invoice id
  // returns: { success, data: { paid, status, payments } }
  checkPayment: async (invoiceId) => {
    const res = await axios.get(`${API_BASE_URL}/qpay/payment/${invoiceId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // ── Booking-ийг PAID болгох ──────────────────────────────────────────────
  // Төлбөр амжилттай болсны дараа дуудна
  confirmBooking: async (bookingId) => {
    const res = await axios.post(
      `${API_BASE_URL}/bookings/${bookingId}/confirm`,
      {},
      { headers: getAuthHeader() }
    );
    return res.data;
  },

  // ── Invoice цуцлах ───────────────────────────────────────────────────────
  testComplete: async (invoiceId, bookingId) => {
    const res = await axios.post(
      `${API_BASE_URL}/qpay/test-complete/${invoiceId}`,
      { bookingId },
      { headers: getAuthHeader() }
    );
    return res.data;
  },

  cancelInvoice: async (invoiceId) => {
    const res = await axios.delete(`${API_BASE_URL}/qpay/invoice/${invoiceId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};

export default qpayAPI;
