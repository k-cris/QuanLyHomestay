import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import HomestayDetail from './pages/HomestayDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminStats from './pages/AdminStats';
import HostDashboard from './pages/HostDashboard';
import HostBookings from './pages/HostBookings';
import HostStats from './pages/HostStats';
import MyBookings from './pages/MyBookings';
import BecomeHost from './pages/BecomeHost';
import AdminHostRequestDetail from './pages/AdminHostRequestDetail';
import Profile from './pages/Profile';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/homestay/:id" element={<HomestayDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/become-host" element={<BecomeHost />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stats" element={<AdminStats />} />
          <Route path="/admin/host-requests/:id" element={<AdminHostRequestDetail />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/bookings" element={<HostBookings />} />
          <Route path="/host/stats" element={<HostStats />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
