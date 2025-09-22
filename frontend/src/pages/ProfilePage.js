import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Typography, Box } from '@mui/material';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [techForm, setTechForm] = useState({ service: '', phone: '', location: '' });
  const [message, setMessage] = useState('');

  // Assuming you have token saved in localStorage after login
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      try {
        // Get user info
        const userRes = await axios.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data);
        setUserForm({ name: userRes.data.name, email: userRes.data.email, password: '' });

        // If technician, get technician profile
        if (userRes.data.role === 'technician') {
          try {
            const techRes = await axios.get('/technicians/me', { headers: { Authorization: `Bearer ${token}` } });
            setTechnicianProfile(techRes.data);
            setTechForm({
              service: techRes.data.service || '',
              phone: techRes.data.phone || '',
              location: techRes.data.location || '',
            });
          } catch (e) {
            // No technician profile yet
            setTechnicianProfile(null);
            setTechForm({ service: '', phone: '', location: '' });
          }
        }
      } catch (error) {
        console.error(error);
        setMessage('Failed to load profile');
      }
      setLoading(false);
    }
    fetchData();
  }, [token]);

  const handleUserChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleTechChange = (e) => {
    setTechForm({ ...techForm, [e.target.name]: e.target.value });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/auth/me', userForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setMessage('User profile updated successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update user profile');
    }
  };

  const handleTechSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/technicians/me', techForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnicianProfile(res.data);
      setMessage('Technician profile updated successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update technician profile');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" mb={3}>Profile</Typography>

      {message && <Typography color="secondary">{message}</Typography>}

      <form onSubmit={handleUserSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          name="name"
          value={userForm.name}
          onChange={handleUserChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          type="email"
          value={userForm.email}
          onChange={handleUserChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          value={userForm.password}
          onChange={handleUserChange}
          helperText="Leave blank to keep current password"
        />
        <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
          Update Profile
        </Button>
      </form>

      {user.role === 'technician' && (
        <>
          <Typography variant="h5" mt={4} mb={2}>Technician Profile</Typography>
          <form onSubmit={handleTechSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Service Type"
              name="service"
              value={techForm.service}
              onChange={handleTechChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Phone"
              name="phone"
              value={techForm.phone}
              onChange={handleTechChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Location"
              name="location"
              value={techForm.location}
              onChange={handleTechChange}
            />
            <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
              Update Technician Profile
            </Button>
          </form>
        </>
      )}
    </Box>
  );
}

export default ProfilePage;
