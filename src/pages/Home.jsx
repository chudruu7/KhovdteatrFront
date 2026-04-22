// src/pages/Home.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroMovieSection from '../components/HeroMovieSection';
import MovieCarousel from '../components/MovieCarousel';
import TrailerModal from '../components/TrailerModal';
import MovieDetailModal from '../components/MovieDetailModal';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../api/config'; // API импортлох
import { getCurrentUser } from '../auth/auth';

const Home = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [movies, setMovies] = useState({
    nowShowing: [],
    comingSoon: [],
    featured: null
  });
  const [filters, setFilters] = useState({
    genres: [],
    ratings: []
  });
  const [user, setUser] = useState(null);

  // Хэрэглэгчийн мэдээлэл авах
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [isLoggedIn]);

useEffect(() => {
  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      
      console.log('api объект:', api);
      console.log('api.get функц эсэх:', typeof api.get); 
      
      const moviesData = await api.get('/movies');
      console.log('Кино өгөгдөл:', moviesData); 
      
      let nowShowing = [];
      let comingSoon = [];
      let featured = null;
      
      if (Array.isArray(moviesData)) {

        nowShowing = moviesData.filter(movie => movie.status === 'nowShowing');
        comingSoon = moviesData.filter(movie => movie.status === 'comingSoon');
        featured = moviesData.find(movie => movie.isFeatured) || moviesData[0];
      } else if (moviesData && typeof moviesData === 'object') {
        // Хэрэв объект ирвэл
        nowShowing = moviesData.nowShowing || [];
        comingSoon = moviesData.comingSoon || [];
        featured = moviesData.featured || moviesData.nowShowing?.[0] || null;
      }
      
      setMovies({
        nowShowing,
        comingSoon,
        featured
      });
      
    } catch (error) {
      console.error('Өгөгдөл татахад алдаа гарлаа:', error);
      alert('Өгөгдөл татахад алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchMovies();
}, []);

  // All movies for search and filtering
  const allMovies = useMemo(() => [
    ...movies.nowShowing,
    ...movies.comingSoon
  ], [movies]);

  // Filtered movies based on search and filters
  const filteredMovies = useMemo(() => {
    let result = searchResults || allMovies;

    // Apply genre filters
    if (filters.genres.length > 0) {
      result = result.filter(movie =>
        movie.genre?.some(genre => filters.genres.includes(genre))
      );
    }

    // Apply rating filters
    if (filters.ratings.length > 0) {
      result = result.filter(movie => filters.ratings.includes(movie.rating));
    }

    return result;
  }, [searchResults, allMovies, filters]);

  // Separate filtered movies into nowShowing and comingSoon
  const { filteredNowShowing, filteredComingSoon } = useMemo(() => {
    const nowShowing = filteredMovies.filter(movie => 
      movies.nowShowing.some(m => m._id === movie._id)
    );
    const comingSoon = filteredMovies.filter(movie => 
      movies.comingSoon.some(m => m._id === movie._id)
    );
    
    return { filteredNowShowing: nowShowing, filteredComingSoon: comingSoon };
  }, [filteredMovies, movies]);

  const handleTrailerClick = (movie) => {
    setSelectedMovie(movie);
    setIsTrailerModalOpen(true);
  };

  const handleDetailClick = (movie) => {
    setSelectedMovie(movie);
    setIsDetailModalOpen(true);
  };

  const handleBookTicket = (movie) => {
    if (!isLoggedIn) {
      alert('Тасалбар захиалахын тулд эхлээд нэвтрэнэ үү!');
      navigate('/login');
      return;
    }
    navigate('/booking', { state: { movieId: movie._id, movie } });
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({ genres: [], ratings: [] });
    setSearchResults(null);
  };

  const closeModals = () => {
    setIsTrailerModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedMovie(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
     style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg animate-pulse"
     style={{ color: 'var(--text-secondary)' }}>Соён гэгээрлийн ертөнц рүү хамтдаа аялцгаая...</p>
        </div>
    
    );
  }

  return (
   <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header 
        onSearchResults={handleSearchResults} 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={onLogout}
      />
      
      <main className="pt-20">
        {movies.featured && (
          <HeroMovieSection 
            movie={movies.featured} 
            onWatchTrailer={() => handleTrailerClick(movies.featured)}
            onBookTicket={() => handleBookTicket(movies.featured)}
            isLoggedIn={isLoggedIn}
          />
        )}
        
        {/* Filter Bar */}
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <FilterBar 
            onFilter={handleFilter}
            activeFilters={filters}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Search/Filter Results Info */}
        {(searchResults || filters.genres.length > 0 || filters.ratings.length > 0) && (
          <div className="container mx-auto px-4 max-w-screen-2xl mb-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">
                Хайлтын үр дүн
              </h3>
              <p className="text-gray-300">
                {filteredMovies.length} кино олдлоо
              </p>
            </div>
          </div>
        )}

        {/* Now Showing Carousel */}
        {filteredNowShowing.length > 0 && (
          <MovieCarousel
            title="Дэлгэцнээ гарч буй үзвэрүүд"
            movies={filteredNowShowing}
            onTrailerClick={handleTrailerClick}
            onDetailClick={handleDetailClick}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* Coming Soon Carousel */}
        {filteredComingSoon.length > 0 && (
          <MovieCarousel
            title="Тун удахгүй"
            movies={filteredComingSoon}
            onTrailerClick={handleTrailerClick}
            onDetailClick={handleDetailClick}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* No Results Message */}
        {filteredMovies.length === 0 && (searchResults || filters.genres.length > 0 || filters.ratings.length > 0) && (
          <div className="container mx-auto px-4 max-w-screen-2xl py-20 text-center">
            <div className="text-gray-400 text-lg">
              🎬 Хайлтын үр дүн олдсонгүй
            </div>
            <button
              onClick={handleClearFilters}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-all duration-300"
            >
              Бүх кино харуулах
            </button>
          </div>
        )}
      </main>

      <Footer />

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={closeModals}
        trailerUrl={selectedMovie?.trailerUrl}
        movieTitle={selectedMovie?.title}
      />

      <MovieDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeModals}
        movie={selectedMovie}
        onBookTicket={() => handleBookTicket(selectedMovie)}
        onWatchTrailer={() => handleTrailerClick(selectedMovie)}
      />
    </div>
  );
};

export default Home;