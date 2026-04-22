// src/components/MovieDetailModal.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MovieDetailModal = ({ isOpen, onClose, movie, onBookTicket, onWatchTrailer, isLoggedIn }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  const cast = movie.cast || [];
  const showtimes = ['10:00', '13:30', '16:45', '19:15', '21:30', '00:00'];
  const isComingSoon = movie.status === 'comingSoon';

  const handleBookTicket = () => {
    if (isComingSoon) return;
    if (!isLoggedIn) {
      alert('Тасалбар захиалахын тулд эхлээд нэвтрэнэ үү!');
      navigate('/login');
      return;
    }
    onBookTicket();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img src={movie.posterUrl} className="w-full h-full object-cover blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-all duration-200 group shadow-sm"
        >
          <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative z-10 flex flex-col md:flex-row w-full overflow-y-auto custom-scrollbar">

          {/* Зүүн тал — постер + товчлуур */}
          <div className="w-full md:w-2/5 lg:w-1/3 p-6 lg:p-8 flex flex-col gap-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-md">
                IMDB {movie.rating}
              </div>
              {isComingSoon && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                  Тун удахгүй
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleBookTicket}
                disabled={isComingSoon}
                className={`group relative w-full py-3.5 px-6 rounded-xl font-semibold shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden
                  ${isComingSoon
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-200'
                  }`}
              >
                {!isComingSoon && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md" />
                )}
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="relative z-10">
                  {isComingSoon ? 'Тун удахгүй нээлтээ хийнэ' : 'Тасалбар захиалах'}
                </span>
              </button>

              <button
                onClick={onWatchTrailer}
                className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 text-gray-700 py-3.5 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Трейлер үзэх</span>
              </button>
            </div>
          </div>

          {/* Баруун тал — дэлгэрэнгүй мэдээлэл */}
          <div className="w-full md:w-3/5 lg:w-2/3 p-6 lg:p-8 text-gray-800">

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {movie.genre?.map((g, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-600">
                    {g}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-600">
                  {movie.duration}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight tracking-tight">
                {movie.title}
              </h2>
              <p className="text-gray-500 text-sm">
                Нээлт: <span className="text-gray-700">
                  {new Date(movie.releaseDate).toLocaleDateString('mn-MN')}
                </span>
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-red-500 rounded-full block"></span>
                Тайлбар
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {movie.description || `${movie.title} кино нь гайхалтай үйл явдал, сэтгэл хөдөлгөм дүр зураглалаар дүүрэн бүтээл юм.`}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Гол дүрүүдэд</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {cast.length === 0 ? (
                  <p className="text-gray-400 text-sm">Жүжигчдийн мэдээлэл байхгүй</p>
                ) : cast.map((actor, index) => (
                  <div key={index} className="flex flex-col items-center min-w-[80px] group cursor-default">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 p-0.5 mb-2 group-hover:scale-110 transition-transform duration-300 ring-2 ring-transparent group-hover:ring-red-400">
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        <span className="text-xs font-bold text-gray-400">
                          {actor.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-center text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
                      {actor.name}<br/>
                      <span className="text-gray-400 group-hover:text-gray-500">{actor.role}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Цагийн хуваарь — comingSoon үед харуулахгүй */}
            {!isComingSoon && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Цагийн хуваарь</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {showtimes.map((time, index) => (
                    <button
                      key={index}
                      onClick={handleBookTicket}
                      className="relative overflow-hidden rounded-lg bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-300 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 transition-all duration-300 group"
                    >
                      <span className="relative z-10">{time}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* comingSoon үед мэдэгдэл */}
            {isComingSoon && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-600 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Энэ кино удахгүй нээлтээ хийх тул тасалбар захиалах боломжгүй байна.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;