import { useState, useRef, useEffect } from 'react';

// 1. Icons Components (Кодыг цэвэр байлгах үүднээс)
const ChevronDownIcon = ({ isOpen }) => (
  <svg 
    className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// 2. Custom Hook for Click Outside (Гадна талд дарахад хаах)
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// 3. Reusable Dropdown Component
const FilterDropdown = ({ title, options, selectedValues, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const isActive = selectedValues.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 border backdrop-blur-md 
        ${isActive 
          ? 'bg-red-600/20 border-red-500 text-red-100 ring-1 ring-red-500/50' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'}`}
      >
        <span className="font-medium text-sm">{title}</span>
        {isActive && (
          <span className="bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {selectedValues.length}
          </span>
        )}
        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-200 origin-top-left
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        <div className="p-2 grid gap-1 max-h-64 overflow-y-auto custom-scrollbar">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <button
                key={option}
                onClick={() => onToggle(option)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group
                ${isSelected 
                  ? 'bg-red-600 text-white font-medium' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>{option}</span>
                {isSelected && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 4. Main Component
const FilterBar = ({ onFilter, activeFilters, onClearFilters }) => {
  const genres = ['Адал явдалт', 'Инээдэм', 'Драма', 'Шинжлэх ухаан', 'Фантастик', 'Аймшгийн', 'Триллер', 'Нууцлагдмал', 'Гэр бүлийн', 'Аниме', 'Баримтат', 'Гэрэл зураг', 'Түүхэн', 'Хүүхэлдэйн', 'Хөгжимт', 'Уянгын', 'Уран зөгнөлт'];
  const ratings = ['Хүүхэд', 'Бүх насныхан', '13 хүртэл', 'Насанд хүрэгчдэд', '17 хүртэлх насныхан'];

  const toggleGenre = (genre) => {
    const newFilters = activeFilters.genres.includes(genre)
      ? activeFilters.genres.filter(g => g !== genre)
      : [...activeFilters.genres, genre];
    onFilter({ ...activeFilters, genres: newFilters });
  };

  const toggleRating = (rating) => {
    const newFilters = activeFilters.ratings.includes(rating)
      ? activeFilters.ratings.filter(r => r !== rating)
      : [...activeFilters.ratings, rating];
    onFilter({ ...activeFilters, ratings: newFilters });
  };

  const hasActiveFilters = activeFilters.genres.length > 0 || activeFilters.ratings.length > 0;

  return (
    <div className="w-full mb-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Reusable Dropdowns */}
        <FilterDropdown 
          title="Төрөл" 
          options={genres} 
          selectedValues={activeFilters.genres} 
          onToggle={toggleGenre} 
        />
        
        <FilterDropdown 
          title="Насны ангилал" 
          options={ratings} 
          selectedValues={activeFilters.ratings} 
          onToggle={toggleRating} 
        />

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Цэвэрлэх</span>
          </button>
        )}
      </div>

      {/* Active Tags / Badges Section */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {activeFilters.genres.map(genre => (
            <span key={genre} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600/10 text-red-400 border border-red-600/20">
              {genre}
              <button onClick={() => toggleGenre(genre)} className="ml-2 hover:text-white focus:outline-none">
                <XIcon />
              </button>
            </span>
          ))}
          {activeFilters.ratings.map(rating => (
            <span key={rating} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-600/10 text-yellow-400 border border-yellow-600/20">
              {rating}
              <button onClick={() => toggleRating(rating)} className="ml-2 hover:text-white focus:outline-none">
                <XIcon />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;