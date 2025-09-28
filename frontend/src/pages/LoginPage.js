import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  Login as LoginIcon 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        
        // Redirect to appropriate dashboard or return URL
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LoginIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your ServiceHub account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              textTransform: 'none',
              mb: 3
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/signup" 
                underline="hover"
                sx={{ fontWeight: 'bold' }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Demo Accounts Info */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mt: 3, 
          borderRadius: 2,
          bgcolor: 'info.50'
        }}
      >
        <Typography variant="h6" gutterBottom color="info.main">
          Demo Accounts
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Admin:</strong> admin@servicehub.com / admin123<br />
          <strong>Technician:</strong> tech@servicehub.com / tech123<br />
          <strong>User:</strong> user@servicehub.com / user123
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Use these credentials to explore different user roles
        </Typography>
      </Paper>
    </Container>
  );
}

export default LoginPage;