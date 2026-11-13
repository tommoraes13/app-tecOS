# Instruções para o Claude neste repositório

## Como trabalhar com o dono do projeto

- Converse e escreva sempre em português do Brasil.
- **Antes de fazer qualquer coisa, pergunte se é isso mesmo.** Não comece tarefas por conta própria só porque uma função foi mencionada. Se faltar informação, pergunte.
- Explique as decisões em linguagem simples: o dono não é programador.
- Nunca altere outros projetos do Supabase além do projeto do app.

## Produto

Sistema para técnicos de informática autônomos. 1 login = 1 técnico = 1 negócio. Menu, nesta ordem: Dashboard, Atendimentos (rota /servicos), Minha Agenda, Clientes, Orçamentos, Meu Catálogo (Tabela de Preços, Produtos, Modelos; rotas /cadastros/*), Meu Negócio (Dados do Negócio, Configurar Precificação em /meu-negocio/precificacao). Fora do menu: Minha Conta com abas Minha conta, Aparência, Meu Plano e Alterar dados (?aba=). Celular: menu fixo no rodapé (Início, Agenda, +, Atendimentos, Conta).

Referência completa do app: `docs/REFERENCIA-APP.md`. Toda alteração publicada ganha uma entrada no topo de `docs/CHANGELOG.md` (e a referência é atualizada quando a regra mudar).

Regras fechadas na Fase 1:
- Status da OS: Em andamento (padrão), Pendente, Aguardando Pagamento, Finalizado, Retorno. Pendente e Retorno são manuais.
- Recebimento decidido pelo status (desde 12/11/2026): Finalizado = recebido o total, data de hoje; outro status = a receber. Sem parcial, sem data futura, sem campos de recebimento e de data de entrega na tela (gatilho `finalizado_marca_recebido`). Finalizar OS pergunta se já recebeu: sim → Finalizado; não → Aguardando Pagamento.
- Precificação (Meu Negócio › Configurar Precificação): Valor do Serviço, Serviço + Visita Técnica, Hora Técnica + Visita Técnica (horas = tempo médio × valor da hora, ajustável) e Livre (total digitado). Cada OS/orçamento guarda o seu método.
- Criar conta em /criar-conta (nome, negócio, telefone, e-mail, senha). Opção "sair depois de 24 h" em Minha Conta.
- Orçamentos não têm status nesta versão. "Transformar em atendimento" cria a OS copiando os dados, uma vez por orçamento.
- Numeração de OS e de orçamento: 5 dígitos, por técnico, editável e sem repetir.
- Senhas dos equipamentos: criptografadas no servidor (AES-256) com `EQUIPMENT_SECRET_KEY`; mascaradas com botões mostrar/copiar.
- CEP preenche o endereço pelo ViaCEP. Distância é manual nesta versão.
- PDF: só OS e orçamento, com o logotipo do negócio no topo, em A4 ou modelo para celular (?formato=celular).
- OS/orçamento: rascunho no aparelho até o 1º Salvar; depois salva sozinho ~4 s após cada mudança.
- Categorias de serviço: Manutenção, Diagnóstico/Revisão, Montagem, Configuração, Backup e Recuperação, Consultoria, Outros.
- Idiomas: pt-BR (padrão), en, es. O texto em português é a chave de t(); traduções em src/i18n/messages.

## Design System

- Tokens em `src/app/globals.css` (`:root` e `.dark`), expostos como classes: `bg-surface`, `text-ink-muted`, `border-border-control`, `bg-brand-gradient`…
- Botão com degradê (`variant="cta"`) no máximo um por tela. Formulários concluem com `variant="dark"`.
- Seções de formulário começam fechadas e abrem com switch. Criar = modal centralizado; ver detalhes = janela central só de leitura (useViewer) com botão Editar.
- Telas sem subtítulo e quase sem dicas embaixo dos campos (só cálculos úteis). Dashboard abre em 30 dias.
- Degradê da marca (botão cta, card de destaque, ícone): verde (`--brand-900` → `--brand-600`). O azul foi testado e descartado pelo dono.
- Cores de apoio além do verde: status da OS e categorias de serviço têm cor própria; valores recebidos em verde, a receber em amarelo, desconto em vermelho.
- Valores (constantes) usados no servidor não podem vir de arquivos "use client".
- Celular: menu hambúrguer + menu fixo no rodapé, controles com 44px de altura, modais em tela cheia, tabelas viram lista de cards.
- Textos: "você", sem emoji, sem exclamação (exceto a saudação), R$ 1.250,00, 28/10/2026, OS 00042.

## Ambientes

- App em produção: https://app-tec-os.vercel.app (Vercel, publica a cada envio para `main`).
- Supabase: projeto **TecOS-v1** (`ytpvbfgzuwvmktqcoucq`, região São Paulo). O outro projeto da organização não pertence ao app: não mexer.
- Scripts do banco em `supabase/migrations/`, na ordem em que foram aplicados. Mudança no banco: mostrar o SQL ao dono e aplicar só com aprovação; depois regerar `src/lib/database.types.ts`.
- `EQUIPMENT_SECRET_KEY` fica só na Vercel. Nunca trocar a chave: as senhas salvas deixariam de abrir.

## Fluxo de trabalho

1. Trabalhar na branch `dev` e enviar para o GitHub.
2. A verificação automática (`.github/workflows/verificar.yml`) roda tipos, build e um PDF de exemplo, inclusive dentro do servidor do Next. Acompanhar com `scripts/ci-status.sh dev`, que mostra os erros quando falha.
3. Verde: mesclar em `main` (fast-forward). A Vercel publica sozinha.
4. Os PDFs de exemplo da última verificação ficam na branch `ci-artefatos` (`teste-os.pdf`, `teste-os-en.pdf`, `teste-os-celular.pdf`).
5. Registrar a mudança em `docs/CHANGELOG.md`.

## Código

- Next.js 15 App Router, TypeScript estrito, Tailwind 4, ícones `lucide-react`.
- Supabase via `@supabase/ssr`: `src/lib/supabase/{client,server,middleware}.ts`. Toda tabela tem `user_id` e RLS.
- Variáveis: ver `.env.example`. Nunca subir `.env*.local`.
