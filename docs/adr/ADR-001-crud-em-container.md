# ADR-001: CRUD em container (Express na EC2) em vez de AWS Lambda

- **Status:** Aceita
- **Data:** 2026-11-11
- **Requisitos relacionados:** RF-01 (CRUD de duas entidades no RDS), RF-02 (upload S3), RNF-04

## Contexto

O RF-01 pede um CRUD das entidades `moeda` e `cotacao` (relação 1:N, FK com
`ON DELETE CASCADE`) gravado no RDS PostgreSQL `cambio-pg`. O enunciado permite
implementar o CRUD **em Lambda ou em container**. Já existiam no projeto:

- um back-end Express (Parte 1) rodando em Docker na EC2 `ec2-backend`, porta 25000;
- um front-end Next.js na EC2 `ec2-frontend` que consome esse back-end pela VPC;
- duas Lambdas para os RF-03 (ingestão de CSV) e RF-04 (relatório via API Gateway).

Restrições do ambiente: AWS Academy Learner Lab (sessões de ~4 h, recursos param
ao fim da sessão, apenas a role `LabRole`/`LabInstanceProfile`, sem criar IAM).

## Opções consideradas

| Critério | A) Container na EC2 (Express) | B) Lambda + API Gateway |
|---|---|---|
| Conexão com o RDS | Pool `pg` persistente (10 conexões reaproveitadas) | Conexão nova a cada cold start; sem RDS Proxy no Lab |
| Latência | Sem cold start | Cold start + abertura de conexão SSL a cada execução fria |
| Reaproveitamento | Usa o mesmo `server.js`, Dockerfile e rede da Parte 1 | Exige nova função, nova rota no API Gateway, novo deploy |
| Integração com o front | Mesmo host que já atende `/api/cotacoes`; o proxy do Next só repassa | Front teria de chamar 2 origens (EC2 e API Gateway) |
| RF-02 (presigned URL) | SDK usa a role da EC2 (`LabInstanceProfile`) | SDK usaria a `LabRole` da Lambda (equivalente) |
| Custo / disponibilidade | EC2 ligada o tempo todo enquanto a sessão está ativa | Paga por requisição; escala sozinha |
| Escala | Manual (1 instância) | Automática |
| Operação | Precisa SSH, `docker compose`, atualizar a instância | Sem servidor para manter |

## Decisão

Implementar o CRUD (RF-01) e o upload pré-assinado (RF-02) **no container Express
da EC2 `ec2-backend`**, em `dolar-app-backend/routes/crud.js` e
`dolar-app-backend/routes/upload.js`, usando o pool de `dolar-app-backend/db.js`.

As Lambdas ficam reservadas para cargas **orientadas a evento ou esporádicas**, onde
o modelo serverless faz sentido: RF-03 (gatilho de upload no S3) e RF-04 (relatório
sob demanda pelo API Gateway).

## Consequências

**Positivas**
- Um único back-end atende Parte 1 (Yahoo Finance), CRUD e upload; o front fala com
  uma origem só, via proxy `/api`.
- Pool de conexões persistente evita abrir uma conexão SSL com o RDS por requisição.
- Nada de novo para provisionar: mesma EC2, mesmo Security Group, mesmo Dockerfile.

**Negativas / riscos aceitos**
- A EC2 precisa estar ligada para o CRUD funcionar (no Lab ela para ao fim da sessão;
  ver "Retomar em nova sessão" no README).
- Sem escala automática nem alta disponibilidade (uma instância, uma AZ). Aceitável
  para um projeto acadêmico com tráfego baixo.
- Atualizar o código exige SSH + `git pull` + `docker compose up -d --build`.

## Quando revisitar
- Se o tráfego crescer ou for exigida alta disponibilidade: mover o container para
  ECS/Fargate atrás de um ALB, ou migrar o CRUD para Lambda com RDS Proxy.
