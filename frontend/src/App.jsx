import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import History from './pages/history';
import Profile from './pages/profile';
import Diet from './pages/diet';
import Nutrition from './pages/nutrition';
import Steps from './pages/steps';
import Badges from './pages/badges';
import Settings from './pages/settings';
import Exercises from './pages/exercises';
import Timer from './pages/timer';
import WorkoutNotebook from './pages/workout-notebook';
import './App.css';

function VisionFitLogo() {
  return (
    <Link to="/" className="brand-logo">
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="var(--accent)" opacity="0.12" />
        <circle cx="27" cy="11" r="4.5" fill="var(--accent)" />
        <path
          d="M23 16 C19 16 16 19 16 23 L16 30 C16 32 17 33 18.5 33 L20 33 L20 38 C20 39.5 21.5 40.5 23 40.5 C24.5 40.5 26 39.5 26 38 L26 33 L29 33 C30.5 33 31.5 31.5 31.5 30 L31.5 21 C31.5 18.5 29.5 16.5 27 16.5 Z"
          fill="var(--accent)"
        />
        <path
          d="M16 22 C12.5 22 10 24 9 27 C8.3 29 9 30.5 10.5 31 C12 31.5 13.5 30.5 14 29 L16 23 Z"
          fill="var(--accent)"
        />
        <path
          d="M12.5 26.5 C10.5 26.5 8.8 27.8 8.2 29.7 C7.7 31.3 8.5 32.5 9.8 32.9"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span>VISIONFIT</span>
    </Link>
  );
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes({ isAuthenticated }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/" element={isAuthenticated ? <PageWrapper><Home /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuthenticated ? <PageWrapper><Dashboard /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/history" element={isAuthenticated ? <PageWrapper><History /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/exercises" element={isAuthenticated ? <PageWrapper><Exercises /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/timer" element={isAuthenticated ? <PageWrapper><Timer /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/workout-notebook" element={isAuthenticated ? <PageWrapper><WorkoutNotebook /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <PageWrapper><Profile /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/diet" element={isAuthenticated ? <PageWrapper><Diet /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/nutrition" element={isAuthenticated ? <PageWrapper><Nutrition /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/steps" element={isAuthenticated ? <PageWrapper><Steps /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/badges" element={isAuthenticated ? <PageWrapper><Badges /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <PageWrapper><Settings /></PageWrapper> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <VisionFitLogo />
        <AnimatedRoutes isAuthenticated={isAuthenticated} />
      </div>
    </BrowserRouter>
  );
}

export default App;