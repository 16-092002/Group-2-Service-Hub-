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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Star,
  Phone,
  LocationOn,
  AccessTime,
  CheckCircle,
  Pending,
  Build,
  Visibility,
  Edit,
  AttachMoney,
  TrendingUp,
  People,
  CalendarToday,
  Message
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function TechnicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedJobs: 0,
    pendingRequests: 0,
    completionRate: 0,
    averageRating: 0,
    totalRatings: 0,
    monthlyEarnings: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isActive, setIsActive] = useState(true);

  // Dialog states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch technician profile
      const profileRes = await axios.get('/api/technicians/me');
      setProfile(profileRes.data);
      setIsActive(profileRes.data.isActive);

      // Fetch statistics
      const statsRes = await axios.get('/api/technicians/stats');
      setStats(statsRes.data);

      // Fetch appointments
      const appointmentsRes = await axios.get('/api/appointments/technician/my');
      setAppointments(appointmentsRes.data);

      // Fetch service requests assigned to this technician
      const requestsRes = await axios.get('/api/service-requests/all');
      const myRequests = requestsRes.data.filter(
        req => req.assignedTechnician?._id === user.id || req.assignedTechnician === user.id
      );
      setServiceRequests(myRequests);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleToggleActive = async () => {
    try {
      await axios.put('/api/technicians/toggle-active');
      setIsActive(!isActive);
      toast.success(`Status changed to ${!isActive ? 'Active' : 'Inactive'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialog(true);
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}`, { status });
      toast.success('Appointment status updated');
      fetchDashboardData();
      setDetailsDialog(false);
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      scheduled: 'info',
      confirmed: 'primary',
      in_progress: 'secondary',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !profile) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Technician Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name}!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={handleToggleActive}
                color="primary"
              />
            }
            label={isActive ? 'Active' : 'Inactive'}
          />
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setProfileDialog(true)}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalRequests || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.completedJobs || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Jobs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Pending />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.pendingRequests || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.averageRating?.toFixed(1) || '0.0'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating ({stats.totalRatings || 0} reviews)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Appointments" icon={<Schedule />} iconPosition="start" />
          <Tab label="Service Requests" icon={<Assignment />} iconPosition="start" />
          <Tab label="Profile" icon={<Build />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Appointments Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No appointments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>{formatDate(appointment.date)}</TableCell>
                    <TableCell>{appointment.user?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.serviceType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {appointment.address?.city}, {appointment.address?.state}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        size="small"
                        color={getStatusColor(appointment.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/chat/${appointment.user?._id}`)}
                      >
                        <Message />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Service Requests Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No service requests assigned
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                serviceRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>{request.user?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip label={request.serviceType} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{request.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={2}>
        {profile && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography>{profile.phone || 'Not provided'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography>{profile.location || 'Not provided'}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Service Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Build sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography>Service: {profile.service || 'Not specified'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography>
                      Rating: {profile.averageRating?.toFixed(1) || 'N/A'} ({profile.totalRatings || 0} reviews)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography>
                      Completed Jobs: {profile.completedJobs || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Appointment Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAppointment.description || 'No description provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAppointment.address?.street}, {selectedAppointment.address?.city}, {selectedAppointment.address?.state} {selectedAppointment.address?.zipCode}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedAppointment?.status === 'scheduled' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleUpdateAppointmentStatus(selectedAppointment._id, 'confirmed')}
            >
              Confirm Appointment
            </Button>
          )}
          {selectedAppointment?.status === 'confirmed' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleUpdateAppointmentStatus(selectedAppointment._id, 'in_progress')}
            >
              Start Job
            </Button>
          )}
          {selectedAppointment?.status === 'in_progress' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleUpdateAppointmentStatus(selectedAppointment._id, 'completed')}
            >
              Complete Job
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TechnicianDashboard;