const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const { createApp } = require('../src/app');

let server;
let baseUrl;
let failDatabaseRequests = false;
const calls = [];
const financialTransaction = {
  id: 1,
  tipo: 'entrada',
  descricao: 'Oferta de domingo',
  categoria: 'Contribuições',
  valor: 2450,
  data: new Date('2026-10-26T18:00:00.000Z'),
  createdAt: new Date('2026-10-26T18:00:00.000Z'),
};

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
  transacao: {
    groupBy: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['transacao.groupBy', args]);
      return [
        { tipo: 'entrada', categoria: 'Contribuições', _sum: { valor: 6570 } },
        { tipo: 'saida', categoria: 'Ação Social', _sum: { valor: 680 } },
        { tipo: 'saida', categoria: 'Manutenção', _sum: { valor: 215 } },
      ];
    },
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['transacao.findMany', args]);
      return [financialTransaction];
    },
    create: async ({ data }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['transacao.create', data]);
      return { id: 2, ...data, createdAt: new Date('2026-10-27T12:00:00.000Z') };
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

test('GET /finance/summary consolidates a requested month and returns frontend transactions', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/finance/summary?month=2026-10`);
  const summary = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    { income: summary.income, expenses: summary.expenses, balance: summary.balance, socialActions: summary.socialActions },
    { income: 6570, expenses: 895, balance: 5675, socialActions: 680 },
  );
  assert.deepEqual(summary.transactions[0], {
    id: 1,
    title: 'Oferta de domingo',
    category: 'Contribuições',
    date: '2026-10-26T18:00:00.000Z',
    amount: 2450,
    type: 'in',
  });
  assert.deepEqual(calls[0][1].where, {
    data: { gte: new Date('2026-10-01T00:00:00.000Z'), lt: new Date('2026-11-01T00:00:00.000Z') },
  });
  assert.deepEqual(calls[1][1].orderBy, { data: 'desc' });
  assert.equal(calls[1][1].take, 100);
});

test('GET /finance/summary rejects malformed month filters', async () => {
  const response = await fetch(`${baseUrl}/finance/summary?month=2026-13`);

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /YYYY-MM/);
});

test('POST /finance/transactions validates and persists a transaction', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/finance/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      tipo: ' saida ',
      descricao: '  Cestas básicas ',
      categoria: ' Ação Social ',
      valor: 680,
      data: '2026-10-24T12:00:00.000Z',
    }),
  });
  const transaction = await response.json();

  assert.equal(response.status, 201);
  assert.equal(transaction.id, 2);
  assert.equal(transaction.tipo, 'saida');
  assert.equal(transaction.descricao, 'Cestas básicas');
  assert.equal(transaction.categoria, 'Ação Social');
  assert.equal(transaction.valor, 680);
  assert.equal(calls[0][0], 'transacao.create');
  assert.equal(calls[0][1].data.toISOString(), '2026-10-24T12:00:00.000Z');
});

test('POST /finance/transactions rejects invalid fields and amounts', async () => {
  const response = await fetch(`${baseUrl}/finance/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tipo: 'transferencia', descricao: 'Teste', categoria: 'Geral', valor: -10, data: 'invalid' }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valor positivo/);
});

test('financial database errors return a generic HTTP 500 response', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  failDatabaseRequests = true;

  try {
    const response = await fetch(`${baseUrl}/finance/summary?month=2026-10`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error, 'Não foi possível buscar o resumo financeiro.');
    assert.doesNotMatch(JSON.stringify(body), /Database unavailable/);
  } finally {
    failDatabaseRequests = false;
    console.error = originalConsoleError;
  }
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
