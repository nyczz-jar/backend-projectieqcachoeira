const cors = require('cors');
const express = require('express');
const prisma = require('./lib/prisma');

const TRIAGE_STATUSES = ['Pendente', 'Em Atendimento', 'Encaminhado', 'Concluído'];

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { error: true };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? { error: true } : { value: date };
}

function toSocialCase(record) {
  return {
    id: record.id,
    memberId: record.membroId,
    name: record.membro?.name || 'Membro',
    demand: record.demandas,
    notes: record.notas,
    status: record.statusEncaminhamento,
    date: record.dataTriagem,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toCourse(record) {
  const dates = [record.dataInicio, record.dataTermino]
    .filter(Boolean)
    .map((date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }));
  return {
    id: record.id,
    title: record.nome,
    category: record.categoria || 'CURSO LOCAL',
    description: record.descricao,
    dates: dates.length ? dates.join(' — ') : 'Inscrições abertas',
    startDate: record.dataInicio,
    endDate: record.dataTermino,
    status: record.statusAprovacao,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toJob(record) {
  return {
    id: record.id,
    title: record.titulo,
    company: record.empresa || '',
    description: record.descricao,
    requirements: record.requisitos,
    posted: new Date(record.dataPublicacao).toLocaleDateString('pt-BR'),
    status: record.statusAprovacao,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

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
  app.get(['/social-triage', '/social-riage'], async (_req, res) => {
    try {
      const cases = await prismaClient.triagemSocial.findMany({
        include: { membro: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(cases.map(toSocialCase));
    } catch (error) {
      console.error('[GET /social-triage] Failed to fetch social cases:', error);
      return res.status(500).json({ error: 'Não foi possível buscar os casos de triagem.' });
    }
  });

  app.post('/social-triage', async (req, res) => {
    const body = req.body || {};
    const membroId = body.membroId ?? body.memberId;
    const demandas = typeof body.demandas === 'string' ? body.demandas.trim()
      : typeof body.demand === 'string' ? body.demand.trim() : '';
    const notas = typeof body.notas === 'string' ? body.notas.trim()
      : typeof body.notes === 'string' ? body.notes.trim() : undefined;
    const statusEncaminhamento = body.statusEncaminhamento || body.status || 'Pendente';
    const dataTriagem = parseOptionalDate(body.dataTriagem);

    if (
      typeof membroId !== 'string'
      || !membroId.trim()
      || !demandas
      || !TRIAGE_STATUSES.includes(statusEncaminhamento)
      || dataTriagem.error
    ) {
      return res.status(400).json({
        error: 'Informe um membro válido, demandas, notas válidas e um status de triagem permitido.',
      });
    }

    try {
      const member = await prismaClient.member.findUnique({ where: { id: membroId.trim() } });
      if (!member) return res.status(404).json({ error: 'O membro informado não foi encontrado.' });

      const socialCase = await prismaClient.triagemSocial.create({
        data: {
          membroId: membroId.trim(),
          demandas,
          ...(notas !== undefined ? { notas } : {}),
          statusEncaminhamento,
          ...(dataTriagem.value ? { dataTriagem: dataTriagem.value } : {}),
        },
        include: { membro: { select: { name: true } } },
      });

      return res.status(201).json(toSocialCase(socialCase));
    } catch (error) {
      console.error('[POST /social-triage] Failed to create social case:', error);
      return res.status(500).json({ error: 'Não foi possível criar o caso de triagem.' });
    }
  });

  app.patch('/social-triage/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Informe um identificador de triagem válido.' });
    }

    const body = req.body || {};
    const hasStatus = body.status !== undefined || body.statusEncaminhamento !== undefined;
    const hasNotes = body.notes !== undefined || body.notas !== undefined;
    const statusEncaminhamento = body.statusEncaminhamento ?? body.status;
    const notasValue = body.notas ?? body.notes;
    if (!hasStatus && !hasNotes) {
      return res.status(400).json({ error: 'Informe o status e/ou as notas que deseja atualizar.' });
    }
    if (hasStatus && !TRIAGE_STATUSES.includes(statusEncaminhamento)) {
      return res.status(400).json({ error: 'Informe um status de triagem permitido.' });
    }
    if (hasNotes && typeof notasValue !== 'string' && notasValue !== null) {
      return res.status(400).json({ error: 'As notas devem ser texto ou null.' });
    }

    try {
      const socialCase = await prismaClient.triagemSocial.update({
        where: { id },
        data: {
          ...(hasStatus ? { statusEncaminhamento } : {}),
          ...(hasNotes ? { notas: notasValue === null ? null : notasValue.trim() } : {}),
        },
        include: { membro: { select: { name: true } } },
      });
      return res.json(toSocialCase(socialCase));
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'O caso de triagem não foi encontrado.' });
      console.error('[PATCH /social-triage/:id] Failed to update social case:', error);
      return res.status(500).json({ error: 'Não foi possível atualizar o caso de triagem.' });
    }
  });

  // --- EMPREGABILIDADE --- //
  app.get('/courses', async (_req, res) => {
    try {
      const courses = await prismaClient.cursoLocal.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(courses.map(toCourse));
    } catch (error) {
      console.error('[GET /courses] Failed to fetch courses:', error);
      return res.status(500).json({ error: 'Não foi possível buscar os cursos.' });
    }
  });

  app.post('/courses', async (req, res) => {
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim()
      : typeof body.title === 'string' ? body.title.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim()
      : typeof body.description === 'string' ? body.description.trim() : '';
    const categoria = typeof body.categoria === 'string' ? body.categoria.trim()
      : typeof body.category === 'string' ? body.category.trim() : '';
    const dataInicio = parseOptionalDate(body.dataInicio ?? body.startDate);
    const dataTermino = parseOptionalDate(body.dataTermino ?? body.endDate);
    if (!nome || !descricao || dataInicio.error || dataTermino.error
      || (dataInicio.value && dataTermino.value && dataTermino.value < dataInicio.value)) {
      return res.status(400).json({ error: 'Informe nome e descrição do curso e datas válidas, com término posterior ao início.' });
    }

    try {
      const course = await prismaClient.cursoLocal.create({
        data: {
          nome,
          descricao,
          ...(categoria ? { categoria } : {}),
          ...(dataInicio.value ? { dataInicio: dataInicio.value } : {}),
          ...(dataTermino.value ? { dataTermino: dataTermino.value } : {}),
        },
      });
      return res.status(201).json(toCourse(course));
    } catch (error) {
      console.error('[POST /courses] Failed to create course:', error);
      return res.status(500).json({ error: 'Não foi possível cadastrar o curso.' });
    }
  });

  app.get('/jobs', async (_req, res) => {
    try {
      const jobs = await prismaClient.vagaEmprego.findMany({ orderBy: { dataPublicacao: 'desc' } });
      return res.json(jobs.map(toJob));
    } catch (error) {
      console.error('[GET /jobs] Failed to fetch jobs:', error);
      return res.status(500).json({ error: 'Não foi possível buscar as vagas.' });
    }
  });

  app.post('/jobs', async (req, res) => {
    const body = req.body || {};
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim()
      : typeof body.title === 'string' ? body.title.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim()
      : typeof body.description === 'string' ? body.description.trim() : '';
    const requisitos = typeof body.requisitos === 'string' ? body.requisitos.trim()
      : typeof body.requirements === 'string' ? body.requirements.trim() : '';
    const empresa = typeof body.empresa === 'string' ? body.empresa.trim()
      : typeof body.company === 'string' ? body.company.trim() : '';
    if (!titulo || !descricao || !requisitos) {
      return res.status(400).json({ error: 'Informe título, descrição e requisitos para cadastrar a vaga.' });
    }

    try {
      const job = await prismaClient.vagaEmprego.create({
        data: { titulo, descricao, requisitos, ...(empresa ? { empresa } : {}) },
      });
      return res.status(201).json(toJob(job));
    } catch (error) {
      console.error('[POST /jobs] Failed to create job:', error);
      return res.status(500).json({ error: 'Não foi possível cadastrar a vaga.' });
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
