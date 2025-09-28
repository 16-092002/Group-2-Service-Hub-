import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Rating,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  Build,
  Person,
  CalendarToday,
  CheckCircle
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import toast from 'react-hot-toast';

const steps = ['Select Date & Time', 'Service Details', 'Review & Confirm'];

const timeSlots = [
  { value: 'morning', label: 'Morning (8:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM - 5:00 PM)' },
  { value: 'evening', label: 'Evening (5:00 PM - 8:00 PM)' },
  { value: 'anytime', label: 'Anytime' }
];

const serviceTypes = [
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'gas', label: 'Gas Services', icon: '🔥' }
];

function AppointmentBooking({ 
  open, 
  onClose, 
  technician, 
  serviceRequest = null 
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    date: null,
    timeSlot: 'anytime',
    serviceType: serviceRequest?.serviceType || 'plumbing',
    description: serviceRequest?.description || '',
    address: '',
    estimatedDuration: 2,
    urgency: 'normal',
    specialInstructions: ''
  });

  useEffect(() => {
    if (open && technician) {
      resetForm();
    }
  }, [open, technician]);

  const resetForm = () => {
    setActiveStep(0);
    setErrors({});
    setFormData({
      date: null,
      timeSlot: 'anytime',
      serviceType: serviceRequest?.serviceType || 'plumbing',
      description: serviceRequest?.description || '',
      address: '',
      estimatedDuration: 2,
      urgency: 'normal',
      specialInstructions: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const fetchAvailableSlots = async (selectedDate) => {
    if (!selectedDate || !technician?._id) return;

    try {
      const response = await axios.get('/appointments/available-slots', {
        params: {
          technicianId: technician._id,
          date: selectedDate.toISOString().split('T')[0]
        }
      });
      setAvailableSlots(response.data.timeSlots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to fetch available time slots');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Date & Time
        if (!formData.date) {
          newErrors.date = 'Please select a date and time';
        } else if (formData.date < new Date()) {
          newErrors.date = 'Please select a future date';
        }
        break;
        
      case 1: // Service Details
        if (!formData.serviceType) {
          newErrors.serviceType = 'Please select a service type';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Please provide a description';
        }
        if (!formData.address.trim()) {
          newErrors.address = 'Please provide the service address';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 0 && formData.date) {
        fetchAvailableSlots(formData.date);
      }
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      const appointmentData = {
        technicianId: technician._id,
        serviceType: formData.serviceType,
        date: formData.date.toISOString(),
        timeSlot: formData.timeSlot,
        description: formData.description,
        address: formData.address,
        estimatedDuration: formData.estimatedDuration,
        serviceRequestId: serviceRequest?._id || null,
        specialInstructions: formData.specialInstructions
      };

      const response = await axios.post('/appointments', appointmentData);
      
      toast.success('Appointment booked successfully!');
      onClose();
      
      // Optionally redirect to appointments page
      // navigate('/appointments');
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to book appointment';
      toast.error(errorMessage);
      
      if (error.response?.status === 409) {
        setErrors({ date: 'This time slot is no longer available. Please choose another time.' });
        setActiveStep(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Select Date & Time
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Choose when you'd like the service to be performed
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <DateTimePicker
                  label="Preferred Date & Time"
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                  minDateTime={new Date()}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.date}
                      helperText={errors.date}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Time Slot</InputLabel>
                  <Select
                    value={formData.timeSlot}
                    onChange={(e) => handleInputChange('timeSlot', e.target.value)}
                    label="Preferred Time Slot"
                  >
                    {timeSlots.map((slot) => (
                      <MenuItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {availableSlots.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Time Slots:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableSlots.map((slot, index) => (
                      <Chip
                        key={index}
                        label={slot.label}
                        color={slot.available ? 'success' : 'default'}
                        variant={slot.available ? 'outlined' : 'filled'}
                        disabled={!slot.available}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </LocalizationProvider>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Service Details
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide details about the service you need
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.serviceType}>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  label="Service Type"
                >
                  {serviceTypes.map((service) => (
                    <MenuItem key={service.value} value={service.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{service.icon}</span>
                        {service.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.serviceType && (
                  <FormHelperText>{errors.serviceType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration (hours)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value))}
                inputProps={{ min: 0.5, max: 8, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description || 'Describe the work that needs to be done'}
                placeholder="Please provide details about the service you need..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address || 'Where should the service be performed?'}
                placeholder="123 Main St, City, Province, Postal Code"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Instructions (Optional)"
                multiline
                rows={2}
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special instructions for the technician..."
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review & Confirm
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your appointment details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {technician?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {technician?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={technician?.averageRating || 0} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({technician?.totalRatings || 0} reviews)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formData.date?.toLocaleDateString()} at{' '}
                          {formData.date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formData.estimatedDuration} hour{formData.estimatedDuration !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Build fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {serviceTypes.find(s => s.value === formData.serviceType)?.label}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formData.address}
                        </Typography>
                      </Box>
                    </Grid>

                    {formData.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Description:
                        </Typography>
                        <Typography variant="body2">
                          {formData.description}
                        </Typography>
                      </Grid>
                    )}

                    {formData.specialInstructions && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Special Instructions:
                        </Typography>
                        <Typography variant="body2">
                          {formData.specialInstructions}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" icon={<CheckCircle />}>
                The technician will contact you to confirm the appointment and provide any additional details.
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Book Appointment
        </Typography>
        {technician && (
          <Typography variant="body2" color="text.secondary">
            with {technician.name}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Box>
          {activeStep > 0 && (
            <Button 
              onClick={handleBack}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default AppointmentBooking;