// src/components/MoviePoster.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MoviePoster = ({ movie, onTrailerClick, onDetailClick, index = 0, isLoggedIn }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (e.target.closest('.trailer-btn')) {
      onTrailerClick(movie);
    } else {
      onDetailClick(movie);
    }
  };

  const handleBookTicket = (e) => {
  e.stopPropagation();
  
  // comingSoon төлөвтэй бол booking руу орохгүй
  if (movie.status === 'comingSoon') {
    return;
  }
  
  if (!isLoggedIn) {
    alert('Тасалбар захиалахын тулд эхлээд нэвтрэнэ үү!');
    navigate('/login');
    return;
  }
  navigate('/booking', { state: { movie } });
};
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "backOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/40 hover:shadow-3xl hover:shadow-black/60 transition-all duration-500">
        <div className="aspect-[2/3] bg-gradient-to-br from-gray-800 to-black relative overflow-hidden">
          <motion.img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.1 : 1
            }}
            transition={{
              duration: 0.7,
              ease: "easeOut"
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          <motion.div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
          >
            <motion.div 
              className="flex flex-col space-y-4 items-center"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <motion.button 
                variants={buttonVariants}
                className="trailer-btn bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30 hover:bg-white/30 transition-all duration-300"
                whileHover={{ 
                  scale: 1.1,
                  backgroundColor: "rgba(255,255,255,0.3)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-8 h-8 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </motion.button>
              
            {movie.status !== 'comingSoon' && (
  <motion.button 
    variants={buttonVariants}
    onClick={handleBookTicket}
    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center space-x-2"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
    <span>Тасалбар</span>
  </motion.button>
)}
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          animate={{
            y: isHovered ? -10 : 0
          }}
          transition={{
            duration: 0.3
          }}
        >
          <h3 className="font-bold text-lg leading-tight mb-1 drop-shadow-lg">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-sm opacity-90">
            <span className="font-medium">{movie.rating}</span>
            <span>{movie.duration}</span>
          </div>
          {movie.releaseDate && (
            <p className="text-xs opacity-75 mt-1">
              {new Date(movie.releaseDate).toLocaleDateString('mn-MN')}
            </p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MoviePoster;