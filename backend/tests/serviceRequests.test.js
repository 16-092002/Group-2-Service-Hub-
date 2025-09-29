const express = require('express');
const request = require('supertest');

const app = express();
app.use(express.json());

// Mock routes for testing only:
app.post('/auth/login', (req, res) => {
  res.status(200).json({ token: 'fake-token' });
});

app.post('/api/service-requests', (req, res) => {
  if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
  res.status(201).json({
    serviceType: req.body.serviceType,
    description: req.body.description,
    user: 'mockUserId',
  });
});

app.get('/api/service-requests/my', (req, res) => {
  if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
  res.status(200).json([
    {
      serviceType: 'electrical',
      description: 'Outlet not working',
      user: 'mockUserId',
    },
  ]);
});

describe('Service Request Endpoints', () => {
  it('should login and get token', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('fake-token');
  });

  it('should create a service request', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', 'Bearer fake-token')
      .send({ serviceType: 'plumbing', description: 'Fix sink' });

    expect(res.status).toBe(201);
    expect(res.body.serviceType).toBe('plumbing');
  });

  it('should get user service requests', async () => {
    const res = await request(app)
      .get('/api/service-requests/my')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].serviceType).toBe('electrical');
  });
});
