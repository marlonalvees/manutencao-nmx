# Manutenção Preventiva

Agenda de limpeza e manutenção dos equipamentos da Novamix (PCs, teclados,
notebooks, impressoras…). Cada equipamento tem uma frequência (mensal,
trimestral…) e a data da próxima manutenção. Quando alguém faz, confirma no
sistema com a data, o que foi feito e até 5 fotos, e a próxima data é
recalculada sozinha.

## Estrutura

```
manutencao-nmx/
├── web/   → Frontend (React + Vite + TypeScript + Tailwind + React Router)
└── api/   → Backend  (Node.js + Fastify + TypeScript + pg + Supabase/Postgres)
```

## Telas

- **Agenda**: equipamentos ativos, do mais atrasado para o mais tranquilo, com
  resumo de atrasadas, próximos 7 dias e em dia. O botão **Confirmar** registra
  a manutenção (data, observação e fotos).
- **Equipamentos**: cadastro (nome, tipo, filial, local, frequência e próxima
  data). Só o admin do módulo cadastra, edita e exclui. Equipamento que saiu de
  uso pode ser desmarcado como "Ativo" e some da agenda sem perder o histórico.
- **Histórico**: as últimas manutenções feitas, com quem fez, se foi no prazo e
  as fotos. O admin pode **desfazer** uma confirmação feita por engano: se era
  a mais recente, a próxima data volta para a que estava prevista.

A próxima data conta a partir do **dia em que a manutenção foi feita**, não do
dia que estava previsto (se atrasou 10 dias, o próximo ciclo também anda 10 dias).

## Como rodar

### Backend

```bash
cd api
cp .env.example .env   # preencha as variáveis (veja abaixo)
npm install
npm run migrate        # cria/atualiza as tabelas (schema "manutencao")
npm run dev            # http://localhost:3008
```

- `DATABASE_URL`/`DIRECT_URL`: o mesmo Supabase do hub (pode copiar do
  uso-consumo). A aplicação usa a `DATABASE_URL`; as migrations, a `DIRECT_URL`.
- `JWT_SECRET`: **o mesmo do hub**. É com ele que a API confere o token do login.
- `CORS_ORIGINS`: endereços do site liberados, separados por vírgula.

### Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev            # http://localhost:5178
```

- `VITE_API_URL`: endereço da API terminando em `/api` (ex.: `http://localhost:3008/api`).
- `VITE_HUB_URL`: endereço do hub, para onde vai quem não está logado.
- `VITE_DEV_TOKEN` (só em desenvolvimento): no localhost não existe o cookie do
  hub. Gere um token com `npm run dev:token -- --admin --user=<seu id no hub>`
  na pasta `api` e cole aqui.

## Banco de dados

As tabelas ficam no schema **`manutencao`**, separado do `public` do hub:

| Tabela | O que guarda |
|---|---|
| `equipment` | cada equipamento, a frequência e a próxima data |
| `maintenance` | cada manutenção confirmada (data prevista, data feita, quem fez) |
| `maintenance_photo` | o nome do arquivo de cada foto |
| `schema_migrations` | quais migrations já rodaram |

`public.users` e `public.branchs` são do hub: aqui só **lemos**, nunca alteramos.

### Migrations

Os arquivos de `api/src/database/migrations` rodam em ordem, **uma vez cada**:
o `npm run migrate` anota o nome do arquivo em `manutencao.schema_migrations` e
pula os que já rodaram. Para mudar o banco, **crie um arquivo novo** (ex.:
`002_adiciona_patrimonio.sql`) — nunca edite um que já rodou. No Docker, o
migrate roda sozinho toda vez que o servidor sobe.

### Fotos

O navegador reduz cada foto para no máximo 1600px em JPEG antes de enviar
(uma foto de celular de 5 MB vira uns 300 KB). O arquivo fica em `api/uploads`
— no Docker, no volume `manutencao_uploads`, para não sumir a cada deploy. O
banco guarda só o nome do arquivo.

## Login

O sistema não tem login próprio: quem faz o login é o hub, que grava no
navegador um cookie `token` (JWT) válido para todo o `*.lojanovamix.com.br`.

- O usuário precisa ter a permissão do módulo **`manutencao`** no hub.
- Com `access: "admin"` ele cadastra/edita/exclui equipamentos e desfaz
  confirmações. Com qualquer outro valor (ex.: `read`), vê tudo e confirma
  manutenções.

### Liberar no hub

1. Administração → **Módulos** → novo módulo: nome `Manutenção Preventiva`,
   slug `manutencao`, link público e privado `https://manutencao.lojanovamix.com.br`.
2. Administração → **Usuários** → permissões: dar o módulo para quem vai usar
   (`admin` para quem cadastra os equipamentos).
3. A pessoa precisa **sair e entrar de novo** no hub para o token novo trazer a permissão.

## Deploy

```bash
VITE_API_URL=https://<endereço da api>/api VITE_HUB_URL=https://hub.lojanovamix.com.br docker compose up -d --build
```

Portas: API em `3008`, site em `8088`. Se alguma já estiver ocupada no servidor, troque no
`.env` da raiz com `API_PORT=` e `WEB_PORT=` (as portas de dentro do container não mudam).
