import api from './index';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
export interface SeatSelection {
  row: string;
  number: number;
  type: 'standard' | 'vip' | 'couple';
}

export interface CreateBookingPayload {
  scheduleId: string;
  seats: SeatSelection[];
  paymentMethod?: 'wire' | 'cash';
}

export interface BookedSeat {
  row: string;
  number: number;
  type: string;
  price: number;
}

export interface Booking {
  _id: string;
  user: string;
  schedule: {
    _id: string;
    startTime: string;
    endTime: string;
    hall: {
      name: string;
    };
    movie: {
      _id: string;
      title: string;
      poster: string;
      duration: number;
    };
  };
  seats: BookedSeat[];
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  bookingStatus: 'active' | 'used' | 'cancelled' | 'expired';
  qrCode?: string;
  bookingNumber: string;
  createdAt: string;
}

export interface BookingResponse {
  success: boolean;
  booking: Booking;
  message?: string;
}

// ─── BOOKING FUNCTIONS ─────────────────────────────────────────────────────────

/** Захиалга үүсгэх */
export const createBooking = async (payload: CreateBookingPayload): Promise<Booking> => {
  const { data } = await api.post<BookingResponse>('/bookings', payload);
  return data.booking;
};

/** Миний захиалгууд */
export const getMyBookings = async (): Promise<Booking[]> => {
  const { data } = await api.get<{ success: boolean; bookings: Booking[] }>('/bookings/my-history');
  return data.bookings;
};

/** Захиалгын дэлгэрэнгүй */
export const getBookingById = async (bookingId: string): Promise<Booking> => {
  const { data } = await api.get<BookingResponse>(`/bookings/${bookingId}`);
  return data.booking;
};

/** Захиалга цуцлах */
export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  const { data } = await api.put<BookingResponse>(`/bookings/${bookingId}/cancel`);
  return data.booking;
};

/** Wire төлбөр шалгах */
export const checkPayment = async (bookingId: string): Promise<Booking> => {
  const { data } = await api.get<BookingResponse>(`/bookings/${bookingId}/payment-status`);
  return data.booking;
};
