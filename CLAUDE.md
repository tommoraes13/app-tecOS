# Instruções para o Claude neste repositório

## Como trabalhar com o dono do projeto

- Converse e escreva sempre em português do Brasil.
- **Antes de fazer qualquer coisa, pergunte se é isso mesmo.** Não comece tarefas por conta própria só porque uma função foi mencionada. Se faltar informação, pergunte.
- Explique as decisões em linguagem simples: o dono não é programador.
- Nunca altere outros projetos do Supabase além do projeto do app.

## Produto

Sistema para técnicos de informática autônomos. 1 login = 1 técnico = 1 negócio. Telas: Dashboard, Minha Agenda, Orçamentos, Serviços Prestados, Clientes, Meu Negócio, Minha Conta. A Tabela de Preços entra no menu só quando for construída.

Regras fechadas na Fase 1:
- Status da OS: Em andamento (padrão), Pendente, Aguardando Pagamento, Finalizado, Retorno. Pendente e Retorno são manuais.
- Finalizar OS: Recebido desmarcado → Aguardando Pagamento; recebido com data até hoje → Finalizado; data futura → Aguardando Pagamento e vira Finalizado sozinho na data; recebimento parcial segue a mesma regra.
- Orçamentos não têm status nesta versão. "Transformar em atendimento" cria a OS copiando os dados, uma vez por orçamento.
- Numeração de OS e de orçamento: 5 dígitos, por técnico, editável e sem repetir.
- Senhas dos equipamentos: criptografadas no servidor (AES-256) com `EQUIPMENT_SECRET_KEY`; mascaradas com botões mostrar/copiar.
- CEP preenche o endereço pelo ViaCEP. Distância é manual nesta versão.
- PDF: só OS e orçamento por enquanto.

## Design System

- Tokens em `src/app/globals.css` (`:root` e `.dark`), expostos como classes: `bg-surface`, `text-ink-muted`, `border-border-control`, `bg-brand-gradient`…
- Botão com degradê (`variant="cta"`) no máximo um por tela. Formulários concluem com `variant="dark"`.
- Seções de formulário começam fechadas e abrem com switch. Criar = modal centralizado; ver detalhes = painel lateral à direita.
- Celular: menu hambúrguer, controles com 44px de altura, modais em tela cheia, tabelas viram lista de cards.
- Textos: "você", sem emoji, sem exclamação (exceto a saudação), R$ 1.250,00, 28/10/2026, OS 00042.

## Código

- Next.js 15 App Router, TypeScript estrito, Tailwind 4, ícones `lucide-react`.
- Supabase via `@supabase/ssr`: `src/lib/supabase/{client,server,middleware}.ts`. Toda tabela tem `user_id` e RLS.
- Variáveis: ver `.env.example`. Nunca subir `.env*.local`.
