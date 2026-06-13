import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
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

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Link to="/" className="brand-logo">
          <Dumbbell size={28} />
          <span>VisionFit</span>
        </Link>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
          <Route path="/exercises" element={isAuthenticated ? <Exercises /> : <Navigate to="/login" />} />
          <Route path="/timer" element={isAuthenticated ? <Timer /> : <Navigate to="/login" />} />
          <Route path="/workout-notebook" element={isAuthenticated ? <WorkoutNotebook /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/diet" element={isAuthenticated ? <Diet /> : <Navigate to="/login" />} />
          <Route path="/nutrition" element={isAuthenticated ? <Nutrition /> : <Navigate to="/login" />} />
          <Route path="/steps" element={isAuthenticated ? <Steps /> : <Navigate to="/login" />} />
          <Route path="/badges" element={isAuthenticated ? <Badges /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;