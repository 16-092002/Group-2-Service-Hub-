import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '../contexts/AuthContext';
import theme from '../theme';

// Mock user data
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z'
};

export const mockAdmin = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00Z'
};

export const mockTechnician = {
  id: '3',
  name: 'Tech User',
  email: 'tech@example.com',
  role: 'technician',
  createdAt: '2024-01-01T00:00:00Z'
};

// Mock auth context
export const mockAuthContext = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  checkAuthStatus: jest.fn()
};

// Custom render function
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    user = null,
    authContextValue = {},
    ...renderOptions
  } = {}
) => {
  const authValue = {
    ...mockAuthContext,
    user,
    isAuthenticated: !!user,
    ...authContextValue
  };

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider value={authValue}>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Render with authentication
export const renderWithAuth = (ui, user = mockUser, authContextValue = {}) => {
  return renderWithProviders(ui, { user, authContextValue });
};

// Render as admin
export const renderAsAdmin = (ui, authContextValue = {}) => {
  return renderWithProviders(ui, { user: mockAdmin, authContextValue });
};

// Render as technician
export const renderAsTechnician = (ui, authContextValue = {}) => {
  return renderWithProviders(ui, { user: mockTechnician, authContextValue });
};

// Mock axios responses
export const mockAxiosResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

export const mockAxiosError = (message = 'Network Error', status = 500) => {
  const error = new Error(message);
  error.response = {
    data: { error: message },
    status,
    statusText: 'Internal Server Error'
  };
  return error;
};

// Common test data
export const mockTechnicians = [
  {
    _id: '1',
    name: 'John Smith',
    service: ['plumbing'],
    averageRating: 4.9,
    totalRatings: 127,
    responseTime: 15,
    completedJobs: 450,
    pricing: { hourlyRate: 85 },
    location: { city: 'Toronto', state: 'ON', address: '123 Main St' },
    distance: 2.5,
    isVerified: true,
    availability: { emergencyAvailable: true },
    experience: { years: 8 }
  },
  {
    _id: '2',
    name: 'Sarah Johnson',
    service: ['electrical'],
    averageRating: 4.8,
    totalRatings: 98,
    responseTime: 20,
    completedJobs: 320,
    pricing: { hourlyRate: 90 },
    location: { city: 'Mississauga', state: 'ON', address: '456 Oak Ave' },
    distance: 1.2,
    isVerified: true,
    availability: { emergencyAvailable: false },
    experience: { years: 6 }
  }
];

export const mockServiceRequests = [
  {
    _id: '1',
    serviceType: 'plumbing',
    description: 'Fix leaky faucet',
    status: 'completed',
    createdAt: '2024-01-20T00:00:00Z',
    assignedTechnician: { name: 'John Smith', _id: '1' },
    estimatedCost: 150,
    user: { name: 'Test User', _id: '1' }
  },
  {
    _id: '2',
    serviceType: 'electrical',
    description: 'Install new outlet',
    status: 'in_progress',
    createdAt: '2024-01-25T00:00:00Z',
    assignedTechnician: { name: 'Sarah Johnson', _id: '2' },
    estimatedCost: 200,
    user: { name: 'Test User', _id: '1' }
  }
];

export const mockAppointments = [
  {
    _id: '1',
    serviceType: 'plumbing',
    date: '2024-02-01T10:00:00Z',
    status: 'scheduled',
    technician: {
      name: 'Mike Davis',
      phone: '+1234567890',
      service: ['plumbing'],
      averageRating: 4.8,
      _id: '3'
    },
    user: { name: 'Test User', _id: '1' }
  }
];

// Wait for loading to complete
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Simulate form input
export const fillForm = async (getByLabelText, formData) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = getByLabelText(new RegExp(fieldName, 'i'));
    fireEvent.change(field, { target: { value } });
  });
};

// Mock navigation
export const mockNavigate = jest.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null
};

// Setup localStorage for auth
export const setupAuthLocalStorage = (token = 'mock-token') => {
  localStorage.setItem('token', token);
};

export const clearAuthLocalStorage = () => {
  localStorage.removeItem('token');
};

// Default export with all utilities
export default {
  renderWithProviders,
  renderWithAuth,
  renderAsAdmin,
  renderAsTechnician,
  mockUser,
  mockAdmin,
  mockTechnician,
  mockAuthContext,
  mockAxiosResponse,
  mockAxiosError,
  mockTechnicians,
  mockServiceRequests,
  mockAppointments,
  waitForLoadingToFinish,
  fillForm,
  mockNavigate,
  mockLocation,
  setupAuthLocalStorage,
  clearAuthLocalStorage
};