import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };

  const spinTransition = {
    repeat: Infinity,
    duration: 1,
    ease: "linear"
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center space-y-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={spinTransition}
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-red-600 rounded-full dark:border-gray-700 dark:border-t-red-500 light:border-gray-300 light:border-t-red-500`}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-white text-lg dark:text-white light:text-gray-900"
      >
      </motion.p>
    </motion.div>
  );
};

export default LoadingSpinner;