import api from './index';

export interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  duration: string;
  rating: string;
  imdb?: string;
  posterUrl?: string;
  poster?: string;
  trailerUrl?: string;
  director?: string;
  cast?: string[];
  releaseDate?: string;
  status: 'nowShowing' | 'comingSoon' | 'ended';
  language?: string;
  ageRating?: string;
  isFeatured?: boolean;
}

export interface MovieListResponse {
  success: boolean;
  movies: Movie[];
  total?: number;
}

export interface MovieDetailResponse {
  success: boolean;
  movie: Movie;
}

export const getMovies = async (): Promise<any> => {
  const { data } = await api.get('/movies');
  return data;
};

// ✅ raw data буцаана — [id].tsx дотор extract хийнэ
export const getMovieById = async (id: string): Promise<any> => {
  const { data } = await api.get(`/movies/${id}`);
  console.log('[getMovieById] raw:', JSON.stringify(data, null, 2));
  return data;
};

export const searchMovies = async (query: string): Promise<any> => {
  const { data } = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
  return data;
};