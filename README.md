# TecDesk (app-tecOS)

Sistema web de gestão para técnicos de informática autônomos: clientes, equipamentos, orçamentos e ordens de serviço. Funciona no computador e no celular pelo mesmo link, e pode ser instalado na tela inicial do celular. "TecDesk" é um nome provisório.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 4 com os tokens do Design System em `src/app/globals.css`
- Componentes no padrão shadcn/ui (`components.json`) e ícones Lucide
- Supabase (banco Postgres e login)
- Hospedagem na Vercel

## Rodar no computador

1. Instale o Node.js 20 ou mais novo.
2. Copie `.env.example` para `.env.local` e preencha com os dados do Supabase (Project Settings > API).
3. Rode:

```bash
npm install
npm run dev
```

4. Abra http://localhost:3000.

## Publicar na Vercel

1. Na Vercel, **Add New > Project** e importe este repositório.
2. Em **Environment Variables**, cadastre as variáveis do `.env.example`.
3. Clique em **Deploy**. A cada envio para a branch `main`, a Vercel publica sozinha.

Sem as variáveis do Supabase o app abre e mostra as telas, mas o login fica desativado.

## Estrutura

```
src/
  app/
    (app)/            telas logadas (menu lateral / hambúrguer)
      dashboard/
      agenda/
      orcamentos/
      servicos/
      clientes/
      meu-negocio/
      minha-conta/
    login/            entrar e criar conta
    auth/             retorno do e-mail de confirmação e sair
    globals.css       tokens do Design System (claro e escuro)
  components/
    layout/           menu, cabeçalho de tela, estado vazio, tema
    ui/               botões, campos, cards, abas, badges de status
  lib/
    supabase/         clientes do Supabase (navegador, servidor, middleware)
    utils.ts          formatação (R$, número de OS, saudação)
  middleware.ts       protege as telas e renova a sessão
```

## Documentação do projeto

- **Fase 1 — Arquitetura e definições:** regras de negócio, modelo de dados, telas.
- **Design System TecDesk:** cores, tipografia, componentes e regras de uso.

Os dois estão publicados como páginas privadas no Claude, na conta do dono do projeto.
