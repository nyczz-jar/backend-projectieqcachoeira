const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const { createApp } = require('../src/app');

let server;
let baseUrl;
let failDatabaseRequests = false;
const calls = [];

const prisma = {
  event: {
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['event.findMany', args]);
      return [{ id: 'event-1', title: 'Culto', date: '2026-11-01T18:00:00.000Z', location: 'Templo' }];
    },
    create: async ({ data }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['event.create', data]);
      return { id: 'event-2', ...data };
    },
  },
  activity: {
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['activity.findMany', args]);
      return [{ id: 'activity-1', description: 'Novo membro', timeAgo: 'agora' }];
    },
    create: async ({ data }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['activity.create', data]);
      return { id: 'activity-2', ...data };
    },
  },
};

before(async () => {
  server = createApp(prisma).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, 'close');
});

test('GET /events requests events ordered by date ascending', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/events`);

  assert.equal(response.status, 200);
  assert.equal((await response.json())[0].title, 'Culto');
  assert.deepEqual(calls[0], ['event.findMany', { orderBy: { date: 'asc' } }]);
});

test('POST /events validates input and returns the created event', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: '  Culto especial ', date: '2026-11-01T18:00:00.000Z', location: ' Templo ' }),
  });
  const event = await response.json();

  assert.equal(response.status, 201);
  assert.equal(event.title, 'Culto especial');
  assert.equal(event.location, 'Templo');
  assert.equal(calls[0][0], 'event.create');
  assert.equal(calls[0][1].date.toISOString(), '2026-11-01T18:00:00.000Z');
});

test('POST /events rejects an invalid date', async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Culto', date: 'não é uma data', location: 'Templo' }),
  });

  assert.equal(response.status, 400);
});

test('GET /activities requests the ten most recent activities', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/activities`);

  assert.equal(response.status, 200);
  assert.equal((await response.json())[0].description, 'Novo membro');
  assert.deepEqual(calls[0], ['activity.findMany', { orderBy: { createdAt: 'desc' }, take: 10 }]);
});

test('POST /activities returns the created activity', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/activities`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description: '  Novo membro cadastrado ', timeAgo: ' agora ' }),
  });
  const activity = await response.json();

  assert.equal(response.status, 201);
  assert.equal(activity.description, 'Novo membro cadastrado');
  assert.equal(activity.timeAgo, 'agora');
  assert.deepEqual(calls[0], ['activity.create', { description: 'Novo membro cadastrado', timeAgo: 'agora' }]);
});

test('database failures return HTTP 500 without exposing internal errors', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  failDatabaseRequests = true;

  try {
    const response = await fetch(`${baseUrl}/activities`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error, 'Não foi possível buscar as atividades.');
    assert.doesNotMatch(JSON.stringify(body), /Database unavailable/);
  } finally {
    failDatabaseRequests = false;
    console.error = originalConsoleError;
  }
});

test('returns a descriptive JSON 404 for unknown routes', async () => {
  const response = await fetch(`${baseUrl}/unknown`);

  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /GET \/unknown/);
});
