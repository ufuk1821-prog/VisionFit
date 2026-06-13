import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import History from './pages/history';
import Profile from './pages/profile';
import Diet from './pages/diet';
import Steps from './pages/steps';
import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div className="app-container">
        <h1 className="title-text">VisionFit</h1>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/diet" element={isAuthenticated ? <Diet /> : <Navigate to="/login" />} />
          <Route path="/steps" element={isAuthenticated ? <Steps /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;