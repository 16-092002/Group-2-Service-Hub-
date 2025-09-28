import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../pages/HomePage';
import { renderWithProviders, mockNavigate } from '../utils/testUtils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: '' })
}));

// Mock the hero image import
jest.mock('../assets/hero.png', () => 'mock-hero-image.png');

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders homepage with main elements', async () => {
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
    
    // Find the plumbing service card and click it
    const plumbingCards = screen.getAllByText('Plumbing');
    const plumbingServiceCard = plumbingCards.find(card => 
      card.closest('.MuiCard-root')
    );
    
    expect(plumbingServiceCard).toBeInTheDocument();
    fireEvent.click(plumbingServiceCard.closest('.MuiCard-root'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/request-service?service=plumbing');
    });
  });

  test('emergency contact opens WhatsApp', () => {
    renderWithProviders(<HomePage />);
    
    const emergencyButton = screen.getByText('Emergency? Call Now');
    fireEvent.click(emergencyButton);

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('wa.me/13828850973'),
      '_blank'
    );
  });

  test('handles geolocation permission granted', () => {
    const mockGetCurrentPosition = jest.fn((success) => {
      success({
        coords: {
          latitude: 43.6532,
          longitude: -79.3832
        }
      });
    });
    
    global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

    renderWithProviders(<HomePage />);

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  test('handles geolocation permission denied', () => {
    const mockGetCurrentPosition = jest.fn((success, error) => {
      error(new Error('Permission denied'));
    });
    
    global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

    renderWithProviders(<HomePage />);

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  test('renders featured technicians section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Top-Rated Technicians')).toBeInTheDocument();
    expect(screen.getByText('Meet our verified professionals with excellent track records')).toBeInTheDocument();
  });

  test('renders quick action buttons', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Request a Service')).toBeInTheDocument();
    expect(screen.getByText('Find a Technician')).toBeInTheDocument();
  });

  test('quick action buttons navigate correctly', async () => {
    renderWithProviders(<HomePage />);
    
    // Test Request Service button
    const requestServiceButton = screen.getByText('Request a Service');
    fireEvent.click(requestServiceButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/request-service');
    });

    // Test Find Technician button
    const findTechnicianButton = screen.getByText('Find a Technician');
    fireEvent.click(findTechnicianButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/technicians');
    });
  });

  test('displays service information correctly', () => {
    renderWithProviders(<HomePage />);
    
    // Check for service descriptions
    expect(screen.getByText('Expert plumbing repairs and installations')).toBeInTheDocument();
    expect(screen.getByText('Safe and reliable electrical services')).toBeInTheDocument();
    expect(screen.getByText('Heating, ventilation, and AC services')).toBeInTheDocument();
    expect(screen.getByText('Professional gas line services')).toBeInTheDocument();
  });

  test('search with URL parameters', () => {
    // Mock location with search params
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ search: '?service=electrical' })
    }));

    renderWithProviders(<HomePage />);
    
    // Component should handle URL parameters
    expect(screen.getByText('Electrical')).toBeInTheDocument();
  });

  test('renders without errors when geolocation is not available', () => {
    // Mock navigator without geolocation
    const originalNavigator = global.navigator;
    global.navigator = { ...originalNavigator };
    delete global.navigator.geolocation;

    expect(() => {
      renderWithProviders(<HomePage />);
    }).not.toThrow();

    // Restore navigator
    global.navigator = originalNavigator;
  });
});