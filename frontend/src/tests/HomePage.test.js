import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import HomePage from '../pages/HomePage';
import theme from '../theme';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn()
};

global.navigator.geolocation = mockGeolocation;

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders homepage with main elements', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('ServiceHub')).toBeInTheDocument();
    expect(screen.getByText(/Your trusted partner for professional home services/)).toBeInTheDocument();
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('Top-Rated Technicians')).toBeInTheDocument();
  });

  test('renders all service types', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('HVAC')).toBeInTheDocument();
    expect(screen.getByText('Gas Services')).toBeInTheDocument();
  });

  test('search functionality works', async () => {
    renderWithProviders(<HomePage />);
    
    const searchInput = screen.getByPlaceholderText('What service do you need?');
    const locationInput = screen.getByPlaceholderText('Enter your location');
    const searchButton = screen.getByText('Find Technicians');

    fireEvent.change(searchInput, { target: { value: 'plumbing' } });
    fireEvent.change(locationInput, { target: { value: 'Toronto' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/technicians'));
    });
  });

  test('service cards are clickable', async () => {
    renderWithProviders(<HomePage />);
    
    const plumbingCard = screen.getByText('Plumbing').closest('.MuiCard-root');
    fireEvent.click(plumbingCard);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/request-service?service=plumbing');
    });
  });

  test('emergency contact opens WhatsApp', () => {
    // Mock window.open
    global.open = jest.fn();
    
    renderWithProviders(<HomePage />);
    
    const emergencyButton = screen.getByText('Emergency? Call Now');
    fireEvent.click(emergencyButton);

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('wa.me/13828850973'),
      '_blank'
    );
  });

  test('handles geolocation permission', () => {
    const mockSuccess = jest.fn();
    const mockError = jest.fn();
    
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
      success({
        coords: {
          latitude: 43.6532,
          longitude: -79.3832
        }
      });
    });

    renderWithProviders(<HomePage />);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });
});
