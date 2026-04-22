import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoviePoster from './MoviePoster';

const MovieCarousel = ({ movies, title, onTrailerClick, onDetailClick, isLoggedIn }) => {
  const carouselRef = useRef(null);

  const scroll = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft += dir * 300;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="py-12"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="container mx-auto px-4 max-w-screen-2xl">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            variants={titleVariants}
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </motion.h2>

          {/* Scroll buttons */}
          <motion.div variants={titleVariants} className="flex space-x-2">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                className="p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                style={{
                  background: 'var(--nav-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--nav-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--nav-bg)'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={dir === -1 ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                </svg>
              </button>
            ))}
          </motion.div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex space-x-6 overflow-x-auto scrollbar-hide pb-6"
            style={{ scrollBehavior: 'smooth' }}
          >
            <AnimatePresence>
              {movies.map((movie, index) => (
                <motion.div
                  key={movie._id || movie.id || index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
                  className="flex-none w-48 sm:w-56 md:w-64 lg:w-72"
                >
                  <MoviePoster
                    movie={movie}
                    onTrailerClick={onTrailerClick}
                    onDetailClick={onDetailClick}
                    index={index}
                    isLoggedIn={isLoggedIn}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default MovieCarousel;