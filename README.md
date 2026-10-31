# IEQ Cachoeira

Painel web de gestão e cuidado da comunidade, desenvolvido com React e Create React App.

## Executar localmente

```powershell
npm install
Copy-Item .env.example .env
npm start
```

O arquivo `.env.example` define `VITE_API_URL`. O script de desenvolvimento/build adapta essa variável ao formato `REACT_APP_API_URL` exigido pelo Create React App. Também é possível definir `REACT_APP_API_URL` diretamente.

## API

A URL padrão é `https://backend-projectieqcachoeira.onrender.com`. O serviço em `src/services/api.js` centraliza as chamadas para membros, eventos, atividades, escalas, triagem social, cursos, vagas e resumo financeiro. As rotas REST esperadas estão definidas nesse arquivo; ajuste-as ali caso o backend use caminhos diferentes.

Quando a API estiver indisponível, o painel informa o erro e mantém dados demonstrativos para permitir a navegação. Listas vazias retornadas pela API são apresentadas como estados vazios.

## Verificação

```powershell
npm test -- --watchAll=false
npm run build
```
