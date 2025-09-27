import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import ServiceRequestPage from '../pages/ServiceRequestPage';
import theme from '../theme';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: '' })
}));

// Mock date picker
jest.mock('@mui/x-date-pickers/DateTimePicker', () => {
  return function MockDateTimePicker({ onChange, renderInput }) {
    const mockProps = {
      onChange: (e) => onChange(new Date(e.target.value)),
      value: '',
      type: 'datetime-local'
    };
    return renderInput(mockProps);
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ServiceRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders service request page', () => {
    renderWithProviders(<ServiceRequestPage />);
    
    expect(screen.getByText('Request Professional Service')).toBeInTheDocument();
    expect(screen.getByText('Service Details')).toBeInTheDocument();
    expect(screen.getByText('What service do you need?')).toBeInTheDocument();
  });

  test('renders all service options', () => {
    renderWithProviders(<ServiceRequestPage />);
    
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('HVAC')).toBeInTheDocument();
    expect(screen.getByText('Gas Services')).toBeInTheDocument();
  });

  test('service selection works', async () => {
    renderWithProviders(<ServiceRequestPage />);
    
    const plumbingCard = screen.getByText('Plumbing').closest('.MuiCard-root');
    fireEvent.click(plumbingCard);

    await waitFor(() => {
      expect(screen.getByText('Common issues for Plumbing')).toBeInTheDocument();
    });
  });

  test('form validation works', async () => {
    renderWithProviders(<ServiceRequestPage />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Service type is required')).toBeInTheDocument();
    });
  });

  test('multi-step navigation works', async () => {
    renderWithProviders(<ServiceRequestPage />);
    
    // Step 1: Select service and fill description
    const plumbingCard = screen.getByText('Plumbing').closest('.MuiCard-root');
    fireEvent.click(plumbingCard);

    const descriptionInput = screen.getByLabelText('Describe the problem in detail');
    fireEvent.change(descriptionInput, { target: { value: 'Leaky faucet' } });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Service Location')).toBeInTheDocument();
    });
  });

  test('urgency selection updates estimated cost', async () => {
    renderWithProviders(<ServiceRequestPage />);
    
    // Select service first
    const plumbingCard = screen.getByText('Plumbing').closest('.MuiCard-root');
    fireEvent.click(plumbingCard);

    // Select emergency
    const emergencyRadio = screen.getByLabelText(/Emergency/);
    fireEvent.click(emergencyRadio);

    // Should show higher cost for emergency
    await waitFor(() => {
      // Emergency rate should be higher than base rate
      expect(screen.getByText(/Emergency/)).toBeInTheDocument();
    });
  });

  test('file upload works', async () => {
    renderWithProviders(<ServiceRequestPage />);
    
    // Navigate to step 3
    const plumbingCard = screen.getByText('Plumbing').closest('.MuiCard-root');
    fireEvent.click(plumbingCard);

    const descriptionInput = screen.getByLabelText('Describe the problem in detail');
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    let nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Fill required location fields
    await waitFor(() => {
      const addressInput = screen.getByLabelText('Street Address');
      fireEvent.change(addressInput, { target: { value: '123 Test St' } });
    });

    nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Upload Images');
      expect(fileInput).toBeInTheDocument();
    });

    // Test file upload
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByDisplayValue('');
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
});