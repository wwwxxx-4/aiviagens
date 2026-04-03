# 🌍 Inteligência Viagens

Assistente de viagens com IA — voos, hotéis e atividades em tempo real.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Claude AI · SerpApi · Supabase

---

## 🚀 Setup — Fase 1 (Fundação)

### 1. Pré-requisitos

- Node.js 18+ → https://nodejs.org
- Conta Supabase → https://supabase.com (gratuita)
- Chave Anthropic → https://console.anthropic.com
- Chave SerpApi → https://serpapi.com

### 2. Instalar o projeto

```bash
# Clone ou extraia os arquivos
cd inteligenciaviagens

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env.local
```

### 3. Configurar o Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Vá em **SQL Editor** e cole todo o conteúdo de `supabase-schema.sql`
3. Execute o SQL (botão "Run")
4. Vá em **Settings > API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
5. Vá em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Preencher o .env.local

```env
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENWEATHER_API_KEY=...     # opcional por enquanto
EXCHANGE_RATE_API_KEY=...   # opcional por enquanto
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse http://localhost:3000 — a landing page deve aparecer ✅

---

## 📁 Estrutura do projeto

```
inteligenciaviagens/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── auth/               # Login, registro, callback
│   │   ├── dashboard/          # Área logada do usuário
│   │   ├── chat/               # Interface do chat
│   │   └── api/                # API Routes (backend)
│   │       ├── chat/           # Chat com streaming
│   │       ├── flights/        # Busca de voos
│   │       ├── hotels/         # Busca de hotéis
│   │       └── activities/     # Busca de atividades
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Button, Input, Card...
│   │   ├── chat/               # ChatWindow, Message, TypingIndicator...
│   │   ├── search/             # FlightCard, HotelCard, ActivityCard...
│   │   └── layout/             # Header, Sidebar, Footer
│   ├── lib/                    # Utilitários e clientes
│   │   ├── supabase/           # client.ts + server.ts
│   │   ├── claude/             # Claude API wrapper
│   │   └── serpapi/            # SerpApi service
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── styles/                 # globals.css
├── supabase-schema.sql         # Schema do banco
├── .env.example                # Template de variáveis
└── README.md
```

---

## 🗺️ Roadmap

| Fase | O que é | Status |
|------|---------|--------|
| 1 | Fundação (Next.js + estrutura + landing) | ✅ Esta fase |
| 2 | Auth + Supabase (login, registro, perfil) | 🔜 |
| 3 | AI Core + Chat (Claude + streaming) | 🔜 |
| 4 | SerpApi (voos + hotéis + atividades reais) | 🔜 |
| 5 | Pacotes + PDF + Deploy | 🔜 |

---

## 🔑 Chaves de API necessárias

| Serviço | Uso | Preço | Link |
|---------|-----|-------|------|
| Anthropic | Motor de IA (Claude) | Pago por uso | console.anthropic.com |
| SerpApi | Voos, hotéis, atividades | 100 buscas/mês grátis | serpapi.com |
| Supabase | Banco de dados + Auth | Grátis até 500MB | supabase.com |
| OpenWeather | Clima do destino | Grátis 60 req/min | openweathermap.org |
| ExchangeRate | Cotação de moedas | Grátis 1500 req/mês | exchangerate-api.com |
 
update 
