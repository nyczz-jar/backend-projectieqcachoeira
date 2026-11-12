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
const memberRecord = { id: 'member-uuid-1', name: 'Ana Oliveira', email: 'ana@example.com', role: 'Voluntário' };
const socialCaseRecord = {
  id: 1,
  membroId: memberRecord.id,
  membro: { name: memberRecord.name },
  dataTriagem: new Date('2026-11-12T10:00:00.000Z'),
  demandas: 'Apoio alimentar',
  notas: null,
  statusEncaminhamento: 'Pendente',
  createdAt: new Date('2026-11-12T10:00:00.000Z'),
  updatedAt: new Date('2026-11-12T10:00:00.000Z'),
};
const courseRecord = {
  id: 1,
  nome: 'Informática básica',
  categoria: 'Tecnologia',
  descricao: 'Curso para iniciantes',
  dataInicio: new Date('2026-12-01T00:00:00.000Z'),
  dataTermino: new Date('2026-12-15T00:00:00.000Z'),
  statusAprovacao: 'Pendente',
  createdAt: new Date('2026-11-12T10:00:00.000Z'),
  updatedAt: new Date('2026-11-12T10:00:00.000Z'),
};
const jobRecord = {
  id: 1,
  titulo: 'Auxiliar administrativo',
  empresa: 'Empresa local',
  descricao: 'Atuação presencial.',
  requisitos: 'Ensino médio completo.',
  dataPublicacao: new Date('2026-11-12T10:00:00.000Z'),
  statusAprovacao: 'Pendente',
  createdAt: new Date('2026-11-12T10:00:00.000Z'),
  updatedAt: new Date('2026-11-12T10:00:00.000Z'),
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
  member: {
    findUnique: async ({ where }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['member.findUnique', where]);
      return where.id === memberRecord.id ? memberRecord : null;
    },
  },
  triagemSocial: {
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['triagemSocial.findMany', args]);
      return [socialCaseRecord];
    },
    create: async ({ data, include }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['triagemSocial.create', data, include]);
      return { ...socialCaseRecord, ...data, membro: { name: memberRecord.name } };
    },
    update: async ({ where, data, include }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['triagemSocial.update', where, data, include]);
      if (where.id !== socialCaseRecord.id) {
        const error = new Error('Record not found');
        error.code = 'P2025';
        throw error;
      }
      return { ...socialCaseRecord, ...data, membro: { name: memberRecord.name } };
    },
  },
  cursoLocal: {
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['cursoLocal.findMany', args]);
      return [courseRecord];
    },
    create: async ({ data }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['cursoLocal.create', data]);
      return { ...courseRecord, ...data, statusAprovacao: 'Pendente' };
    },
  },
  vagaEmprego: {
    findMany: async (args) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['vagaEmprego.findMany', args]);
      return [jobRecord];
    },
    create: async ({ data }) => {
      if (failDatabaseRequests) throw new Error('Database unavailable');
      calls.push(['vagaEmprego.create', data]);
      return { ...jobRecord, ...data };
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

test('GET /social-triage includes the member display name without exposing unrelated member data', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/social-triage`);
  const cases = await response.json();

  assert.equal(response.status, 200);
  assert.equal(cases[0].name, memberRecord.name);
  assert.equal(cases[0].demand, socialCaseRecord.demandas);
  assert.equal(cases[0].status, 'Pendente');
  assert.equal(cases[0].email, undefined);
  assert.deepEqual(calls[0], ['triagemSocial.findMany', {
    include: { membro: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  }]);
});

test('POST /social-triage validates a member and creates a confidential case linked to it', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/social-triage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: memberRecord.id, demand: '  Apoio alimentar ', status: 'Pendente', confidential: true }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.memberId, memberRecord.id);
  assert.equal(result.name, memberRecord.name);
  assert.equal(result.demand, 'Apoio alimentar');
  assert.equal(result.status, 'Pendente');
  assert.deepEqual(calls[0], ['member.findUnique', { id: memberRecord.id }]);
  assert.equal(calls[1][0], 'triagemSocial.create');
  assert.deepEqual(calls[1][1], {
    membroId: memberRecord.id,
    demandas: 'Apoio alimentar',
    statusEncaminhamento: 'Pendente',
  });
});

test('POST /social-triage rejects invalid members, demands, and statuses', async () => {
  const response = await fetch(`${baseUrl}/social-triage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: memberRecord.id, demand: ' ', status: 'Unknown' }),
  });

  assert.equal(response.status, 400);
});

