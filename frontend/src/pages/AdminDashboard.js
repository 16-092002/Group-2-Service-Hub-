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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  Avatar,
  Rating
} from '@mui/material';
import {
  Dashboard,
  People,
  Build,
  Assignment,
  Analytics,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Verified
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    activeRequests: 0,
    completedRequests: 0
  });
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  
  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [techPage, setTechPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  
  // Dialog states
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, techRes, requestsRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/users'),
        axios.get('/admin/technicians'),
        axios.get('/admin/service-requests')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setTechnicians(techRes.data.technicians || []);
      setServiceRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      // Use mock data for demo
      setStats({
        totalUsers: 145,
        totalTechnicians: 23,
        activeRequests: 12,
        completedRequests: 89
      });
      setUsers(mockUsers);
      setTechnicians(mockTechnicians);
      setServiceRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserDialog(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirmDialog(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`/admin/users/${userToDelete._id}`);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setSuccess('User deleted successfully');
      setDeleteConfirmDialog(false);
      setUserToDelete(null);
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const response = await axios.put(`/admin/users/${selectedUser._id}`, userData);
      setUsers(users.map(u => u._id === selectedUser._id ? response.data : u));
      setSuccess('User updated successfully');
      setEditUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const handleVerifyTechnician = async (technicianId) => {
    try {
      await axios.put(`/admin/technicians/${technicianId}/verify`);
      setTechnicians(technicians.map(t => 
        t._id === technicianId ? { ...t, isVerified: true } : t
      ));
      setSuccess('Technician verified successfully');
    } catch (error) {
      setError('Failed to verify technician');
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await axios.put(`/admin/service-requests/${requestId}`, { status });
      setServiceRequests(serviceRequests.map(r => 
        r._id === requestId ? { ...r, status } : r
      ));
      setSuccess('Request status updated');
    } catch (error) {
      setError('Failed to update request status');
    }
  };

  // Mock data for demo
  const mockUsers = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: '2024-01-15',
      isActive: true
    },
    {
      _id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'technician',
      createdAt: '2024-01-10',
      isActive: true
    }
  ];

  const mockTechnicians = [
    {
      _id: '1',
      user: { name: 'Mike Wilson', email: 'mike@example.com' },
      service: ['plumbing'],
      isVerified: false,
      averageRating: 4.5,
      totalRatings: 12,
      completedJobs: 45,
      createdAt: '2024-01-20'
    }
  ];

  const mockRequests = [
    {
      _id: '1',
      user: { name: 'Alice Johnson' },
      serviceType: 'plumbing',
      status: 'pending',
      createdAt: '2024-01-25',
      assignedTechnician: null
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Typography color="text.secondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Build color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalTechnicians}
                  </Typography>
                  <Typography color="text.secondary">Technicians</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="warning" sx={{ fontSize: 40, mr: 2 }} />
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
                    {stats.completedRequests}
                  </Typography>
                  <Typography color="text.secondary">Completed</Typography>
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
          aria-label="admin dashboard tabs"
        >
          <Tab label="Users" icon={<People />} />
          <Tab label="Technicians" icon={<Build />} />
          <Tab label="Service Requests" icon={<Assignment />} />
          <Tab label="Analytics" icon={<Analytics />} />
        </Tabs>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'error' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Technicians Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Technician</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Jobs</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {technicians.map((tech) => (
                  <TableRow key={tech._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {tech.user?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {tech.user?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tech.user?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {tech.service?.map((service) => (
                        <Chip key={service} label={service} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={tech.averageRating} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({tech.totalRatings})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{tech.completedJobs}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={tech.isVerified ? <Verified /> : undefined}
                        label={tech.isVerified ? 'Verified' : 'Unverified'}
                        color={tech.isVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {!tech.isVerified && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleVerifyTechnician(tech._id)}
                        >
                          Verify
                        </Button>
                      )}
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Service Requests Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.user?.name}</TableCell>
                    <TableCell>{request.serviceType}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status}
                        color={
                          request.status === 'completed' ? 'success' :
                          request.status === 'in_progress' ? 'info' :
                          request.status === 'assigned' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.assignedTechnician?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={request.status}
                          onChange={(e) => handleUpdateRequestStatus(request._id, e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="assigned">Assigned</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography color="text.secondary">
            Analytics features coming soon...
          </Typography>
        </TabPanel>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                defaultValue={selectedUser.name}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                defaultValue={selectedUser.email}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select defaultValue={selectedUser.role}>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboard;