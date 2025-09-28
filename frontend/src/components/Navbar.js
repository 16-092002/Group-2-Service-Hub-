import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  ExitToApp,
  Settings,
  Notifications,
  Build
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'technician':
        return '/technician/dashboard';
      default:
        return '/dashboard';
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo */}
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          ServiceHub
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            sx={{
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Home
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            to="/technicians"
            sx={{
              backgroundColor: isActive('/technicians') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Find Technicians
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            to="/contact"
            sx={{
              backgroundColor: isActive('/contact') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Contact
          </Button>

          {isAuthenticated ? (
            <>
              {/* Dashboard Button */}
              <Button
                color="inherit"
                component={Link}
                to={getDashboardPath()}
                startIcon={<Dashboard />}
                sx={{
                  backgroundColor: location.pathname.includes('dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Dashboard
              </Button>

              {/* Request Service Button for non-admin users */}
              {user?.role !== 'admin' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/request-service"
                  startIcon={<Build />}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Request Service
                </Button>
              )}

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={0} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Menu */}
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'secondary.main' 
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { minWidth: 200 }
                }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                    <Typography variant="caption" color="primary" display="block">
                      {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}
                    </Typography>
                  </Box>
                </MenuItem>
                
                <Divider />
                
                <MenuItem 
                  onClick={() => { 
                    navigate(getDashboardPath()); 
                    handleMenuClose(); 
                  }}
                >
                  <Dashboard sx={{ mr: 2 }} />
                  Dashboard
                </MenuItem>
                
                <MenuItem 
                  onClick={() => { 
                    navigate('/profile'); 
                    handleMenuClose(); 
                  }}
                >
                  <AccountCircle sx={{ mr: 2 }} />
                  Profile
                </MenuItem>
                
                <MenuItem 
                  onClick={() => { 
                    navigate('/settings'); 
                    handleMenuClose(); 
                  }}
                >
                  <Settings sx={{ mr: 2 }} />
                  Settings
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 2 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
                sx={{
                  backgroundColor: isActive('/login') ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Login
              </Button>
              
              <Button 
                color="inherit" 
                component={Link} 
                to="/signup"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  backgroundColor: isActive('/signup') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;