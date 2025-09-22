import React, { useState } from 'react';
import { Container, Typography, TextField, Button, MenuItem } from '@mui/material';

const services = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'gas', label: 'Gas Service' },
  { value: 'hvac', label: 'HVAC Repair' },
  { value: 'electrician', label: 'Electrician' },
];

function ServiceRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceType: '',
    description: '',
  });

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Here you would send this data to backend API
    alert('Service request submitted:\n' + JSON.stringify(formData, null, 2));
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Request a Service</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Your Name"
          name="name"
          fullWidth
          margin="normal"
          required
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          label="Phone Number"
          name="phone"
          fullWidth
          margin="normal"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        <TextField
          select
          label="Service Type"
          name="serviceType"
          fullWidth
          margin="normal"
          required
          value={formData.serviceType}
          onChange={handleChange}
        >
          {services.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Describe Your Issue"
          name="description"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          required
          value={formData.description}
          onChange={handleChange}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Submit Request
        </Button>
      </form>
    </Container>
  );
}

export default ServiceRequestPage;