test('PATCH /social-triage/:id updates status and private notes', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/social-triage/1`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ statusEncaminhamento: 'Em Atendimento', notas: 'Retornar na próxima semana.' }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.status, 'Em Atendimento');
  assert.equal(result.notes, 'Retornar na próxima semana.');
  assert.deepEqual(calls[0][2], {
    statusEncaminhamento: 'Em Atendimento',
    notas: 'Retornar na próxima semana.',
  });
});

test('PATCH /social-triage/:id validates status and reports missing records', async () => {
  const invalidResponse = await fetch(`${baseUrl}/social-triage/1`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'Status inválido' }),
  });
  assert.equal(invalidResponse.status, 400);

  const missingResponse = await fetch(`${baseUrl}/social-triage/999`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'Concluído' }),
  });
  assert.equal(missingResponse.status, 404);
});

test('GET /courses returns API fields in the frontend format', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/courses`);
  const courses = await response.json();

  assert.equal(response.status, 200);
  assert.equal(courses[0].title, courseRecord.nome);
  assert.equal(courses[0].category, courseRecord.categoria);
  assert.equal(courses[0].status, 'Pendente');
  assert.match(courses[0].dates, /01\/12\/2026/);
  assert.deepEqual(calls[0], ['cursoLocal.findMany', { orderBy: { createdAt: 'desc' } }]);
});

test('POST /courses creates a pending course with optional dates', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: '  Curso de informática ',
      category: ' Tecnologia ',
      description: '  Noções básicas. ',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-15T00:00:00.000Z',
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.title, 'Curso de informática');
  assert.equal(result.status, 'Pendente');
  assert.deepEqual(calls[0], ['cursoLocal.create', {
    nome: 'Curso de informática',
    descricao: 'Noções básicas.',
    categoria: 'Tecnologia',
    dataInicio: new Date('2026-12-01T00:00:00.000Z'),
    dataTermino: new Date('2026-12-15T00:00:00.000Z'),
  }]);
});

test('POST /courses rejects invalid date ranges', async () => {
  const response = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Curso', description: 'Descrição', startDate: '2026-12-20', endDate: '2026-12-01' }),
  });
  assert.equal(response.status, 400);
});

test('GET /jobs returns frontend fields and pending moderation state', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/jobs`);
  const jobs = await response.json();

  assert.equal(response.status, 200);
  assert.equal(jobs[0].title, jobRecord.titulo);
  assert.equal(jobs[0].company, jobRecord.empresa);
  assert.equal(jobs[0].requirements, jobRecord.requisitos);
  assert.equal(jobs[0].status, 'Pendente');
  assert.deepEqual(calls[0], ['vagaEmprego.findMany', { orderBy: { dataPublicacao: 'desc' } }]);
});

test('POST /jobs persists required details and defaults moderation to pending', async () => {
  calls.length = 0;
  const response = await fetch(`${baseUrl}/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: '  Auxiliar de estoque ',
      company: ' Mercado local ',
      description: '  Organizar produtos. ',
      requirements: '  Ensino médio. ',
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.status, 'Pendente');
  assert.deepEqual(calls[0], ['vagaEmprego.create', {
    titulo: 'Auxiliar de estoque',
    descricao: 'Organizar produtos.',
    requisitos: 'Ensino médio.',
    empresa: 'Mercado local',
  }]);
});

test('POST /jobs rejects missing requirements', async () => {
  const response = await fetch(`${baseUrl}/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Auxiliar', description: 'Descrição' }),
  });
  assert.equal(response.status, 400);
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
