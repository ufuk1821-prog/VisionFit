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
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <rect width="38" height="38" rx="10" fill="var(--accent)" opacity="0.15" />
        <rect x="4" y="17" width="8" height="4" rx="2" fill="var(--accent)" />
        <rect x="26" y="17" width="8" height="4" rx="2" fill="var(--accent)" />
        <rect x="11" y="11" width="16" height="16" rx="4" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <rect x="15" y="15" width="8" height="8" rx="2" fill="var(--accent)" />
        <circle cx="19" cy="19" r="2" fill="#0a0c0f" />
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