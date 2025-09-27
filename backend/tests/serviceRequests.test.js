const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
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
  await ServiceRequest.deleteMany({});
});

describe('Service Request Endpoints', () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    userToken = loginResponse.body.token;
  });

  describe('POST /service-requests', () => {
    it('should create a service request', async () => {
      const requestData = {
        serviceType: 'plumbing',
        description: 'Leaky faucet needs repair',
        location: 'Toronto, ON',
        preferredDate: new Date(Date.now() + 86400000) // Tomorrow
      };

      const response = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.serviceType).toBe(requestData.serviceType);
      expect(response.body.description).toBe(requestData.description);
      expect(response.body.user).toBe(userId.toString());
    });

    it('should not create request without authentication', async () => {
      const requestData = {
        serviceType: 'plumbing',
        description: 'Leaky faucet needs repair'
      };

      await request(app)
        .post('/api/service-requests')
        .send(requestData)
        .expect(401);
    });
  });

  describe('GET /service-requests/my', () => {
    beforeEach(async () => {
      const serviceRequest = new ServiceRequest({
        user: userId,
        serviceType: 'electrical',
        description: 'Outlet not working',
        status: 'pending'
      });
      await serviceRequest.save();
    });

    it('should get user service requests', async () => {
      const response = await request(app)
        .get('/api/service-requests/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].serviceType).toBe('electrical');
    });
  });
});
