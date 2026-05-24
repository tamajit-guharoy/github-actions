const request = require('supertest');
const app = require('./index');
const db = require('./db');

beforeAll(async () => {
  await db.initDb();
  // Clean slate for tests
  await db.pool.query('DELETE FROM messages');
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.pool.query('DELETE FROM messages');
});

describe('GET /', () => {
  it('returns a greeting', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Hello');
  });
});

describe('POST /messages', () => {
  it('creates a new message and returns it', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ content: 'Integration test message' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Integration test message');
    expect(res.body.id).toBeDefined();
  });

  it('persists messages to the database', async () => {
    await request(app).post('/messages').send({ content: 'First' });
    await request(app).post('/messages').send({ content: 'Second' });

    const res = await request(app).get('/messages');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].content).toBe('Second');  // newest first
  });
});
