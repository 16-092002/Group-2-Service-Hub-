// src/App.js
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TechnicianListPage from './pages/TechnicianListPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import ContactPage from './pages/ContactPage';
import AppointmentPage from './pages/AppointmentPage';
import ProfilePage from './pages/ProfilePage';
import axios from 'axios';

function App() {
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/ping`)
      .then(res => console.log(res.data))
      .catch(err => console.error('API test failed:', err));
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/technicians" element={<TechnicianListPage />} />
        <Route path="/request-service" element={<ServiceRequestPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointments" element={<AppointmentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
