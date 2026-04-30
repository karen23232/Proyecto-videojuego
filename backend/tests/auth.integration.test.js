const request = require('supertest');
const app = require('../src/app');
const {
  connectTestDb,
  cleanupTestDb,
  disconnectTestDb,
} = require('./helpers/testDb');

describe('Auth integration', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('register -> login -> me flow works', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'felip',
        email: 'felip@example.com',
        password: '123456',
        confirmPassword: '123456',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.user.email).toBe('felip@example.com');
    expect(registerRes.body.accessToken).toBeDefined();
    expect(registerRes.headers['set-cookie']).toBeDefined();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'felip@example.com', password: '123456' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.accessToken).toBeDefined();

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe('felip@example.com');
  });

  test('refresh rotates token and logout clears session', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'maria',
        email: 'maria@example.com',
        password: '123456',
        confirmPassword: '123456',
      });

    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'maria@example.com', password: '123456' });

    expect(loginRes.status).toBe(200);

    const refreshRes = await agent.post('/api/v1/auth/refresh').send({});
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.accessToken).toBeDefined();

    const logoutRes = await agent.post('/api/v1/auth/logout').send({});
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await agent.post('/api/v1/auth/refresh').send({});
    expect(refreshAfterLogout.status).toBe(401);
  });
});
