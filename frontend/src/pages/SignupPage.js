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
  IconButton,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  PersonAdd
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const roles = [
  { value: 'user', label: 'Customer - I need services' },
  { value: 'technician', label: 'Technician - I provide services' }
];

function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'agreeToTerms' ? checked : value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, agreeToTerms, ...signupData } = formData;
      const result = await signup(signupData);
      
      if (result.success) {
        toast.success(`Welcome to ServiceHub, ${result.user.name}!`);
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ general: result.error });
        toast.error(result.error);
      }
    } catch (err) {
      const errorMessage = 'Signup failed. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PersonAdd color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Join ServiceHub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your account to get started
          </Typography>
        </Box>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="name"
            autoFocus
            error={!!errors.name}
            helperText={errors.name}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />

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
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            fullWidth
            label="I am a..."
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Select your role on the platform"
          >
            {roles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password || 'Minimum 6 characters'}
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
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link href="/terms" target="_blank" underline="hover">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" underline="hover">
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mb: 2 }}
          />
          
          {errors.agreeToTerms && (
            <Typography variant="caption" color="error" display="block" sx={{ mb: 2 }}>
              {errors.agreeToTerms}
            </Typography>
          )}

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
              'Create Account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/login" 
                underline="hover"
                sx={{ fontWeight: 'bold' }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignupPage;