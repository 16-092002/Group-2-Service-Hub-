const mongoose = require('mongoose');
jest.setTimeout(30000);
// Mock console methods in test environment
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
global.createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  
  const user = new User({ ...defaultData, ...userData });
  await user.save();
  return user;
};

global.authenticateUser = async (app, userData = {}) => {
  const request = require('supertest');
  const user = await global.createTestUser(userData);
  
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: user.email,
      password: 'password123'
    });
    
  return {
    user,
    token: response.body.token
  };
};