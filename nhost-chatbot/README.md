# Nhost Chatbot (GraphQL-only)

Cloud-only chatbot with:
- Nhost Auth (email/password)
- Hasura GraphQL (chats/messages) with RLS
- Hasura Action `sendMessage` calling n8n webhook
- n8n calls OpenRouter and writes assistant reply via GraphQL
- React + Vite frontend on Netlify, using only GraphQL queries/mutations/subscriptions

## Environment Variables (Netlify)
- `VITE_NHOST_BACKEND_URL` (from Nhost Settings → Backend URL)

## Hasura Tables (SQL)
Create in Hasura Console → Data → SQL:

```sql
create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  title text
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
```

## Permissions (role: user)
- chats.select: `{ user_id: { _eq: X-Hasura-User-Id } }`
- chats.insert: check `{ user_id: { _eq: X-Hasura-User-Id } }`, preset `user_id` from `X-Hasura-User-Id`
- chats.update: filter `{ user_id: { _eq: X-Hasura-User-Id } }`, columns: `title`
- chats.delete: filter `{ user_id: { _eq: X-Hasura-User-Id } }`
- messages.select: `{ chat: { user_id: { _eq: X-Hasura-User-Id } } }`
- messages.insert: check `{ chat: { user_id: { _eq: X-Hasura-User-Id } } }`
- messages.delete: `{ chat: { user_id: { _eq: X-Hasura-User-Id } } }`

## Action (SDL)
Hasura Console → Actions → Create:

```graphql
type Mutation {
  sendMessage(chat_id: uuid!, content: String!): SendMessageOutput!
}

type SendMessageOutput {
  message_id: uuid!
  reply: String!
}
```

- Handler: your n8n webhook URL (Production)
- Forward client headers: ON
- Permissions: allow role `user`

## n8n Workflow
Import `n8n-workflow.json` and set:
- OpenAI node credentials: API Key = OpenRouter key, Base URL = `https://openrouter.ai/api`
- Optional headers on OpenAI node: `HTTP-Referer` = your Netlify URL, `X-Title` = `Nhost Chatbot`

## Frontend
- Deploy to Netlify (Build: `npm run build`, Publish: `dist`)
- Ensure your Netlify URL is in Nhost Allowed Origins

```bash
npm ci
npm run dev
```

The app uses only GraphQL queries/mutations/subscriptions and the `sendMessage` Hasura Action.
