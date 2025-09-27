import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Rating,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Fade,
  Slide,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search,
  LocationOn,
  Phone,
  Star,
  AccessTime,
  Verified,
  Build,
  ElectricalServices,
  Plumbing,
  Thermostat,
  LocalGasStation,
  ArrowForward,
  WhatsApp,
  VideoCall,
  Chat
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import the image from the assets folder
import heroImage from '../assets/hero.png';

const services = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: <Plumbing sx={{ fontSize: 40, color: '#2196F3' }} />,
    description: 'Expert plumbing repairs and installations',
    color: '#E3F2FD'
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: <ElectricalServices sx={{ fontSize: 40, color: '#FF9800' }} />,
    description: 'Safe and reliable electrical services',
    color: '#FFF3E0'
  },
  {
    id: 'hvac',
    name: 'HVAC',
    icon: <Thermostat sx={{ fontSize: 40, color: '#4CAF50' }} />,
    description: 'Heating, ventilation, and AC services',
    color: '#E8F5E8'
  },
  {
    id: 'gas',
    name: 'Gas Services',
    icon: <LocalGasStation sx={{ fontSize: 40, color: '#F44336' }} />,
    description: 'Professional gas line services',
    color: '#FFEBEE'
  }
];

const featuredTechnicians = [
  {
    id: 1,
    name: 'John Smith',
    service: 'Plumbing',
    rating: 4.9,
    reviews: 127,
    responseTime: '15 min',
    image: '/api/placeholder/150/150',
    verified: true,
    completedJobs: 450,
    price: '$85/hr'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    service: 'Electrical',
    rating: 4.8,
    reviews: 98,
    responseTime: '20 min',
    image: '/api/placeholder/150/150',
    verified: true,
    completedJobs: 320,
    price: '$90/hr'
  },
  {
    id: 3,
    name: 'Mike Davis',
    service: 'HVAC',
    rating: 4.9,
    reviews: 156,
    responseTime: '12 min',
    image: '/api/placeholder/150/150',
    verified: true,
    completedJobs: 580,
    price: '$95/hr'
  }
];

function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  const handleSearch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedService) params.append('service', selectedService);
    if (location) params.append('location', location);
    if (userLocation) {
      params.append('lat', userLocation.latitude);
      params.append('lng', userLocation.longitude);
    }
    
    navigate(`/technicians?${params.toString()}`);
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    navigate(`/request-service?service=${serviceId}`);
  };

  const handleEmergencyContact = () => {
    window.open('https://wa.me/13828850973?text=Emergency%20service%20needed!', '_blank');
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, rgba(25, 118, 210, 0.9), rgba(21, 101, 192, 0.9)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant={isMobile ? "h3" : "h2"} 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                mb: 2
              }}
            >
              ServiceHub
            </Typography>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              paragraph
              sx={{
                mb: 4,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Your trusted partner for professional home services • Available 24/7
            </Typography>

            {/* Search Bar */}
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                maxWidth: 600,
                mx: 'auto',
                mb: 3
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    placeholder="What service do you need?"
                    variant="outlined"
                    size="medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Build color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    placeholder="Enter your location"
                    variant="outlined"
                    size="medium"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Find Technicians
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Emergency Contact */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<Phone />}
              onClick={handleEmergencyContact}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                textTransform: 'none',
                fontSize: '16px',
                px: 4,
                py: 1.5
              }}
            >
              Emergency? Call Now
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Our Services
          </Typography>
          <Typography 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
          >
            Professional technicians ready to solve your home service needs
          </Typography>
          
          <Grid container spacing={3}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={service.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6
                      },
                      borderRadius: 3,
                      background: service.color
                    }}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        {service.icon}
                      </Box>
                      <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                      <Button
                        variant="text"
                        endIcon={<ArrowForward />}
                        sx={{ mt: 2, textTransform: 'none' }}
                      >
                        Get Service
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Featured Technicians */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              Top-Rated Technicians
            </Typography>
            <Typography 
              variant="h6" 
              align="center" 
              color="text.secondary" 
              sx={{ mb: 6 }}
            >
              Meet our verified professionals with excellent track records
            </Typography>

            <Grid container spacing={4}>
              {featuredTechnicians.map((tech, index) => (
                <Grid item xs={12} sm={6} md={4} key={tech.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={tech.image}
                          alt={tech.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        {tech.verified && (
                          <Chip
                            icon={<Verified />}
                            label="Verified"
                            color="primary"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: 'rgba(25, 118, 210, 0.9)',
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                      
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          {tech.name}
                        </Typography>
                        
                        <Chip 
                          label={tech.service} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={tech.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {tech.rating}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({tech.reviews} reviews)
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            Responds in {tech.responseTime}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {tech.price}
                          </Typography>
                          <Box>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => window.open(`https://wa.me/13828850973?text=Hi, I'd like to hire ${tech.name} for ${tech.service} service`, '_blank')}
                            >
                              <WhatsApp />
                            </IconButton>
                            <IconButton size="small" color="primary">
                              <Chat />
                            </IconButton>
                            <IconButton size="small" color="primary">
                              <VideoCall />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                component={Link}
                to="/technicians"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '16px',
                  borderRadius: 3
                }}
              >
                View All Technicians
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Quick Actions */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Button
              component={Link}
              to="/request-service"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 3,
                fontSize: '1.2rem',
                textTransform: 'none',
                borderRadius: 3,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
              }}
            >
              Request a Service
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              component={Link}
              to="/technicians"
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              sx={{
                py: 3,
                fontSize: '1.2rem',
                textTransform: 'none',
                borderRadius: 3
              }}
            >
              Find a Technician
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default HomePage;
