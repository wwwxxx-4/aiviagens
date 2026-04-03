# 🚀 Deploy — Inteligência Viagens

Guia completo para colocar o projeto em produção na Vercel.

---

## Pré-requisitos

- Conta Vercel → https://vercel.com (gratuita)
- Conta GitHub → https://github.com (para conectar o repositório)
- Projeto rodando localmente (`npm run dev` funcionando)
- Todas as chaves de API configuradas no `.env.local`

---

## Passo 1 — Subir o código no GitHub

```bash
# Na pasta do projeto
cd inteligenciaviagens

# Inicializar git (se ainda não fez)
git init
git add .
git commit -m "feat: inteligenciaviagens v1.0"

# Criar repositório no GitHub e conectar
# Acesse github.com/new, crie o repo e copie a URL
git remote add origin https://github.com/SEU_USUARIO/inteligenciaviagens.git
git branch -M main
git push -u origin main
```

---

## Passo 2 — Importar na Vercel

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `inteligenciaviagens`
4. Framework: **Next.js** (detectado automaticamente)
5. **NÃO clique em Deploy ainda** — primeiro configure as variáveis

---

## Passo 3 — Configurar variáveis de ambiente na Vercel

Na tela de importação, clique em **"Environment Variables"** e adicione:

### Obrigatórias
```
NEXT_PUBLIC_SUPABASE_URL          = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
SERPAPI_KEY                       = sua_chave_serpapi
NEXT_PUBLIC_APP_URL               = https://seudominio.vercel.app
```

### LLM Providers (pelo menos 1)
```
ANTHROPIC_API_KEY                 = sk-ant-...
OPENAI_API_KEY                    = sk-...          (opcional)
GROQ_API_KEY                      = gsk_...         (opcional)
GEMINI_API_KEY                    = AIza...         (opcional)
DEFAULT_LLM_PROVIDER              = anthropic
```

### Opcionais
```
OPENWEATHER_API_KEY               = ...
EXCHANGE_RATE_API_KEY             = ...
```

---

## Passo 4 — Deploy

Clique em **"Deploy"** e aguarde ~2 minutos.

A Vercel vai:
- Instalar dependências (`npm install`)
- Build do Next.js (`next build`)
- Publicar na CDN global

Você vai receber uma URL do tipo: `https://inteligenciaviagens-xxx.vercel.app`

---

## Passo 5 — Configurar Supabase para produção

Após o deploy, atualize o Supabase com a URL de produção:

1. Acesse o Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://seudominio.vercel.app`
3. **Redirect URLs** (adicione):
   - `https://seudominio.vercel.app/auth/callback`
   - `https://seudominio.vercel.app/**`

---

## Passo 6 — Domínio personalizado (opcional)

1. Na Vercel → seu projeto → **Settings → Domains**
2. Adicione seu domínio: `inteligenciaviagens.com.br`
3. Configure o DNS conforme instruído (geralmente um CNAME)
4. Atualize `NEXT_PUBLIC_APP_URL` e o Supabase com o novo domínio

---

## Atualizar o projeto após mudanças

```bash
# Faça as alterações locais, depois:
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
# A Vercel detecta automaticamente e faz novo deploy!
```

---

## Monitoramento

- **Vercel Analytics** → Acesse o dashboard da Vercel para ver visitas, performance e erros
- **Supabase Dashboard** → Monitore queries, uso de banco e autenticações
- **Logs em tempo real** → Vercel → seu projeto → Functions → Logs

---

## Plano de custos estimados (produção básica)

| Serviço | Plano grátis | Quando upgrade |
|---------|-------------|----------------|
| Vercel | 100GB banda/mês | Muito tráfego |
| Supabase | 500MB banco, 50k MAU | Muitos usuários |
| SerpApi | 100 buscas/mês | Uso intenso |
| Claude API | Pago por uso (~$0.003/1k tokens) | — |
| Groq | 30 req/min grátis | Alta demanda |

**Custo estimado para os primeiros 3 meses**: praticamente R$0 se usar Groq como LLM padrão e SerpApi no plano gratuito.

---

## Checklist final antes do go-live

- [ ] `npm run build` roda sem erros localmente
- [ ] Login e registro funcionam
- [ ] Chat com IA responde corretamente
- [ ] Busca de voos retorna resultados reais
- [ ] Busca de hotéis retorna resultados reais
- [ ] Exportação de pacote funciona
- [ ] Supabase com URLs de produção configuradas
- [ ] Variáveis de ambiente todas configuradas na Vercel
- [ ] Domínio personalizado apontando (se aplicável)
