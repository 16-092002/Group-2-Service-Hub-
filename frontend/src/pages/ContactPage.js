import React from 'react';
import { Container, Typography, Link, Box } from '@mui/material';

function ContactPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Contact Us</Typography>
      <Typography paragraph>
        For any queries, support, or feedback, please reach out to us:
      </Typography>
      <Box>
        <Typography><strong>Email:</strong> support@servicehub.com</Typography>
        <Typography><strong>Phone:</strong> +1 234 567 8900</Typography>
        <Typography>
          <strong>WhatsApp:</strong> <Link href="https://wa.me/12345678900" target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default ContactPage;
