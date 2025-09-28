import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Rating,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Star,
  Person,
  Add,
  Edit,
  Visibility,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Pending,
  Build,
  Cancel,
  RateReview
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function UserDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [serviceRequests, setServiceRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    activeRequests: 0,
    completedJobs: 0,
    upcomingAppointments: 0,
    totalSpent: 0
  });

  // Dialog states
  const [profileDialog, setProfileDialog] = useState(false);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [requestsRes, appointmentsRes, ratingsRes] = await Promise.all([
        axios.get('/service-requests/my'),
        axios.get('/appointments/user'),
        axios.get('/ratings/my')
      ]);

      setServiceRequests(requestsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setRatings(ratingsRes.data || []);

      // Calculate stats
      const activeRequests = requestsRes.data?.filter(r => 
        ['pending', 'assigned', 'in_progress'].includes(r.status)
      ).length || 0;
      
      const completedJobs = requestsRes.data?.filter(r => 
        r.status === 'completed'
      ).length || 0;

      const upcomingAppointments = appointmentsRes.data?.filter(a => 
        new Date(a.date) > new Date() && a.status === 'scheduled'
      ).length || 0;

      setStats({
        activeRequests,
        completedJobs,
        upcomingAppointments,
        totalSpent: completedJobs * 150 // Mock calculation
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use mock data for demo
      setServiceRequests(mockServiceRequests);
      setAppointments(mockAppointments);
      setRatings(mockRatings);
      setStats({
        activeRequests: 2,
        completedJobs: 5,
        upcomingAppointments: 1,
        totalSpent: 750
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    try {
      const result = await updateUser(profileForm);
      if (result.success) {
        setSuccess('Profile updated successfully');
        setProfileDialog(false);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  const handleRateService = (appointment) => {
    setSelectedAppointment(appointment);
    setRatingDialog(true);
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      await axios.post('/ratings', {
        ...ratingData,
        technicianId: selectedAppointment.technician._id,
        appointmentId: selectedAppointment._id
      });
      setSuccess('Rating submitted successfully');
      setRatingDialog(false);
      fetchUserData(); // Refresh data
    } catch (error) {
      setError('Failed to submit rating');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'assigned': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Mock data
  const mockServiceRequests = [
    {
      _id: '1',
      serviceType: 'plumbing',
      description: 'Fix leaky faucet',
      status: 'completed',
      createdAt: '2024-01-20',
      assignedTechnician: { name: 'John Smith' },
      estimatedCost: 150
    },
    {
      _id: '2',
      serviceType: 'electrical',
      description: 'Install new outlet',
      status: 'in_progress',
      createdAt: '2024-01-25',
      assignedTechnician: { name: 'Sarah Johnson' },
      estimatedCost: 200
    }
  ];

  const mockAppointments = [
    {
      _id: '1',
      serviceType: 'plumbing',
      date: '2024-02-01T10:00:00Z',
      status: 'scheduled',
      technician: { 
        name: 'Mike Davis', 
        phone: '+1234567890',
        service: ['plumbing'],
        averageRating: 4.8
      }
    }
  ];

  const mockRatings = [
    {
      _id: '1',
      technician: { name: 'John Smith' },
      rating: 5,
      review: 'Excellent work!',
      createdAt: '2024-01-21'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            My Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/request-service')}
          size="large"
        >
          Request Service
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Pending color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeRequests}
                  </Typography>
                  <Typography color="text.secondary">Active Requests</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completedJobs}
                  </Typography>
                  <Typography color="text.secondary">Completed Jobs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.upcomingAppointments}
                  </Typography>
                  <Typography color="text.secondary">Upcoming</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${stats.totalSpent}
                  </Typography>
                  <Typography color="text.secondary">Total Spent</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="user dashboard tabs"
        >
          <Tab label="Service Requests" icon={<Assignment />} />
          <Tab label="Appointments" icon={<Schedule />} />
          <Tab label="My Reviews" icon={<Star />} />
          <Tab label="Profile" icon={<Person />} />
        </Tabs>

        {/* Service Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">My Service Requests</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/request-service')}
            >
              New Request
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <Chip label={request.serviceType} color="primary" />
                    </TableCell>
                    <TableCell>{request.description}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.assignedTechnician?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${request.estimatedCost}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                      {request.status === 'completed' && (
                        <IconButton 
                          size="small"
                          onClick={() => handleRateService(request)}
                        >
                          <Star />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Appointments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Upcoming Appointments</Typography>
          </Box>
          
          <Grid container spacing={3}>
            {appointments.map((appointment) => (
              <Grid item xs={12} md={6} key={appointment._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip 
                        label={appointment.serviceType} 
                        color="primary" 
                      />
                      <Chip 
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {appointment.technician?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {appointment.technician?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={appointment.technician?.averageRating || 0} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {appointment.technician?.averageRating?.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {new Date(appointment.date).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {appointment.technician?.phone}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined">
                        Contact
                      </Button>
                      <Button size="small" variant="outlined">
                        Reschedule
                      </Button>
                      {appointment.status === 'completed' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => handleRateService(appointment)}
                        >
                          Rate
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>My Reviews</Typography>
          
          <List>
            {ratings.map((rating) => (
              <React.Fragment key={rating._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {rating.technician?.name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ mr: 2 }}>
                          {rating.technician?.name}
                        </Typography>
                        <Rating value={rating.rating} size="small" readOnly />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" paragraph>
                          {rating.review}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{user?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{user?.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Chip label={user?.role} color="primary" size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Member Since</Typography>
                    <Typography variant="body1">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setProfileDialog(true)}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialog} onClose={() => setProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              value={profileForm.address}
              onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleProfileUpdate} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate Your Experience</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Service with {selectedAppointment.technician?.name}
              </Typography>
              <Rating size="large" sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Write a review"
                multiline
                rows={4}
                placeholder="Share your experience..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog(false)}>Cancel</Button>
          <Button variant="contained">Submit Review</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default UserDashboard;