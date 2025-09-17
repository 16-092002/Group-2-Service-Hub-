import React from 'react';
import { Container, Typography, Button, Box, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

// Import the image from the assets folder
import heroImage from '../assets/hero.png';

function HomePage() {
  return (
    <Box>
      <Box
        sx={{
          backgroundImage: `url(${heroImage})`, // Use the imported image variable
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '438.75px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Service Hub
        </Typography>
        <Typography variant="h5" paragraph>
          HVAC • PLUMBING • ELECTRICAL • GAS
        </Typography>
      </Box>

      <Container sx={{ mt: 5, mb: 5 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Your one-stop solution for all your home service needs.
        </Typography>

        <Grid container spacing={4} justifyContent="center" sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              component={Link}
              to="/request-service"
              fullWidth
              variant="contained"
              sx={{ py: 2, fontSize: '1.2rem' }}
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
              sx={{ py: 2, fontSize: '1.2rem' }}
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