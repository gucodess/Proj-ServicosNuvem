# Proj-ServicosNuvem: dolar-app

Projeto do 2º bimestre de Serviços em Nuvem (Mackenzie). Painel de câmbio em Next.js
com back-end Express, banco RDS PostgreSQL, upload S3 por URL pré-assinada e duas Lambdas.

| Pasta | O que é | Requisito |
|---|---|---|
| `dolar-app-backend/` | API Express (porta 25000) em Docker na `ec2-backend` | Parte 1, RF-01, RF-02 |
| `dolar-app-backend/routes/crud.js` | CRUD `moeda` e `cotacao` (1:N) no RDS | RF-01 |
| `dolar-app-backend/routes/upload.js` | URL pré-assinada de upload no S3 | RF-02 |
| `lambda-rf03/` | Lambda que lê CSV do S3 e grava cotações | RF-03 |
| `Lambda-rf04/` | Lambda do relatório (JOIN + GROUP BY) via API Gateway | RF-04 |
| `dolar-app/` | Front-end Next.js (porta 8080) em Docker na `ec2-frontend` | RF-05 |
| `moeda.sql`, `cotacao.sql` | DDL das tabelas | RF-01 |
| `docs/infra-console.md` | Passo a passo de criação pelo console, sem IaC | RNF-05 |
| `docs/adr/ADR-001-crud-em-container.md` | Decisão: CRUD em container, não Lambda | RNF-04 |

## Segredos (RNF-02)

Nenhuma senha, chave ou endpoint vai para o Git. Cada serviço lê a configuração de um
`.env` local (ignorado pelo `.gitignore` e pelo `.dockerignore`), criado a partir do
`.env.example` versionado. Nas Lambdas, os valores ficam em *Configuration >
Environment variables*. As credenciais AWS vêm das roles do Lab (`LabInstanceProfile`
na EC2, `LabRole` nas Lambdas), nunca de `AWS_ACCESS_KEY_ID` no código.

## Primeira instalação

Siga [docs/infra-console.md](docs/infra-console.md) do Passo 1 ao 8.

## Retomar em nova sessão do Learner Lab (RNF-03)

Ao iniciar uma sessão, EC2 e RDS voltam sozinhos (ou clique em *Start*). Os IPs
**públicos** das EC2 mudam a cada sessão; o **privado** do back-end e o Elastic IP não
mudam. Nenhum IP está fixo no código: o único endereço que o sistema usa fica no
`.env` do front-end.

1. **Start Lab** e espere o indicador ficar verde. Abra o console.
2. RDS > `cambio-pg`: espere **Available** (se estiver *Stopped*: Actions > Start).
3. EC2 > Instances: se `ec2-backend` e `ec2-frontend` estiverem *Stopped*, selecione e
   *Instance state > Start*.
4. Anote:
   - **Private IPv4** da `ec2-backend` (normalmente o mesmo da sessão anterior);
   - **Public IPv4** da `ec2-frontend` (muda toda sessão).
5. Back-end (SSH no Elastic IP da `ec2-backend`):
   ```bash
   cd ~/Proj-ServicosNuvem && git pull
   cd dolar-app-backend && docker compose up -d --build
   curl -s localhost:25000/health          # esperado: {"status":"ok","db":"ok"}
   ```
   Se `db` vier com erro: confira `DB_HOST` no `.env` e se o RDS está *Available*.
6. Front-end (SSH no IP público da `ec2-frontend`):
   ```bash
   cd ~/Proj-ServicosNuvem && git pull
   cd dolar-app
   grep BACKEND_URL .env                   # deve ser http://<IP_PRIVADO_BACKEND>:25000
   # se o IP privado do back-end mudou: nano .env  (não precisa rebuild, só restart)
   docker compose up -d --build
   curl -s localhost:8080/api/health       # esperado: {"status":"ok","db":"ok"}
   ```
7. Navegador: `http://<IP_PUBLICO_FRONTEND>:8080`.
8. Lambdas e API Gateway não precisam de nada: a URL da API (`.../prod/...`) não muda.

### Diagnóstico rápido

| Sintoma | Causa provável | Correção |
|---|---|---|
| Página presa em "A buscar dados..." ou "Erro 502" | `BACKEND_URL` errada ou back-end parado | Passo 6: conferir `.env`; Passo 5: `docker ps` no back-end |
| "Erro 404" | Back-end antigo sem a rota pedida | `git pull` + `docker compose up -d --build` no back-end |
| `/health` com erro de banco | RDS parado ou `.env` do back-end errado | Esperar *Available*; conferir `DB_HOST`/`DB_PASS` |
| SSH timeout | Seu IP mudou e o SG só libera *My IP* | Editar regra 22 do SG para o IP atual |
| Build do front trava a EC2 (SSH sem resposta) | t3.micro sem swap | Stop/Start da instância e criar swap (docs/infra-console.md, Passo 6) |

## Endpoints do back-end

Todas as rotas existem na raiz e sob `/api` (o front usa `/api/...`).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/cotacoes`, `/api/historico`, `/api/converter` | Parte 1 (Yahoo Finance) |
| GET | `/health` | Processo e RDS de pé |
| GET/POST | `/moedas` | Lista / cria moeda |
| GET/PUT/DELETE | `/moedas/:id` | Lê / altera / apaga moeda (cascade nas cotações) |
| GET/POST | `/moedas/:id/cotacoes` | Lista / cria cotação da moeda |
| GET/PUT/DELETE | `/cotacao/:id` | Lê / altera / apaga cotação |
| POST | `/moedas/:id/upload-url` | RF-02: devolve `uploadUrl` (PUT, 5 min) e `key` |
| PUT | `/moedas/:id/arquivo` | RF-02: grava a `key` em `moeda.arquivo_key` |
| GET | `/moedas/:id/arquivo-url` | RF-02: URL pré-assinada de download |
