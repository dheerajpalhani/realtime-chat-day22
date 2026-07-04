import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore.js';
import { useChatStore } from './store/chatStore.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

function App() {
  const { token, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();

  // 1. Fetch current profile on application mount to check existing cookie sessions
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 2. Synchronize socket connections with user authentication state
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token, connectSocket, disconnectSocket]);

  return (
    <BrowserRouter>
      {/* Toast notifications container */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#E2E8F0',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/home" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/home" replace />} 
        />

        {/* Protected Dashboard Workspace */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Base Navigation Redirects */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
