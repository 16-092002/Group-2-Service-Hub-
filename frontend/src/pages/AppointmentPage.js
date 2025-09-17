import React from 'react';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';

// Static example appointments; replace with dynamic data later
const appointments = [
  { id: 1, service: 'Plumbing', date: '2025-09-20', technician: 'John Doe' },
  { id: 2, service: 'Electrical', date: '2025-09-25', technician: 'Jane Smith' },
];

function AppointmentPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Your Appointments</Typography>
      <List>
        {appointments.map((appt) => (
          <ListItem key={appt.id} divider>
            <ListItemText
              primary={`${appt.service} with ${appt.technician}`}
              secondary={`Date: ${appt.date}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default AppointmentPage;
