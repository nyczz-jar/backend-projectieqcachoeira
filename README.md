# IEQ Cachoeira API

API HTTP da aplicação IEQ Cachoeira, construída com Express, Prisma e PostgreSQL.

## Configuração local

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env` e informe a `DATABASE_URL` do PostgreSQL.
3. Crie as tabelas e gere o Prisma Client:

   ```powershell
npx prisma migrate deploy
npx prisma generate
   ```

4. Inicie o servidor com `npm start` (porta `10000` por padrão; use `PORT` para substituí-la).

Use `npm run dev` durante o desenvolvimento, `npm test` para executar os testes HTTP e `npm run prisma:validate` para validar o schema.

No Render, conecte o repositório `backend-projectieqcachoeira`; use `npm install && npm run build` como comando de build e `npm start` como comando de inicialização. Configure `DATABASE_URL` nas variáveis do serviço. A migração precisa ser aplicada ao banco de destino com `npx prisma migrate deploy`; ela não é executada automaticamente pelo servidor.

## Endpoints

- `GET /dashboard/summary` — retorna contagens de membros ativos, eventos do mês UTC, triagens pendentes e voluntários distintos com escala futura, mais os três próximos eventos e quatro atividades recentes.
- `GET /events` — eventos em ordem crescente de data.
- `POST /events` — cria um evento com `title`, `date` e `location`.
- `GET /activities` — até 10 atividades, da mais recente para a mais antiga.
- `POST /activities` — cria uma atividade com `description` e `timeAgo`.
- `GET /finance/summary?month=YYYY-MM` — retorna entradas, saídas, saldo, total de ações sociais e as 100 movimentações mais recentes do mês. Sem `month`, usa o mês atual em UTC.
- `POST /finance/transactions` — registra uma transação com `tipo` (`entrada` ou `saida`), `descricao`, `categoria`, `valor` positivo e `data` ISO opcional (padrão: agora).
- `GET /social-triage` — lista triagens recentes com o nome do membro relacionado; `/social-riage` permanece como alias legado.
- `POST /social-triage` — cria triagem vinculada a `memberId`/`membroId`, com `demand`/`demandas`, notas opcionais e status inicial `Pendente`.
- `PATCH /social-triage/:id` — atualiza notas e/ou o status (`Pendente`, `Em Atendimento`, `Encaminhado`, `Concluído`).
- `GET /courses` e `POST /courses` — lista e cadastra cursos locais pendentes de aprovação.
- `GET /jobs` e `POST /jobs` — lista e cadastra vagas pendentes de aprovação; título, descrição e requisitos são obrigatórios.

Os endpoints de criação validam os campos obrigatórios e respondem com `400` quando os dados são inválidos. Erros de banco são registrados pelo servidor e respondidos com `500`.

Membros novos usam status `Ativo` por padrão; `POST /members` aceita `Ativo` ou `Inativo`. O relacionamento de triagem usa o campo `Member.id` existente (UUID/String), em vez de alterar a chave de membros persistidos para `Int`. Depois de implantar uma nova migration, aplique-a ao banco de destino com `npx prisma migrate deploy` antes de iniciar a versão que usa os novos modelos.
