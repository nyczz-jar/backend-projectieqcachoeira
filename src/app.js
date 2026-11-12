const cors = require('cors');
const express = require('express');
const prisma = require('./lib/prisma');

function createApp(prismaClient = prisma) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({ status: 'Backend a funcionar perfeitamente!' });
  });

  app.get('/events', async (_req, res) => {
    try {
      const events = await prismaClient.event.findMany({
        orderBy: { date: 'asc' },
      });

      res.json(events);
    } catch (error) {
      console.error('[GET /events] Failed to fetch events:', error);
      res.status(500).json({ error: 'Não foi possível buscar os eventos.' });
    }
  });

  app.post('/events', async (req, res) => {
    const { title, date, location } = req.body || {};
    const eventDate = typeof date === 'string' ? new Date(date) : null;

    if (
      typeof title !== 'string'
      || !title.trim()
      || !eventDate
      || Number.isNaN(eventDate.getTime())
      || typeof location !== 'string'
      || !location.trim()
    ) {
      return res.status(400).json({
        error: 'Informe título, data válida e local para o evento.',
      });
    }

    try {
      const event = await prismaClient.event.create({
        data: {
          title: title.trim(),
          date: eventDate,
          location: location.trim(),
        },
      });

      return res.status(201).json(event);
    } catch (error) {
      console.error('[POST /events] Failed to create event:', error);
      return res.status(500).json({ error: 'Não foi possível criar o evento.' });
    }
  });

  app.get('/activities', async (_req, res) => {
    try {
      const activities = await prismaClient.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json(activities);
    } catch (error) {
      console.error('[GET /activities] Failed to fetch activities:', error);
      res.status(500).json({ error: 'Não foi possível buscar as atividades.' });
    }
  });

  app.post('/activities', async (req, res) => {
    const { description, timeAgo } = req.body || {};

    if (
      typeof description !== 'string'
      || !description.trim()
      || typeof timeAgo !== 'string'
      || !timeAgo.trim()
    ) {
      return res.status(400).json({
        error: 'Informe uma descrição e o tempo da atividade.',
      });
    }

    try {
      const activity = await prismaClient.activity.create({
        data: {
          description: description.trim(),
          timeAgo: timeAgo.trim(),
        },
      });

      return res.status(201).json(activity);
    } catch (error) {
      console.error('[POST /activities] Failed to create activity:', error);
      return res.status(500).json({ error: 'Não foi possível criar a atividade.' });
    }
  });

  // --- ROTAS DE MEMBROS --- //
  app.get('/members', async (_req, res) => {
    try {
      const members = await prismaClient.member.findMany({ orderBy: { name: 'asc' } });
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível buscar os membros.' });
    } 
  });

  app.post('/members', async (req, res) => {
    try {
      const { name, email, role } = req.body;
      const member = await prismaClient.member.create({ data: { name, email, role } });
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível criar o membro.' });
    }
  });

  // --- ROTAS DE ESCALAS --- //
  app.get('/scales', async (_req, res) => {
    try {
      const scales = await prismaClient.scale.findMany({ orderBy: { date: 'asc' } });
      res.json(scales);
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível buscar as escalas.' });
    }
  });

  app.post('/scales', async (req, res) => {
    try {
      const { ministry, date, volunteer } = req.body;
      const scale = await prismaClient.scale.create({ data: { ministry, date: new Date(date), volunteer } });
      res.status(201).json(scale);
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível criar a escala.' });
    }
  });

  // --- ROTAS FINANCEIRAS --- //
  app.get('/finance/summary', async (req, res) => {
    const month = req.query.month;
    let startDate;
    if (month === undefined) {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    } else {
      const match = typeof month === 'string' && month.match(/^(\d{4})-(\d{2})$/);
      if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
        return res.status(400).json({ error: 'Informe o mês no formato YYYY-MM.' });
      }
      startDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    }

    const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1));
    const where = { data: { gte: startDate, lt: endDate } };

    try {
      const [totalsByCategory, transactions] = await Promise.all([
        prismaClient.transacao.groupBy({
          by: ['tipo', 'categoria'],
          where,
          _sum: { valor: true },
        }),
        prismaClient.transacao.findMany({
          where,
          orderBy: { data: 'desc' },
          take: 100,
        }),
      ]);

      const summary = totalsByCategory.reduce((result, item) => {
        const total = item._sum.valor || 0;
        if (item.tipo === 'entrada') result.income += total;
        if (item.tipo === 'saida') {
          result.expenses += total;
          if (/ação social/i.test(item.categoria)) result.socialActions += total;
        }
        return result;
      }, { income: 0, expenses: 0, socialActions: 0 });

      return res.json({
        ...summary,
        balance: summary.income - summary.expenses,
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          title: transaction.descricao,
          category: transaction.categoria,
          date: transaction.data,
          amount: transaction.valor,
          type: transaction.tipo === 'saida' ? 'out' : 'in',
        })),
      });
    } catch (error) {
      console.error('[GET /finance/summary] Failed to fetch financial summary:', error);
      return res.status(500).json({ error: 'Não foi possível buscar o resumo financeiro.' });
    }
  });

  app.post('/finance/transactions', async (req, res) => {
    const body = req.body || {};
    const tipo = typeof body.tipo === 'string' ? body.tipo.trim().toLowerCase() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
    const valor = typeof body.valor === 'number'
      ? body.valor
      : typeof body.valor === 'string' && body.valor.trim()
        ? Number(body.valor)
        : Number.NaN;
    const data = body.data === undefined
      ? new Date()
      : typeof body.data === 'string'
        ? new Date(body.data)
        : new Date(Number.NaN);

    if (
      !['entrada', 'saida'].includes(tipo)
      || !descricao
      || !categoria
      || !Number.isFinite(valor)
      || valor <= 0
      || Number.isNaN(data.getTime())
    ) {
      return res.status(400).json({
        error: 'Informe tipo (entrada ou saida), descrição, categoria, valor positivo e data válida.',
      });
    }

    try {
      const transaction = await prismaClient.transacao.create({
        data: { tipo, descricao, categoria, valor, data },
      });

      return res.status(201).json({
        id: transaction.id,
        tipo: transaction.tipo,
        descricao: transaction.descricao,
        categoria: transaction.categoria,
        valor: transaction.valor,
        data: transaction.data,
        createdAt: transaction.createdAt,
      });
    } catch (error) {
      console.error('[POST /finance/transactions] Failed to create transaction:', error);
      return res.status(500).json({ error: 'Não foi possível registrar a movimentação financeira.' });
    }
  });
  
  // --- TRIAGEM SOCIAL --- //
  app.get('/social-riage', async (_req, res) => {
  try {
    const cases = await prismaClient.socialCase.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar os casos de triagem.' });
  }
  });

  app.use((req, res) => {
    res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
  });

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'O corpo da requisição não contém JSON válido.' });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'O corpo da requisição excede o limite permitido.' });
    }

    console.error('[HTTP] Unhandled request error:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  });

  return app;
}





module.exports = { createApp };
