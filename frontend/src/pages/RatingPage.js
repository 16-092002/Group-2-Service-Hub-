import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Rating,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import {
  Star,
  ThumbUp,
  ThumbDown,
  Reply,
  Flag,
  Close,
  CloudUpload
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RatingPage() {
  const { technicianId, serviceRequestId } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [images, setImages] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [serviceRequest, setServiceRequest] = useState(null);
  const [existingRatings, setExistingRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [technicianId, serviceRequestId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch technician details
      const techResponse = await axios.get(`/api/technicians/${technicianId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTechnician(techResponse.data);

      // Fetch service request details if provided
      if (serviceRequestId) {
        const serviceResponse = await axios.get(`/api/service-requests/${serviceRequestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServiceRequest(serviceResponse.data);
      }

      // Fetch existing ratings
      const ratingsResponse = await axios.get(`/api/ratings/technician/${technicianId}`);
      setExistingRatings(ratingsResponse.data.ratings || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          name: file.name
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Upload images first
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          const formData = new FormData();
          formData.append('image', image.file);
          
          const response = await axios.post('/api/upload/image', formData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          return {
            url: response.data.url,
            description: image.name
          };
        })
      );

      // Submit rating
      await axios.post('/api/ratings', {
        technicianId,
        serviceRequestId,
        rating,
        review,
        images: uploadedImages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmitDialog(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (ratingId, helpful) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/ratings/${ratingId}/helpful`, 
        { helpful },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh ratings
      fetchData();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Rate Your Experience
      </Typography>
      
      {technician && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                {technician.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{technician.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {technician.service?.join(', ')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Rating value={technician.averageRating || 0} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {technician.averageRating?.toFixed(1)} ({technician.totalRatings} reviews)
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {serviceRequest && (
              <Box>
                <Typography variant="body2" color="text.secondary">Service:</Typography>
                <Typography variant="body1">{serviceRequest.serviceType}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Completed: {new Date(serviceRequest.completedAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rating Form */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          How was your experience?
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Overall rating
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && 'Poor - Very unsatisfied'}
            {rating === 2 && 'Fair - Somewhat unsatisfied'}
            {rating === 3 && 'Good - Neutral'}
            {rating === 4 && 'Very Good - Satisfied'}
            {rating === 5 && 'Excellent - Very satisfied'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Write your review"
          placeholder="Share details about your experience..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          sx={{ mb: 3 }}
          inputProps={{ maxLength: 500 }}
          helperText={`${review.length}/500 characters`}
        />

        {/* Image Upload */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Add photos (optional)
          </Typography>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="rating-image-upload"
          />
          <label htmlFor="rating-image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Upload Photos
            </Button>
          </label>

          {images.length > 0 && (
            <Grid container spacing={2}>
              {images.map((image) => (
                <Grid item xs={6} sm={4} md={3} key={image.id}>
                  <Card sx={{ position: 'relative' }}>
                    <img
                      src={image.preview}
                      alt="Review"
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(image.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white'
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Box>
      </Paper>

      {/* Existing Reviews */}
      {existingRatings.length > 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Customer Reviews ({existingRatings.length})
          </Typography>
          
          {existingRatings.map((rating, index) => (
            <Box key={rating._id}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                    {rating.user?.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {rating.user?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={rating.rating} size="small" readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {rating.review}
                </Typography>
                
                {rating.images && rating.images.length > 0 && (
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {rating.images.map((image, imgIndex) => (
                      <Grid item key={imgIndex}>
                        <img
                          src={image.url}
                          alt="Review"
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    size="small"
                    startIcon={<ThumbUp />}
                    onClick={() => handleHelpful(rating._id, true)}
                  >
                    Helpful
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ThumbDown />}
                    onClick={() => handleHelpful(rating._id, false)}
                  >
                    Not Helpful
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Flag />}
                    color="error"
                  >
                    Report
                  </Button>
                </Box>
                
                {rating.response && (
                  <Box sx={{ ml: 6, mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Response from {technician?.name}
                    </Typography>
                    <Typography variant="body2">
                      {rating.response.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rating.response.respondedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {index < existingRatings.length - 1 && <Divider sx={{ my: 3 }} />}
            </Box>
          ))}
        </Paper>
      )}

      {/* Success Dialog */}
      <Dialog open={submitDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Star sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Thank You for Your Review!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography align="center" paragraph>
            Your rating has been submitted successfully. It helps other customers 
            make informed decisions and helps technicians improve their services.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/appointments')}
            size="large"
          >
            View My Appointments
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RatingPage;