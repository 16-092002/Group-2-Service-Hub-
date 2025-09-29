import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TechnicianListPage from './pages/TechnicianListPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import ContactPage from './pages/ContactPage';
import AppointmentPage from './pages/AppointmentPage';
import ProfilePage from './pages/ProfilePage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ChatPage from './pages/ChatPage';
import VideoCallPage from './pages/VideoCallPage';
import RatingPage from './pages/RatingPage';

// Theme and Utils
import theme from './theme';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function App() {
  useEffect(() => {
    // Test API connection
    axios.get('/ping')
      .then(res => console.log('API Connected:', res.data))
      .catch(err => console.error('API Connection Failed:', err.message));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/technicians" element={<TechnicianListPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requireRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/technician/*" 
                  element={
                    <ProtectedRoute requireRole="technician">
                      <TechnicianDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/request-service" 
                  element={
                    <ProtectedRoute>
                      <ServiceRequestPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/appointments" 
                  element={
                    <ProtectedRoute>
                      <AppointmentPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat/:chatId" 
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/video-call/:userId" 
                  element={
                    <ProtectedRoute>
                      <VideoCallPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/rate/:technicianId/:serviceRequestId?" 
                  element={
                    <ProtectedRoute>
                      <RatingPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Dashboard Router Component
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'technician':
      return <Navigate to="/technician/dashboard" replace />;
    default:
      return <UserDashboard />;
  }
}

export default App;