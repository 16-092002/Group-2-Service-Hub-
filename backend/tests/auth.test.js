const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const User = require('../models/User');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/auth', authRoutes);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
  });
  
  return app;
};

describe('Auth Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not create user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(500); // MongoDB validation error
    });

    it('should not create user with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      };

      // Create first user
      await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(400);
    });

    it('should not create user without required fields', async () => {
      const userData = {
        name: 'John Doe'
        // Missing email and password
      };

      await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(500);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await global.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should not login without email', async () => {
      const loginData = {
        password: 'password123'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should not login without password', async () => {
      const loginData = {
        email: 'john@example.com'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    let userAuth;

    beforeEach(async () => {
      userAuth = await global.authenticateUser(app, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${userAuth.token}`)
        .expect(200);

      expect(response.body.email).toBe('john@example.com');
      expect(response.body.name).toBe('John Doe');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get user without token', async () => {
      await request(app)
        .get('/auth/me')
        .expect(401);
    });

    it('should not get user with invalid token', async () => {
      await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should not get user with malformed token', async () => {
      await request(app)
        .get('/auth/me')
        .set('Authorization', 'invalidtoken')
        .expect(401);
    });
  });

  describe('PUT /auth/me', () => {
    let userAuth;

    beforeEach(async () => {
      userAuth = await global.authenticateUser(app, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'John Updated',
        email: 'johnupdated@example.com'
      };

      const response = await request(app)
        .put('/auth/me')
        .set('Authorization', `Bearer ${userAuth.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
    });

    it('should update password', async () => {
      const updateData = {
        password: 'newpassword123'
      };

      await request(app)
        .put('/auth/me')
        .set('Authorization', `Bearer ${userAuth.token}`)
        .send(updateData)
        .expect(200);

      // Try to login with new password
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should not update with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      await request(app)
        .put('/auth/me')
        .set('Authorization', `Bearer ${userAuth.token}`)
        .send(updateData)
        .expect(500);
    });

    it('should not update without authentication', async () => {
      const updateData = {
        name: 'John Updated'
      };

      await request(app)
        .put('/auth/me')
        .send(updateData)
        .expect(401);
    });
  });
});