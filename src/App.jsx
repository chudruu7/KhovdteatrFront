// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import About from './pages/about';
import News from './pages/news';
import NewsDetail from './pages/NewsDetails';
import Schedule from './pages/schedule';
import Promotion from './pages/Promotion';
import Login from './pages/Login';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/Profile';
import Adminpanel from './admin/AdminPanel';
import { movies, news, promotions } from './data/movies';
import { getCurrentUser, setUser, logout } from './auth/auth'; // setCurrentUser -> setUser
import './index.css';

// Хэрэглэгч нэвтэрсэн эсэхийг шалгах компонент
const AuthRedirect = ({ children, isLoggedIn, user }) => {
  if (isLoggedIn) {
    const target = user?.role === 'admin' ? '/admin' : '/';
    return <Navigate to={target} replace />;
  }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUserState] = useState(null);
  const [filteredMovies, setFilteredMovies] = useState([...movies.nowShowing, ...movies.comingSoon]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setIsLoggedIn(true);
      setUserState(currentUser);
    }
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUserState(userData);
    setUser(userData); // setCurrentUser биш, setUser
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserState(null);
    logout();
  };

  const handleSearchResults = (results) => {
    setFilteredMovies(results);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Home 
                movies={filteredMovies}
                isLoggedIn={isLoggedIn}
                user={user}
                onLogout={handleLogout}
                onSearchResults={handleSearchResults}
              />
            </motion.div>
          } />
          
          <Route path="/about" element={
            <motion.div
              key="about"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <About />
            </motion.div>
          } />
          
          <Route path="/news" element={
            <motion.div
              key="news"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <News news={news} />
            </motion.div>
          } />
          
          <Route path="/news/:id" element={
            <motion.div
              key="news-details"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <NewsDetail news={news} />
            </motion.div>
          } />
          
          <Route path="/schedule" element={
            <motion.div
              key="schedule"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Schedule movies={movies} isLoggedIn={isLoggedIn} />
            </motion.div>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <motion.div
                key="profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <ProfilePage user={user} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
              </motion.div>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <motion.div
                key="admin-home"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Adminpanel />
              </motion.div>
            </AdminRoute>
          } />

          <Route path="/promotions" element={
            <motion.div
              key="promotion"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Promotion />
            </motion.div>
          } />
                    
          <Route path="/login" element={
            <AuthRedirect isLoggedIn={isLoggedIn} user={user}>
              <motion.div
                key="login"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Login onLogin={handleLogin} />
              </motion.div>
            </AuthRedirect>
          } />
          
          <Route path="/booking" element={
    <motion.div
        key="booking"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
    >
        <BookingPage user={user} />
    </motion.div>
} />
          
          <Route path="*" element={
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold mb-4">404 - Хуудас олдсонгүй</h1>
              <a href="/" className="text-red-500 hover:text-red-400">Нүүр хуудас руу буцах</a>
            </div>
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;