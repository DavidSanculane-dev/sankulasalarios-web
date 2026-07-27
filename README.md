# sankulaSalarios

Sistema de gestão de assiduidade que integra terminais biométricos ZKTeco/BioTek,
Hikvision e Suprema num único painel, normalizando os eventos de todas as marcas
para um esquema comum.

## Stack

- **Next.js 15 + TypeScript** — frontend e API routes (webhooks)
- **Supabase (Postgres)** — base de dados, hospedado gerido
- **Drizzle ORM** — acesso à base de dados, com migrations
- **Zod** — validação e tipagem dos eventos normalizados
- **Vercel** — hosting + Cron Jobs (para o sync da Suprema)

## 1. Configurar o Supabase

1. Cria um projeto em https://supabase.com
2. Vai a **Project Settings → Database → Connection string**
3. Copia a connection string em modo **"Transaction pooler"** (porta 6543) para `DATABASE_URL`
4. Copia a connection string **direta** (porta 5432) para `DIRECT_URL` (só usada pelas migrations)
5. Copia o `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em **Project Settings → API**

## 2. Instalar dependências e configurar ambiente

```bash
npm install
cp .env.example .env.local
# edita o .env.local com os valores reais do Supabase
```

## 3. Criar as tabelas na base de dados

```bash
npm run db:generate   # gera os ficheiros de migration a partir do schema.ts
npm run db:push       # aplica as migrations no Supabase
```

Podes inspecionar visualmente a base de dados com:

```bash
npm run db:studio
```

## 4. Correr localmente

```bash
npm run dev
```

Abre http://localhost:3000

## 5. Registar um dispositivo (passo manual por agora)

Antes de qualquer terminal conseguir enviar eventos, tens de o registar na
tabela `devices` (via `db:studio` ou uma query direta), com o `serialNumber`
exatamente igual ao número de série configurado no dispositivo físico. Sem
isto, o endpoint rejeita os eventos recebidos (ver `ingestEvent` em
`src/lib/ingest-event.ts`).

## 6. Configurar cada tipo de terminal

### ZKTeco / BioTek (ADMS)

No menu do dispositivo: **Comm → Cloud Server / ADMS**
- Server Address: o teu domínio (ex: `sankula-salarios.vercel.app`)
- Server Port: `443` (https)
- Habilitar "Domain Name Mode" se usares HTTPS

O dispositivo passa a enviar automaticamente para `/api/webhooks/zkteco`.

### Hikvision (ISAPI)

Configura o push de eventos via ISAPI:

```
PUT /ISAPI/Event/notification/httpHosts
{
  "HttpHostNotification": {
    "id": "1",
    "url": "/api/webhooks/hikvision",
    "protocolType": "HTTPS",
    "parameterFormatType": "JSON",
    "addressingFormatType": "hostname",
    "hostName": "sankula-salarios.vercel.app",
    "portNo": 443
  }
}
```

Se o terminal estiver numa rede sem acesso direto à internet (comum em
sites de mina/obra), precisas do **gateway local** (ver secção 8) a fazer
de intermediário.

### Suprema (BioStar 2)

Ao contrário dos outros, a Suprema não envia dados diretamente para a tua
cloud — falas com o **servidor BioStar 2** que fica no site do cliente.
Configura `BIOSTAR_BASE_URL`, `BIOSTAR_USERNAME` e `BIOSTAR_PASSWORD` no
`.env.local`, regista o dispositivo com o `externalRef` = device_id do
BioStar, e o cron job (`vercel.json`) trata da sincronização periódica.

**Atenção**: se o servidor BioStar não estiver acessível publicamente
(o mais comum), este cron da Vercel não vai conseguir alcançá-lo — nesse
caso o polling tem de correr a partir do gateway local, não da Vercel.

## 7. Deploy na Vercel

```bash
npx vercel
```

Configura as variáveis de ambiente no dashboard da Vercel (as mesmas do
`.env.local`) e ativa o Cron Job em **Settings → Cron Jobs** (já vem
definido em `vercel.json`).

## 8. Gateway local (para sites sem acesso direto à internet)

Este repositório cobre a parte cloud. Para sites de mina/gás com terminais
Hikvision/Suprema atrás de firewall sem IP público, precisas de um pequeno
serviço a correr no local (NUC, mini-PC) que:

1. Fala com os dispositivos na rede local (ISAPI local / BioStar local)
2. Reencaminha os eventos para os mesmos endpoints deste projeto
   (`/api/webhooks/hikvision`, cron equivalente para Suprema)
3. Guarda um buffer local (SQLite) quando a internet cai, e reenvia depois

Este agente ainda não está incluído aqui — é o próximo passo lógico depois
de validares os três adaptadores com dispositivos reais ou simulados.

## Estrutura do projeto

```
src/
  db/
    schema.ts          → tabelas Drizzle (companies, employees, devices, eventos...)
    client.ts          → ligação à base de dados via pooler
  lib/
    normalized-event.ts → contrato de dados (Zod) partilhado por todos os adaptadores
    ingest-event.ts      → função única que grava qualquer evento normalizado
  app/
    api/webhooks/zkteco/route.ts     → adaptador ADMS (push automático)
    api/webhooks/hikvision/route.ts  → adaptador ISAPI (push configurável, multipart)
    api/cron/suprema-sync/route.ts   → adaptador BioStar 2 (polling agendado)
    dashboard/page.tsx  → listagem simples dos últimos eventos
```

## Próximos passos sugeridos

1. Validar o endpoint ZKTeco com um dispositivo real ou um simulador ADMS
2. Construir o ecrã de mapeamento funcionário ↔ dispositivo (hoje só é possível via db:studio)
3. Adicionar autenticação (Supabase Auth) e Row Level Security por `company_id`
4. Motor de regras de turnos/horas extra sobre a tabela `attendance_events`
5. Exportação de relatórios (PDF/Excel) para a folha de pagamento
