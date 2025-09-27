import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import TechnicianListPage from '../pages/TechnicianListPage';
import theme from '../theme';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: '' })
}));

const mockTechnicians = [
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

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('TechnicianListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        technicians: mockTechnicians,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalTechnicians: 2
        }
      }
    });
  });

  test('renders technician list page', async () => {
    renderWithProviders(<TechnicianListPage />);
    
    expect(screen.getByText('Find Professional Technicians')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });

  test('displays technician information correctly', async () => {
    renderWithProviders(<TechnicianListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('4.9')).toBeInTheDocument();
      expect(screen.getByText('(127 reviews)')).toBeInTheDocument();
      expect(screen.getByText('2.5 mi')).toBeInTheDocument();
      expect(screen.getByText('$85/hr')).toBeInTheDocument();
    });
  });

  test('search functionality works', async () => {
    renderWithProviders(<TechnicianListPage />);
    
    const searchInput = screen.getByPlaceholderText('Search by name or service...');
    fireEvent.change(searchInput, { target: { value: 'plumbing' } });

    // Should trigger search
    expect(searchInput.value).toBe('plumbing');
  });

  test('filter drawer opens and closes', async () => {
    renderWithProviders(<TechnicianListPage />);
    
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText('Service Type')).toBeInTheDocument();
      expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
  });

  test('WhatsApp contact works', async () => {
    global.open = jest.fn();
    
    renderWithProviders(<TechnicianListPage />);
    
    await waitFor(() => {
      const whatsappButtons = screen.getAllByTitle('WhatsApp');
      fireEvent.click(whatsappButtons[0]);
    });

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank'
    );
  });

  test('handles API error gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProviders(<TechnicianListPage />);
    
    // Should still render page structure
    expect(screen.getByText('Find Professional Technicians')).toBeInTheDocument();
  });
});
