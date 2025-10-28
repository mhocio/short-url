// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const express = require('express');
const monk = require('monk');



// Import our express app
const app = require('../index.js');

// Increase timeout for all tests
jest.setTimeout(30000);

// Setup test database. Prefer CI-provided MONGODB_URI so tests and app use the same DB.
const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shorturl_test';
const db = monk(testDbUri);
const urls = db.get('urls');

beforeAll(async () => {
  // Verify database connection by attempting a harmless operation
  try {
    await urls.count({});
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean the test database before each test
  try {
    await urls.remove({});
  } catch (error) {
    console.error('Failed to clean test database:', error);
    throw error;
  }
});

afterAll(done => {
  // Clean up database and close connections
  Promise.resolve().then(async () => {
    try {
      await urls.drop();
    } catch (err) {
      if (!err.message?.includes('ns not found')) {
        console.error('Error dropping collection:', err);
      }
    }
    
    try {
      await db.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }
    done();
  });
}, 30000);

describe('POST /url', () => {
  it('should create a new short URL with custom slug', async () => {
    const response = await request(app)
      .post('/url')
      .send({
        url: 'https://example.com',
        slug: 'test-slug'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      url: 'https://example.com',
      slug: 'test-slug',
      clicks: 0
    });
    expect(response.body).not.toHaveProperty('_id');
  });

  it('should create a new short URL with generated slug', async () => {
    const response = await request(app)
      .post('/url')
      .send({
        url: 'https://example.com'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      url: 'https://example.com',
      clicks: 0
    });
    expect(response.body.slug).toMatch(/^[a-z0-9]{5}$/); // nanoid(5) lowercase
    expect(response.body).not.toHaveProperty('_id');
  });

  it('should return 409 for duplicate slug', async () => {
    // Create first URL
    await request(app)
      .post('/url')
      .send({
        url: 'https://example.com',
        slug: 'test-slug'
      });

    // Try to create duplicate
    const response = await request(app)
      .post('/url')
      .send({
        url: 'https://another-example.com',
        slug: 'test-slug'
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      message: 'Slug in use.'
    });
  });

  it('should return 400 for invalid URL', async () => {
    const response = await request(app)
      .post('/url')
      .send({
        url: 'not-a-url',
        slug: 'test-slug'
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /:id', () => {
  it('should redirect to stored URL and increment clicks', async () => {
    // Create a URL first
    const createResponse = await request(app)
      .post('/url')
      .send({
        url: 'https://example.com',
        slug: 'test-slug'
      });

    // Try to access it
    const response = await request(app)
      .get('/test-slug')
      .expect(302); // expect redirect

    expect(response.headers.location).toBe('https://example.com');

    // Verify clicks were incremented
    const urlDoc = await urls.findOne({ slug: 'test-slug' });
    expect(urlDoc.clicks).toBe(1);
  });

  it('should redirect to error page for non-existent slug', async () => {
    const response = await request(app)
      .get('/non-existent')
      .expect(302); // expect redirect

    expect(response.headers.location).toBe('/?error=non-existent%20not%20found');
  });
});