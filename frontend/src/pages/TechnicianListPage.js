import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';

// Sample static data for demonstration, replace with API data later
const technicians = [
  { id: 1, name: 'John Doe', service: 'Plumbing', phone: '+1234567890' },
  { id: 2, name: 'Jane Smith', service: 'Electrical', phone: '+1987654321' },
  { id: 3, name: 'Alice Johnson', service: 'HVAC', phone: '+1234987654' },
];

function TechnicianListPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Technician List</Typography>
      <Grid container spacing={3}>
        {technicians.map((tech) => (
          <Grid item xs={12} sm={6} md={4} key={tech.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{tech.name}</Typography>
                <Typography color="text.secondary">{tech.service}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  href={`https://wa.me/${tech.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default TechnicianListPage;
