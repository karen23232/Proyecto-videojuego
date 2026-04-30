const request = require('supertest');
const app = require('../src/app');
const {
  connectTestDb,
  cleanupTestDb,
  disconnectTestDb,
} = require('./helpers/testDb');

const registerAndLogin = async () => {
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      username: 'owner',
      email: 'owner@example.com',
      password: '123456',
      confirmPassword: '123456',
    });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'owner@example.com', password: '123456' });

  return loginRes.body.accessToken;
};

describe('Comments integration', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('guest can create and list comments', async () => {
    const createRes = await request(app)
      .post('/api/v1/comments')
      .send({
        authorName: 'Guest User',
        rating: 5,
        content: 'Excelente proyecto',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.comment.authorName).toBe('Guest User');

    const listRes = await request(app).get('/api/v1/comments?limit=10');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.comments)).toBe(true);
    expect(listRes.body.comments.length).toBe(1);
  });

  test('owner can update and delete own comment', async () => {
    const accessToken = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorName: 'Owner',
        rating: 4,
        content: 'Comentario inicial',
      });

    const commentId = createRes.body.comment._id;

    const updateRes = await request(app)
      .patch(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Comentario editado' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.comment.content).toBe('Comentario editado');

    const deleteRes = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get('/api/v1/comments');
    expect(listRes.body.comments.length).toBe(0);
  });
});
