const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Rating = require('../models/Rating');
const ServiceRequest = require('../models/ServiceRequest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Rating.deleteMany({});
  await ServiceRequest.deleteMany({});
});

describe('Rating Endpoints', () => {
  let userToken;
  let technicianToken;
  let userId;
  let technicianId;
  let serviceRequestId;

  beforeEach(async () => {
    // Create user
    const user = new User({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user'
    });
    await user.save();
    userId = user._id;

    // Create technician
    const technician = new User({
      name: 'Test Technician',
      email: 'tech@example.com',
      password: 'password123',
      role: 'technician'
    });
    await technician.save();
    technicianId = technician._id;

    // Create completed service request
    const serviceRequest = new ServiceRequest({
      user: userId,
      assignedTechnician: technicianId,
      serviceType: 'plumbing',
      description: 'Fixed leak',
      status: 'completed'
    });
    await serviceRequest.save();
    serviceRequestId = serviceRequest._id;

    // Get tokens
    const userLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    userToken = userLogin.body.token;

    const techLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'tech@example.com', password: 'password123' });
    technicianToken = techLogin.body.token;
  });

  describe('POST /ratings', () => {
    it('should create a rating', async () => {
      const ratingData = {
        technicianId,
        serviceRequestId,
        rating: 5,
        review: 'Excellent work!'
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(201);

      expect(response.body.rating.rating).toBe(5);
      expect(response.body.rating.review).toBe('Excellent work!');
    });

    it('should not allow duplicate ratings', async () => {
      const ratingData = {
        technicianId,
        serviceRequestId,
        rating: 5,
        review: 'Great!'
      };

      // Create first rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(201);

      // Try to create duplicate
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(400);
    });
  });

  describe('GET /ratings/technician/:id', () => {
    beforeEach(async () => {
      const rating = new Rating({
        user: userId,
        technician: technicianId,
        serviceRequest: serviceRequestId,
        rating: 5,
        review: 'Great service!'
      });
      await rating.save();
    });

    it('should get technician ratings', async () => {
      const response = await request(app)
        .get(`/api/ratings/technician/${technicianId}`)
        .expect(200);

      expect(response.body.ratings).toHaveLength(1);
      expect(response.body.summary.averageRating).toBe(5);
    });
  });
});
