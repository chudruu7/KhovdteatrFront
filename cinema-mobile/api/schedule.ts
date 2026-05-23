import api from './index';

export interface Schedule {
  _id: string;
  movie: {
    _id: string;
    title: string;
    posterUrl: string;
    duration: string;
  };
  hall: {
    hallName: string;
    rows: number;
    seatsPerRow: number;
    totalSeats: number;
  };
  showTime: string;
  basePrice: number;
  soldSeats: string[];
}

export interface SeatMapResponse {
  scheduleId: string;
  movieTitle: string;
  showTime: string;
  hall: {
    hallName: string;
    rows: number;
    seatsPerRow: number;
    totalSeats: number;
  };
  soldSeats: string[];
  basePrice: number;
}

// ✅ ЗАСВАР: /:movieId URL parameter ашиглана
export const getSchedulesByMovie = async (movieId: string): Promise<any> => {
  const { data } = await api.get(`/schedules/${movieId}`);
  console.log('[getSchedulesByMovie] raw:', JSON.stringify(data, null, 2));
  return data;
};

export const getSchedulesByDate = async (date: string): Promise<any> => {
  const { data } = await api.get(`/schedules?date=${date}`);
  console.log('[getSchedulesByDate] raw:', JSON.stringify(data, null, 2));
  return data;
};

export const getSchedulesByMovieAndDate = async (
  movieId: string,
  date: string
): Promise<any> => {
  const { data } = await api.get(`/schedules/${movieId}?date=${date}`);
  console.log('[getSchedulesByMovieAndDate] raw:', JSON.stringify(data, null, 2));
  return data;
};

export const getOccupiedSeats = async (scheduleId: string): Promise<SeatMapResponse> => {
  const { data } = await api.get(`/schedules/seats/${scheduleId}`);
  console.log('[getOccupiedSeats] raw:', JSON.stringify(data, null, 2));
  return data;
};