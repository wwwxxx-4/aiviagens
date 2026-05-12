# Supabase Migrations

Este diretório contém migrations SQL que **não são aplicadas automaticamente**.
Aplique manualmente no painel do Supabase.

## Como aplicar uma migration

1. Abra o painel do Supabase do seu projeto.
2. Vá em **SQL Editor** > **New query**.
3. Cole o conteúdo do arquivo `.sql` (em ordem numérica).
4. Clique em **Run**.
5. Verifique que não houve erros vermelhos.

As migrations são **idempotentes** — podem ser re-executadas com segurança.

## Migrations

### `001_security_rls.sql` — Endurecimento RLS

Corrige três problemas:

1. **`search_cache` aberta a anon**
   A policy original (`USING (true)` em SELECT) permitia qualquer cliente
   com a chave `NEXT_PUBLIC_SUPABASE_ANON_KEY` (que está no bundle JS) ler
   o cache inteiro. Agora exige `authenticated`.

2. **`passenger_leads` totalmente aberta**
   A definição em `src/app/dashboard/settings/page.tsx` criava policies
   `INSERT WITH CHECK (true)` e `SELECT USING (true)`. Qualquer visitante
   poderia ler TODOS os leads (CPF, telefone, etc.). Substituídas por
   policies que filtram por `auth.uid() = user_id`.

3. **Defesa em profundidade**
   `FORCE ROW LEVEL SECURITY` em todas as tabelas + `REVOKE ALL ... FROM
   anon` para garantir que mesmo se uma policy for desabilitada por engano
   a role `anon` não consiga acessar dados.

### Como verificar que aplicou corretamente

No SQL Editor, rode:

```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Não deve haver nenhuma policy em tabelas de domínio que aplique a `{anon}`
com `qual = true`.

## Configuração do Supabase Auth

O app já usa Supabase Auth (e-mail + senha). Garanta que:

1. **Authentication > Providers > Email** está habilitado.
2. **Authentication > URL Configuration > Site URL** aponta para a URL
   de produção (Vercel) — caso contrário, o redirect pós-login quebra.
3. **Authentication > Email Templates > Confirm signup**: defina se quer
   exigir verificação por e-mail antes do primeiro login. Para o MVP da
   Mesquita Turismo (uso interno do agente), pode desabilitar.
4. **Authentication > Users**: crie o primeiro usuário operador
   manualmente (`agente@mesquitaturismo...`) se ainda não houver.
