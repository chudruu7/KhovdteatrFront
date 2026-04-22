import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBar = ({ onSearch, movies }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const searchRef = useRef(null);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length > 0) {
      const filtered = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredMovies(filtered);
      setIsOpen(true);
      onSearch(filtered);
    } else {
      setFilteredMovies([]);
      setIsOpen(false);
      onSearch(movies);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-[300px]"> {/* Өргөнийг Header-т тохируулав */}
      <div className="relative flex items-center">
        {/* Хайлтын Icon */}
        <div className="absolute left-4 z-10 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Инпут - Header-тэй ижил Pill хэлбэртэй */}
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Кино хайх..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all duration-300"
        />
        
        {/* Clear Button (текст бичих үед гарч ирнэ) */}
        {query && (
          <button 
            onClick={() => handleSearch('')}
            className="absolute right-3 text-gray-500 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Хайлтын үр дүн - Дизайнд нийцүүлсэн */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
              {filteredMovies.length > 0 ? (
                filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => {
                      setQuery(movie.title);
                      setIsOpen(false);
                      onSearch([movie]);
                    }}
                    className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                  >
                    <img src={movie.posterUrl} alt="" className="w-8 h-10 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{movie.title}</p>
                      <p className="text-gray-500 text-[10px] truncate">{movie.genre[0]}</p>
                    </div>
                    <span className="text-yellow-500 text-[10px] font-bold">★{movie.rating}</span>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-xs text-gray-500">Олдсонгүй</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;