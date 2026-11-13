import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import './setup.js';
import { resetDatabase } from './setup.js';
import { createApp } from '../server/src/app.js';

let app: ReturnType<typeof createApp>;

before(async () => {
  await resetDatabase();
  app = createApp();
});

describe('health and catalog', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });

  it('returns catalog data', async () => {
    const categories = await request(app).get('/api/catalog/categories').expect(200);
    const governorates = await request(app).get('/api/catalog/governorates').expect(200);
    assert.ok(Array.isArray(categories.body.data.items));
    assert.ok(Array.isArray(governorates.body.data.items));
    assert.ok(categories.body.data.items.length > 0);
    assert.ok(governorates.body.data.items.length > 0);
  });
});

describe('authentication', () => {
  it('logs in the demo admin and returns the current user', async () => {
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ phone: '0790000000', password: 'Admin1234' }).expect(200);
    assert.equal(login.body.success, true);
    assert.equal(login.body.data.user.role, 'admin');

    const me = await agent.get('/api/auth/me').expect(200);
    assert.equal(me.body.data.user.phone, '0790000000');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ phone: '0790000000', password: 'wrong' }).expect(401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });
});

describe('listings', () => {
  it('lists and fetches a listing', async () => {
    const list = await request(app).get('/api/listings').expect(200);
    assert.ok(Array.isArray(list.body.data.items));
    assert.ok(list.body.data.items.length > 0);

    const id = list.body.data.items[0].id;
    const detail = await request(app).get(`/api/listings/${id}`).expect(200);
    assert.equal(detail.body.data.id, id);
  });

  it('creates a listing for a trader', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000002', password: 'Mostaqel123' }).expect(200);

    const created = await agent
      .post('/api/listings')
      .field('listingType', 'offer')
      .field('title', 'إعلان اختبار')
      .field('categoryId', '1')
      .field('quantity', '10')
      .field('unitId', '1')
      .field('governorateId', '2')
      .field('price', '1.25')
      .field('priceType', 'fixed')
      .expect(201);

    assert.equal(created.body.success, true);
    assert.equal(typeof created.body.data.id, 'number');
  });

  it('filters listings by type', async () => {
    const offers = await request(app).get('/api/listings').query({ listingType: 'offer' }).expect(200);
    const requests = await request(app).get('/api/listings').query({ listingType: 'request' }).expect(200);
    assert.ok(offers.body.data.items.every((item: { listingType: string }) => item.listingType === 'offer'));
    assert.ok(requests.body.data.items.every((item: { listingType: string }) => item.listingType === 'request'));
  });
});

describe('offers', () => {
  it('creates an offer on a purchase request', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000001', password: 'Mostaqel123' }).expect(200);

    const offer = await agent
      .post('/api/listings/4/offers')
      .send({ proposedPrice: 0.35, proposedQuantity: 1000, notes: 'عرض اختبار' })
      .expect(201);

    assert.equal(offer.body.success, true);
    assert.equal(typeof offer.body.data.id, 'number');
  });
});

describe('favorites and messages', () => {
  it('toggles a favorite', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000001', password: 'Mostaqel123' }).expect(200);

    const added = await agent.post('/api/favorites/1').expect(200);
    assert.equal(added.body.data.added, true);

    const removed = await agent.post('/api/favorites/1').expect(200);
    assert.equal(removed.body.data.added, false);
  });

  it('starts a conversation and sends a message', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000001', password: 'Mostaqel123' }).expect(200);

    const started = await agent.post('/api/messages').send({ recipientId: 3 }).expect(201);
    assert.ok(started.body.data.conversationId);

    const conversationId = started.body.data.conversationId;
    const sent = await agent.post(`/api/messages/${conversationId}/messages`).send({ content: 'رسالة اختبار' }).expect(201);
    assert.equal(typeof sent.body.data.id, 'number');

    const messages = await agent.get(`/api/messages/${conversationId}`).expect(200);
    assert.ok(messages.body.data.items.length > 0);
  });
});

describe('notifications and subscriptions', () => {
  it('returns notifications for the current user', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000001', password: 'Mostaqel123' }).expect(200);

    const res = await agent.get('/api/notifications').expect(200);
    assert.ok(Array.isArray(res.body.data.items));
    assert.equal(typeof res.body.data.unreadCount, 'number');
  });

  it('returns plans and the current subscription', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000001', password: 'Mostaqel123' }).expect(200);

    const plans = await request(app).get('/api/subscriptions/plans').expect(200);
    assert.ok(Array.isArray(plans.body.data.items));
    assert.ok(plans.body.data.items.length >= 2);

    const current = await agent.get('/api/subscriptions/me').expect(200);
    assert.ok(current.body.data.subscription);
    assert.ok(current.body.data.usage);
  });
});

describe('admin', () => {
  it('returns admin stats', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000000', password: 'Admin1234' }).expect(200);

    const stats = await agent.get('/api/admin/stats').expect(200);
    assert.equal(stats.body.success, true);
    assert.equal(typeof stats.body.data.users.total, 'number');
  });

  it('updates platform settings and syncs plan values', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000000', password: 'Admin1234' }).expect(200);

    await agent.patch('/api/admin/settings').send({ professional_price: '5.5' }).expect(200);

    const plans = await request(app).get('/api/subscriptions/plans').expect(200);
    const professional = plans.body.data.items.find((plan: { name: string }) => plan.name === 'professional');
    assert.equal(professional.price, 5.5);
  });

  it('prevents an admin from suspending their own account', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ phone: '0790000000', password: 'Admin1234' }).expect(200);

    const me = await agent.get('/api/auth/me').expect(200);
    const res = await agent.patch(`/api/admin/users/${me.body.data.user.id}/status`).send({ status: 'suspended' }).expect(400);
    assert.equal(res.body.error.code, 'CANNOT_CHANGE_OWN_STATUS');
  });
});