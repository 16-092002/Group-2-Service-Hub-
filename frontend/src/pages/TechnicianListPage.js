import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Rating,
  Avatar,
  IconButton,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Phone,
  WhatsApp,
  VideoCall,
  Chat,
  Star,
  Verified,
  AccessTime,
  Work,
  Close,
  CalendarToday,
  EmergencyShare
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppointmentBooking from '../components/AppointmentBooking';
import axios from 'axios';
import toast from 'react-hot-toast';

const TechnicianCard = ({ 
  technician, 
  onContact, 
  onVideoCall, 
  onChat, 
  onViewProfile, 
  onBookAppointment 
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        position: 'relative'
      }}
    >
      {/* Status Indicators */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
        {technician.isVerified && (
          <Tooltip title="Verified Professional">
            <Chip
              icon={<Verified />}
              label="Verified"
              color="primary"
              size="small"
              sx={{ mb: 1, display: 'block' }}
            />
          </Tooltip>
        )}
        {technician.availability?.emergencyAvailable && (
          <Tooltip title="Emergency Services Available">
            <Chip
              icon={<EmergencyShare />}
              label="24/7"
              color="error"
              size="small"
              sx={{ display: 'block' }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Profile Section */}
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={!imageError ? technician.profileImage : undefined}
            onError={() => setImageError(true)}
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              bgcolor: 'primary.main',
              fontSize: '1.5rem'
            }}
          >
            {technician.name?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {technician.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {technician.service?.map((service, index) => (
                <Chip
                  key={index}
                  label={service}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Rating and Reviews */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating value={technician.averageRating || 0} precision={0.1} size="small" readOnly />
          <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
            {technician.averageRating?.toFixed(1) || 'No ratings'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({technician.totalRatings || 0} reviews)
          </Typography>
        </Box>

        {/* Key Information */}
        <Box sx={{ mb: 2 }}>
          {technician.location?.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {technician.location.city}, {technician.location.state}
              </Typography>
              {technician.distance && (
                <Typography variant="body2" color="primary" sx={{ ml: 'auto', fontWeight: 'bold' }}>
                  {technician.distance} mi
                </Typography>
              )}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Responds in {technician.responseTime || 60} min
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Work fontSize="small" color="action" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {technician.completedJobs || 0} jobs completed
            </Typography>
          </Box>

          {technician.pricing?.hourlyRate && (
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
              ${technician.pricing.hourlyRate}/hr
            </Typography>
          )}
        </Box>

        {/* Experience and Certifications */}
        {technician.experience?.years && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {technician.experience.years} years experience
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="WhatsApp">
            <IconButton
              color="success"
              onClick={() => onContact(technician)}
              sx={{ bgcolor: 'action.hover', mr: 1 }}
            >
              <WhatsApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call">
            <IconButton
              color="primary"
              onClick={() => onVideoCall(technician)}
              sx={{ bgcolor: 'action.hover', mr: 1 }}
            >
              <VideoCall />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chat">
            <IconButton
              color="primary"
              onClick={() => onChat(technician)}
              sx={{ bgcolor: 'action.hover' }}
            >
              <Chat />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onViewProfile(technician)}
            sx={{ mr: 1, textTransform: 'none' }}
          >
            View Profile
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<CalendarToday />}
            onClick={() => onBookAppointment(technician)}
            sx={{ textTransform: 'none' }}
          >
            Book
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

function TechnicianListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // State management
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    service: '',
    city: '',
    minRating: 0,
    maxDistance: 50,
    emergency: false,
    verified: false
  });
  const [sortBy, setSortBy] = useState('averageRating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Get query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    const lat = params.get('lat');
    const lng = params.get('lng');
    
    if (service) {
      setFilters(prev => ({ ...prev, service }));
    }
    
    fetchTechnicians();
  }, [location.search, page, sortBy, sortOrder, filters]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0 && value !== false) {
          params.append(key, value);
        }
      });
      
      params.append('page', page);
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axios.get(`/technicians?${params.toString()}`);
      setTechnicians(response.data.technicians || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      // Use mock data for demonstration
      setTechnicians(mockTechnicians);
      toast.error('Failed to load technicians. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleContact = (technician) => {
    const message = `Hi ${technician.name}, I'd like to request your ${technician.service.join('/')} services.`;
    const phone = technician.whatsappNumber || technician.phone || '+13828850973';
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleVideoCall = (technician) => {
    if (!isAuthenticated) {
      toast.error('Please login to start a video call');
      navigate('/login');
      return;
    }
    navigate(`/video-call/${technician._id || technician.user?._id}`);
  };

  const handleChat = async (technician) => {
    if (!isAuthenticated) {
      toast.error('Please login to start a chat');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('/chat/create', {
        otherUserId: technician._id || technician.user?._id
      });
      
      navigate(`/chat/${response.data.chat._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleViewProfile = (technician) => {
    setSelectedTechnician(technician);
    setProfileDialogOpen(true);
  };

  const handleBookAppointment = (technician) => {
    if (!isAuthenticated) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    
    setSelectedTechnician(technician);
    setBookingDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      service: '',
      city: '',
      minRating: 0,
      maxDistance: 50,
      emergency: false,
      verified: false
    });
    setPage(1);
  };

  // Mock data for demonstration
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
      experience: { years: 8 },
      phone: '+1234567890'
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
      experience: { years: 6 },
      phone: '+1987654321'
    }
  ];

  if (loading && technicians.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Find Professional Technicians
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Connect with verified professionals in your area
        </Typography>
      </Box>

      {/* Search and Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or service..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchTechnicians();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDrawerOpen(true)}
              >
                Filters
              </Button>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort by"
                >
                  <MenuItem value="averageRating">Rating</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="responseTime">Response Time</MenuItem>
                  <MenuItem value="completedJobs">Experience</MenuItem>
                  <MenuItem value="pricing.hourlyRate">Price</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Active Filters */}
      {Object.values(filters).some(value => value && value !== '' && value !== 0 && value !== false) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '' || value === 0 || value === false) return null;
              return (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onDelete={() => handleFilterChange(key, key === 'minRating' || key === 'maxDistance' ? 0 : '')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              );
            })}
            <Button size="small" onClick={clearFilters}>
              Clear All
            </Button>
          </Box>
        </Box>
      )}

      {/* Results Count */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {technicians.length} technicians found
        </Typography>
      </Box>

      {/* Technician Grid */}
      <Grid container spacing={3}>
        {technicians.map((technician) => (
          <Grid item xs={12} sm={6} md={4} key={technician._id}>
            <TechnicianCard
              technician={technician}
              onContact={handleContact}
              onVideoCall={handleVideoCall}
              onChat={handleChat}
              onViewProfile={handleViewProfile}
              onBookAppointment={handleBookAppointment}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 350, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Filters
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Service Type</InputLabel>
            <Select
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              label="Service Type"
            >
              <MenuItem value="">All Services</MenuItem>
              <MenuItem value="plumbing">Plumbing</MenuItem>
              <MenuItem value="electrical">Electrical</MenuItem>
              <MenuItem value="hvac">HVAC</MenuItem>
              <MenuItem value="gas">Gas Services</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Minimum Rating</Typography>
          <Slider
            value={filters.minRating}
            onChange={(e, value) => handleFilterChange('minRating', value)}
            min={0}
            max={5}
            step={0.5}
            marks={[
              { value: 0, label: '0' },
              { value: 2.5, label: '2.5' },
              { value: 5, label: '5' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Maximum Distance (miles)</Typography>
          <Slider
            value={filters.maxDistance}
            onChange={(e, value) => handleFilterChange('maxDistance', value)}
            min={1}
            max={100}
            step={5}
            marks={[
              { value: 1, label: '1' },
              { value: 50, label: '50' },
              { value: 100, label: '100' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.emergency}
                onChange={(e) => handleFilterChange('emergency', e.target.checked)}
              />
            }
            label="Emergency Services Available"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.verified}
                onChange={(e) => handleFilterChange('verified', e.target.checked)}
              />
            }
            label="Verified Professionals Only"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setFilterDrawerOpen(false);
              fetchTechnicians();
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Technician Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTechnician && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedTechnician.profileImage}
                  sx={{ width: 60, height: 60 }}
                >
                  {selectedTechnician.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedTechnician.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedTechnician.service?.map((service, index) => (
                      <Chip key={index} label={service} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  {selectedTechnician.isVerified && (
                    <Chip icon={<Verified />} label="Verified" color="primary" />
                  )}
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Rating & Reviews
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={selectedTechnician.averageRating || 0} precision={0.1} readOnly />
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {selectedTechnician.averageRating?.toFixed(1) || 'No ratings'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({selectedTechnician.totalRatings || 0} reviews)
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Experience
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTechnician.experience?.years} years of professional experience
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTechnician.completedJobs || 0} jobs completed successfully
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Pricing
                  </Typography>
                  {selectedTechnician.pricing?.hourlyRate && (
                    <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                      ${selectedTechnician.pricing.hourlyRate}/hour
                    </Typography>
                  )}
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Availability
                  </Typography>
                  <Typography variant="body2">
                    Response time: {selectedTechnician.responseTime || 60} minutes
                  </Typography>
                  {selectedTechnician.availability?.emergencyAvailable && (
                    <Chip
                      icon={<EmergencyShare />}
                      label="24/7 Emergency Available"
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<WhatsApp />}
                onClick={() => {
                  handleContact(selectedTechnician);
                  setProfileDialogOpen(false);
                }}
                color="success"
              >
                WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={<VideoCall />}
                onClick={() => {
                  handleVideoCall(selectedTechnician);
                  setProfileDialogOpen(false);
                }}
              >
                Video Call
              </Button>
              <Button
                variant="contained"
                startIcon={<CalendarToday />}
                onClick={() => {
                  setProfileDialogOpen(false);
                  handleBookAppointment(selectedTechnician);
                }}
              >
                Book Appointment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Appointment Booking Dialog */}
      <AppointmentBooking
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false);
          setSelectedTechnician(null);
        }}
        technician={selectedTechnician}
      />
    </Container>
  );
}

export default TechnicianListPage;