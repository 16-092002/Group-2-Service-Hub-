const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');
const User = require('../models/User');

jest.mock('../models/User');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes (Mocked DB)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user and return token', async () => {
      // Mock User.findOne to simulate user not existing
      User.findOne.mockResolvedValue(null);

      // Mock token creation
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Mock the constructor and .save()
      const mockSavedUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(),
      };

      User.mockImplementation(() => mockSavedUser);

      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        })
        .expect(201);

      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body.user).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      });
    });

    it('should not allow signup with existing email', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const response = await request(app)
        .post('/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not login with invalid password', async () => {
      const mockUser = {
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should not login with unknown email', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'noone@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
