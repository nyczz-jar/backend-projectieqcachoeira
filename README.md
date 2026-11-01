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

- `GET /events` — eventos em ordem crescente de data.
- `POST /events` — cria um evento com `title`, `date` e `location`.
- `GET /activities` — até 10 atividades, da mais recente para a mais antiga.
- `POST /activities` — cria uma atividade com `description` e `timeAgo`.

Os endpoints de criação validam os campos obrigatórios e respondem com `400` quando os dados são inválidos. Erros de banco são registrados pelo servidor e respondidos com `500`.
