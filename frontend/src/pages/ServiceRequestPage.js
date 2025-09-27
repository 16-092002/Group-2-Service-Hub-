// frontend/src/pages/ServiceRequestPage.js - Fresh Complete Version
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Rating
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  LocationOn,
  Schedule,
  CheckCircle,
  ExpandMore,
  Info,
  Emergency,
  WhatsApp,
  Verified,
  AccessTime
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Service configuration
const SERVICES = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, clogs, installations, repairs',
    basePrice: 85,
    emergencyRate: 1.5,
    commonIssues: ['Leaky faucet', 'Clogged drain', 'Running toilet', 'Low water pressure', 'Pipe burst']
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Wiring, outlets, lighting, safety',
    basePrice: 95,
    emergencyRate: 2.0,
    commonIssues: ['Outlet not working', 'Flickering lights', 'Circuit breaker trips', 'New installation']
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Heating, cooling, ventilation',
    basePrice: 110,
    emergencyRate: 1.8,
    commonIssues: ['AC not cooling', 'Heater not working', 'Strange noises', 'Poor air quality']
  },
  {
    id: 'gas',
    name: 'Gas Services',
    description: 'Gas lines, appliances, safety checks',
    basePrice: 120,
    emergencyRate: 2.5,
    commonIssues: ['Gas leak', 'Appliance installation', 'Line inspection', 'Safety check']
  }
];

const STEPS = ['Service Details', 'Location & Schedule', 'Contact Info', 'Review & Submit'];

function ServiceRequestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Main state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [nearbyTechnicians, setNearbyTechnicians] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Service Details
    serviceType: '',
    specificIssue: '',
    urgency: 'normal',
    description: '',
    
    // Step 2: Location & Schedule
    address: '',
    city: '',
    state: 'ON',
    zipCode: '',
    preferredDate: null,
    timePreference: 'anytime',
    accessInstructions: '',
    
    // Step 3: Contact Info
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    budgetRange: '',
    additionalNotes: '',
    images: [],
    
    // Computed
    estimatedCost: 0,
    preferredTechnician: ''
  });

  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if (service) {
      setFormData(prev => ({ ...prev, serviceType: service }));
    }
  }, [location.search]);

  // Calculate estimated cost
  useEffect(() => {
    if (formData.serviceType && formData.urgency) {
      const service = SERVICES.find(s => s.id === formData.serviceType);
      if (service) {
        let cost = service.basePrice;
        if (formData.urgency === 'emergency') {
          cost *= service.emergencyRate;
        }
        setFormData(prev => ({ ...prev, estimatedCost: Math.round(cost) }));
      }
    }
  }, [formData.serviceType, formData.urgency]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size
        };
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Service Details
        if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 10) newErrors.description = 'Please provide more details';
        break;
        
      case 1: // Location & Schedule
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'Postal code is required';
        if (!formData.preferredDate) newErrors.preferredDate = 'Preferred date is required';
        break;
        
      case 2: // Contact Info
        if (!formData.contactName.trim()) newErrors.contactName = 'Name is required';
        if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone is required';
        if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setSubmitLoading(true);
    try {
      const requestData = {
        serviceType: formData.serviceType,
        description: formData.description,
        specificIssue: formData.specificIssue,
        urgency: formData.urgency,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          accessInstructions: formData.accessInstructions
        },
        preferredDate: formData.preferredDate,
        timePreference: formData.timePreference,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        budgetRange: formData.budgetRange,
        additionalNotes: formData.additionalNotes,
        estimatedCost: formData.estimatedCost
      };

      const response = await axios.post('/api/service-requests', requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccessDialog(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Service Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                What service do you need?
              </Typography>
              <Grid container spacing={2}>
                {SERVICES.map((service) => (
                  <Grid item xs={12} sm={6} key={service.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: formData.serviceType === service.id ? 2 : 1,
                        borderColor: formData.serviceType === service.id ? 'primary.main' : 'divider',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => handleInputChange('serviceType', service.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {service.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {service.description}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          Starting at ${service.basePrice}/hr
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {errors.serviceType && (
                <Alert severity="error" sx={{ mt: 2 }}>{errors.serviceType}</Alert>
              )}
            </Grid>

            {formData.serviceType && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Common issues for {SERVICES.find(s => s.id === formData.serviceType)?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {SERVICES.find(s => s.id === formData.serviceType)?.commonIssues.map((issue) => (
                      <Chip
                        key={issue}
                        label={issue}
                        onClick={() => handleInputChange('specificIssue', issue)}
                        color={formData.specificIssue === issue ? 'primary' : 'default'}
                        variant={formData.specificIssue === issue ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <FormControl component="fieldset" sx={{ mt: 2 }}>
                    <FormLabel component="legend">How urgent is this?</FormLabel>
                    <RadioGroup
                      value={formData.urgency}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      row
                    >
                      <FormControlLabel value="normal" control={<Radio />} label="Normal (3-5 days)" />
                      <FormControlLabel value="urgent" control={<Radio />} label="Urgent (Same day)" />
                      <FormControlLabel 
                        value="emergency" 
                        control={<Radio />} 
                        label="Emergency (24/7)" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Describe the problem in detail"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description}
                    placeholder="Please provide as much detail as possible..."
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 1: // Location & Schedule
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Service Location
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={!!errors.city}
                  helperText={errors.city}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Province"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                >
                  <MenuItem value="ON">Ontario</MenuItem>
                  <MenuItem value="BC">British Columbia</MenuItem>
                  <MenuItem value="AB">Alberta</MenuItem>
                  <MenuItem value="QC">Quebec</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  error={!!errors.zipCode}
                  helperText={errors.zipCode}
                  placeholder="A1A 1A1"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  When do you need service?
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Preferred Date & Time"
                  value={formData.preferredDate}
                  onChange={(date) => handleInputChange('preferredDate', date)}
                  minDateTime={new Date()}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.preferredDate}
                      helperText={errors.preferredDate}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Time Preference"
                  value={formData.timePreference}
                  onChange={(e) => handleInputChange('timePreference', e.target.value)}
                >
                  <MenuItem value="anytime">Anytime</MenuItem>
                  <MenuItem value="morning">Morning (8AM-12PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon (12PM-5PM)</MenuItem>
                  <MenuItem value="evening">Evening (5PM-8PM)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Access Instructions"
                  multiline
                  rows={2}
                  value={formData.accessInstructions}
                  onChange={(e) => handleInputChange('accessInstructions', e.target.value)}
                  placeholder="Gate codes, parking instructions, etc."
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 2: // Contact Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                error={!!errors.contactName}
                helperText={errors.contactName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                error={!!errors.contactPhone}
                helperText={errors.contactPhone}
                placeholder="+1 (416) 555-0123"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Budget Range"
                value={formData.budgetRange}
                onChange={(e) => handleInputChange('budgetRange', e.target.value)}
              >
                <MenuItem value="">Not specified</MenuItem>
                <MenuItem value="under-100">Under $100</MenuItem>
                <MenuItem value="100-250">$100 - $250</MenuItem>
                <MenuItem value="250-500">$250 - $500</MenuItem>
                <MenuItem value="500-1000">$500 - $1,000</MenuItem>
                <MenuItem value="over-1000">Over $1,000</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Upload Photos (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Photos help technicians understand the problem better
              </Typography>
              
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 2 }}
                >
                  Upload Images
                </Button>
              </label>

              {formData.images.length > 0 && (
                <Grid container spacing={2}>
                  {formData.images.map((image) => (
                    <Grid item xs={6} sm={4} md={3} key={image.id}>
                      <Card sx={{ position: 'relative' }}>
                        <img
                          src={image.preview}
                          alt="Upload preview"
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(image.id)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white'
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Any additional information..."
              />
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Service Request
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Service Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Service Type</Typography>
                      <Typography variant="body1">
                        {SERVICES.find(s => s.id === formData.serviceType)?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Urgency</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {formData.urgency}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{formData.description}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Location & Schedule</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">
                        {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Preferred Date</Typography>
                      <Typography variant="body1">
                        {formData.preferredDate ? 
                          new Date(formData.preferredDate).toLocaleString() : 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Time Preference</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {formData.timePreference}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Contact Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{formData.contactName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{formData.contactPhone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{formData.contactEmail}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom>
                  Estimated Cost
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${formData.estimatedCost}/hr
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Final cost may vary based on actual work required
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" icon={<Info />}>
                By submitting this request, you agree to our terms of service. 
                A technician will contact you to confirm the appointment.
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
        Request Professional Service
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Tell us what you need and we'll connect you with qualified technicians
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>
          
          <Box>
            {activeStep === STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitLoading}
                size="large"
                sx={{ minWidth: 150 }}
              >
                {submitLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit Request'
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                size="large"
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Request Submitted Successfully!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" align="center" paragraph>
            Your service request has been submitted. A qualified technician will 
            contact you shortly to confirm the appointment.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Request ID: #SR{Date.now().toString().slice(-6)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialog(false);
              navigate('/appointments');
            }}
            size="large"
          >
            View My Appointments
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setSuccessDialog(false);
              navigate('/');
            }}
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ServiceRequestPage;