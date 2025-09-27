const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Technician = require('../models/Technician');
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
  await Technician.deleteMany({});
});

describe('Technician Endpoints', () => {
  let userToken;
  let technicianToken;
  let technicianUser;
  let regularUser;

  beforeEach(async () => {
    // Create regular user
    regularUser = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user'
    });
    await regularUser.save();

    // Create technician user
    technicianUser = new User({
      name: 'Tech User',
      email: 'tech@example.com',
      password: 'password123',
      role: 'technician'
    });
    await technicianUser.save();

    // Get tokens
    const userLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });
    userToken = userLogin.body.token;

    const techLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'tech@example.com',
        password: 'password123'
      });
    technicianToken = techLogin.body.token;
  });

  describe('GET /technicians', () => {
    beforeEach(async () => {
      // Create technician profile
      const technician = new Technician({
        user: technicianUser._id,
        service: ['plumbing'],
        phone: '+1234567890',
        location: {
          city: 'Toronto',
          state: 'ON',
          coordinates: { latitude: 43.6532, longitude: -79.3832 }
        },
        averageRating: 4.5,
        totalRatings: 10
      });
      await technician.save();
    });

    it('should get all technicians', async () => {
      const response = await request(app)
        .get('/api/technicians')
        .expect(200);

      expect(response.body.technicians).toHaveLength(1);
      expect(response.body.technicians[0]).toHaveProperty('service');
      expect(response.body.technicians[0].service).toContain('plumbing');
    });

    it('should filter technicians by service', async () => {
      const response = await request(app)
        .get('/api/technicians?service=plumbing')
        .expect(200);

      expect(response.body.technicians).toHaveLength(1);
    });

    it('should filter technicians by rating', async () => {
      const response = await request(app)
        .get('/api/technicians?minRating=4')
        .expect(200);

      expect(response.body.technicians).toHaveLength(1);
    });
  });

  describe('POST /technicians/me', () => {
    it('should create technician profile', async () => {
      const technicianData = {
        service: ['electrical'],
        phone: '+1987654321',
        location: {
          address: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          zipCode: 'M5V 3A1'
        },
        experience: {
          years: 5,
          description: 'Experienced electrician'
        },
        pricing: {
          hourlyRate: 85
        }
      };

      const response = await request(app)
        .post('/api/technicians/me')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send(technicianData)
        .expect(201);

      expect(response.body.technician.service).toContain('electrical');
      expect(response.body.technician.phone).toBe(technicianData.phone);
    });

    it('should not create profile for non-technician user', async () => {
      const technicianData = {
        service: ['electrical'],
        phone: '+1987654321'
      };

      await request(app)
        .post('/api/technicians/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(technicianData)
        .expect(400);
    });
  });

  describe('GET /technicians/search', () => {
    beforeEach(async () => {
      const technician = new Technician({
        user: technicianUser._id,
        service: ['plumbing'],
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 43.6532, longitude: -79.3832 }
        },
        availability: { emergencyAvailable: true }
      });
      await technician.save();
    });

    it('should search technicians by location and service', async () => {
      const response = await request(app)
        .get('/api/technicians/search')
        .query({
          serviceType: 'plumbing',
          latitude: 43.6532,
          longitude: -79.3832,
          radius: 10
        })
        .expect(200);

      expect(response.body.technicians).toHaveLength(1);
    });

    it('should filter emergency technicians', async () => {
      const response = await request(app)
        .get('/api/technicians/search')
        .query({
          serviceType: 'plumbing',
          emergency: 'true'
        })
        .expect(200);

      expect(response.body.technicians).toHaveLength(1);
    });
  });
});