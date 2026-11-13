# TecDesk: referência completa do app

Documento de referência para pessoas e outras IAs. Descreve o produto, as regras, as telas, o banco, o código e o fluxo de trabalho. Estado em 13/11/2026. As mudanças ficam registradas em `docs/CHANGELOG.md`.

---

## 1. Visão geral

- **O que é:** sistema web (PWA, funciona no celular e no computador) para **técnicos de informática autônomos** organizarem atendimentos (ordens de serviço), clientes, equipamentos, orçamentos, agenda, preços e recebimentos.
- **Modelo:** 1 login = 1 técnico = 1 negócio. Não há equipe nem multiusuário.
- **Nome do produto:** TecDesk. O repositório e o projeto chamam-se `app-tecOS` / `TecOS-v1`.
- **Idiomas:** português do Brasil (padrão), inglês e espanhol. Moeda (BRL, USD, EUR) e fuso horário são configuráveis por conta.
- **Público do texto:** o dono do projeto não é programador. Explicações para ele são em português simples.
- **Fase:** testes. Tudo está liberado sem cobrança. A assinatura (gateway, preço, dias de teste) ainda não foi definida.

## 2. Ambientes e infraestrutura

| Item | Valor |
|---|---|
| Produção | https://app-tec-os.vercel.app (Vercel, região `gru1` São Paulo) |
| Repositório | GitHub `tommoraes13/app-tecOS` |
| Banco/Autenticação/Arquivos | Supabase, projeto **TecOS-v1** (`ytpvbfgzuwvmktqcoucq`, São Paulo) |
| Outro projeto Supabase da organização | **não pertence ao app, nunca mexer** |
| Node | 22.x |

**Variáveis** (ver `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `EQUIPMENT_SECRET_KEY`: chave AES-256 de 32 bytes em base64. Fica **só na Vercel**. **Nunca trocar**, porque as senhas salvas deixariam de abrir.

Arquivos `.env*.local` nunca vão para o git.

**Fluxo de trabalho**
1. Trabalhar na branch `dev` e enviar para o GitHub.
2. A verificação automática (`.github/workflows/verificar.yml`) confere tipos, traduções e build. Também gera PDFs de exemplo e testa o PDF gerado dentro do servidor do Next. Acompanhar com `scripts/ci-status.sh dev`.
3. Com a verificação verde, mesclar em `main` (fast-forward). A Vercel publica sozinha.
4. Os PDFs de exemplo ficam na branch `ci-artefatos`: `teste-os.pdf`, `teste-os-en.pdf` e `teste-os-celular.pdf`.

**Mudanças no banco:** mostrar o SQL ao dono, aplicar só com aprovação, salvar em `supabase/migrations/` (na ordem aplicada) e regerar `src/lib/database.types.ts`.

## 3. Pilha técnica

- **Framework e linguagem:** Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript estrito.
- **Estilo:** Tailwind CSS 4, com os tokens do Design System em `src/app/globals.css` (`:root` e `.dark`). Tema claro e escuro via `next-themes`.
- **Ícones:** `lucide-react`.
- **Supabase:**
  - Acesso pelo `@supabase/ssr` (`src/lib/supabase/{client,server,middleware}.ts`).
  - O login é conferido localmente com `getClaims()`.
  - Toda tabela tem `user_id` e RLS (cada técnico só vê os próprios dados).
- **PDF:** `@react-pdf/renderer`, gerado no servidor em `/api/pdf/[tipo]/[id]`. As fontes padrão do pdfkit entram no pacote via `outputFileTracingIncludes`.
- **Endereços:** CEP pelo ViaCEP. Sugestões de endereço enquanto digita pelo Photon/OpenStreetMap (`photon.komoot.io`).
- **Segurança:**
  - Cabeçalhos em `next.config.ts`: CSP (self, Supabase, viacep, photon), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP.
  - Senhas de equipamentos criptografadas no servidor (`src/lib/crypto.ts`).
- **Traduções:**
  - O texto em português é a chave de `t()`; o sufixo `@@contexto` diferencia chaves ambíguas.
  - Os dicionários ficam em `src/i18n/messages/{en,es}.ts`.
  - `useI18n()` no cliente, `getI18n()` e `pageTitle()` no servidor.
  - O objeto `fmt` formata dinheiro, data, hora, números e dias relativos.
  - `scripts/verificar-traducoes.ts` falha a verificação se faltar tradução.

## 4. Navegação

**Menu lateral (computador) e menu hambúrguer (celular), nesta ordem:**
1. Dashboard (`/dashboard`)
2. Atendimentos (`/servicos`)
3. Minha Agenda (`/agenda`)
4. Clientes (`/clientes`)
5. Orçamentos (`/orcamentos`)
6. Meu Catálogo, com Tabela de Preços (`/cadastros/servicos`), Produtos (`/cadastros/produtos`) e Modelos (`/cadastros/templates`)
7. *(separador)* Meu Negócio, com Dados do Negócio (`/meu-negocio`) e Configurar Precificação (`/meu-negocio/precificacao`)

**Menu fixo no rodapé (só celular), da esquerda para a direita:**
- Início (`/dashboard`)
- Agenda (`/agenda`)
- **+** Novo atendimento (`/servicos/novo`)
- Lupa / Atendimentos (`/servicos`)
- Conta (`/minha-conta`)

Esse menu não aparece nas telas de OS e orçamento, que têm barra própria com Voltar, Total e Salvar.

**Barra superior:** busca geral (clientes, OS, orçamentos, serviços, produtos e telas), ajuda, sino de lembretes e menu da conta (Minha Conta, Meu Plano, tema, Sair).

**Fora do menu:** Minha Conta (`/minha-conta`), com abas Minha conta, Aparência, Meu Plano e Alterar dados (`?aba=conta|aparencia|plano|dados`).

**Endereços antigos que redirecionam:**
- `/precificacao` vai para `/meu-negocio/precificacao`.
- `/meu-plano` vai para `/minha-conta?aba=plano`.

**Telas públicas:** `/login`, `/criar-conta` e `/auth/*` (callback do e-mail, sair, saída por 24 h).

## 5. Telas e regras de negócio

### 5.1 Entrar e criar conta
- **Login:** e-mail e senha, com "Esqueci minha senha" (o link do e-mail leva a Minha Conta › Alterar dados) e um link para Criar conta.
- **Criar conta** (`/criar-conta`):
  - Campos: Seu nome, Nome do negócio, Telefone (WhatsApp), E-mail, Senha e Repita a senha.
  - Os dados vão nos metadados do cadastro. O gatilho `handle_new_user` cria Meu Negócio (nome fantasia, telefone, e-mail), Perfil (nome de exibição) e Numeração.
  - Se o Supabase exigir confirmação de e-mail, aparece "Confirme seu e-mail".
- **Sair depois de 24 horas** (opção em Minha Conta, desligada por padrão):
  - O layout compara a hora do login (claim `amr` do token) com agora. Passadas 24 h, chama `/auth/expirou`, que encerra a sessão e leva a `/login?expirou=1`.
  - Com a tela aberta, um temporizador faz o mesmo.

### 5.2 Dashboard
- **Período:** Essa semana, 7, 15, **30 (padrão)** ou 90 dias.
- **Cards:** Serviços realizados, Valor recebido (card de destaque com degradê), Valores a receber e Atendimentos em aberto, cada um comparado com o período anterior.
- **Gráfico de ganhos:** valor recebido por dia, ou por semana em períodos longos.
- **Listas:** últimos atendimentos e melhores clientes.
- **De onde vêm os números:** a função `dashboard_resumo`.

### 5.3 Atendimentos (OS)
- **Lista:**
  - 10 por página, com abas por status e contagem.
  - Filtros: busca, data de/até e categoria do serviço.
  - Carrossel "Mais recentes" e seleção para excluir.
  - Clicar abre a janela de visualização.
- **Status:**
  - **Em andamento** (padrão), **Pendente** (manual), **Aguardando Pagamento**, **Finalizado** e **Retorno** (manual).
  - Cada status tem cor própria (`src/lib/status.ts`).
- **Recebimento decidido pelo status** (desde 12/11/2026):
  - Finalizado conta como recebido o valor total, na data de hoje.
  - Qualquer outro status conta como a receber.
  - Não há recebimento parcial nem data de recebimento futura. O gatilho `finalizado_marca_recebido` aplica a regra no banco.
- **Finalizar OS:** pergunta "O pagamento já foi recebido?". Sim muda para Finalizado; "Ainda não" muda para Aguardando Pagamento. A data de entrega é preenchida sozinha e serve de início da garantia.
- **Formulário de OS e orçamento** (`src/components/documento/documento-form.tsx`). Campos:
  - número (5 dígitos, editável, sem repetir por técnico);
  - cliente (busca enquanto digita ou cadastro na hora);
  - data de início e relato do cliente;
  - visitas técnicas (data, hora, duração; duração sugerida = visita padrão + tempo dos serviços);
  - distância em km (manual);
  - equipamentos do cliente;
  - **Serviços** e **Produtos** (do catálogo ou avulsos, com quantidade, valor e equipamento vinculado);
  - **Despesas**: frete cobrado do cliente; deslocamento, alimentação, insumos e outros só como controle interno;
  - **Desconto** em R$ ou %;
  - garantia (meses) e observações (saem no PDF).
- **Resumo lateral:**
  - escolha do método de precificação **daquele documento**;
  - serviços, produtos, frete, visita técnica, subtotal, desconto e total;
  - opção de total manual.
- **Total** = serviços + produtos + visita + frete − desconto. Com total manual (ou método Livre), o PDF mostra só o total; os itens saem sem valores.
- **Salvamento:**
  - Documento novo: rascunho guardado no aparelho (`localStorage`) até o primeiro Salvar, com a opção de recuperar ou descartar.
  - Depois do primeiro Salvar, o app grava sozinho cerca de 4 s após cada mudança.
  - Aviso ao sair com mudanças não salvas.
- **Ações:** status em pílulas, PDF (A4 ou celular: ver, baixar, enviar), mensagem para WhatsApp, Finalizar OS e Salvar.
- **Campos removidos da tela** (12/11/2026): Data da entrega e a seção Recebimento.

### 5.4 Orçamentos
- Mesmo formulário da OS, sem status nem recebimento.
- Abas Aguardando aceite, Aprovados e Todos.
- **Transformar em atendimento:** cria a OS copiando os dados (inclusive o método de precificação). Só pode ser feito uma vez por orçamento.

### 5.5 Precificação (Meu Negócio › Configurar Precificação)
**Métodos** (`meu_negocio.tipo_precificacao`; cada OS e orçamento guarda o seu em `precificacao`):

| Valor | Nome | Como calcula |
|---|---|---|
| `servico` | Valor do Serviço | Preço de cada serviço da Tabela de Preços. Sem visita. |
| `servico_visita` | Valor do Serviço + Visita Técnica | Preço dos serviços + valor da visita (padrão). |
| `hora_visita` | Hora Técnica + Visita Técnica | Cada serviço vira **horas = tempo médio** (arredondado a 15 min; sem tempo = 1 h) × **valor da hora**, mais a visita. As horas podem ser ajustadas em cada atendimento (passos de 0,5 h). No PDF, as colunas viram "Horas" e "Valor/hora". |
| `livre` | Livre | O total é digitado em cada atendimento. Os itens não têm valor. |

**Outros campos:**
- valor da hora técnica (só no método por hora);
- valor da visita técnica (só nos métodos com visita);
- duração padrão da visita;
- valor adicional por km (guardado para uso futuro).

Trocar o método dentro de um documento converte os serviços do catálogo entre preço e horas.

### 5.6 Minha Agenda
Calendário mensal com as visitas técnicas das OS e a lista de visitas do dia escolhido.

### 5.7 Clientes
- **Lista:**
  - Faixa de resumo: nº de clientes, valor médio dos serviços, clientes em garantia, taxa de orçamentos aceitos.
  - Filtros por canal (Internet, Indicação, Tráfego pago, Redes sociais, Outro) e situação.
- **Cliente:** nome, telefone, e-mail, canal, endereço (CEP pelo ViaCEP + sugestões do OpenStreetMap) e observações.
- **Equipamentos do cliente:**
  - Tipos: Computador (desktop), Notebook/laptop, Roteador/A.P./rede e Impressora.
  - Os campos de cada tipo ficam em `src/lib/equipamentos.ts`, divididos nas seções recolhidas Acesso, Hardware, Sistema e Outros.
  - Seção **Estado geral** (liga/desliga) com Sintomas, Defeitos e Solução.
  - Senhas criptografadas (AES-256), mostradas mascaradas, com botões mostrar e copiar.
- **Janela de visualização:** dados, equipamentos, atendimentos e orçamentos do cliente, com botão Editar.

### 5.8 Meu Catálogo
- **Tabela de Preços** (`/cadastros/servicos`):
  - Cards: **Ticket médio** (média dos valores dos serviços cadastrados), **Tempo médio** (média dos tempos médios) e **Serviços cadastrados**.
  - Tabela com abas por categoria. Cada serviço tem nome, código, categoria, valor e tempo médio.
  - Categorias: Manutenção, Diagnóstico/Revisão, Montagem, Configuração, Backup e Recuperação, Consultoria e Outros.
- **Produtos:** nome, código, custo, preço de venda e margem.
- **Modelos:** reservado para checklists e sequências (ainda vazio).

### 5.9 Meu Negócio › Dados do Negócio
- **Logotipo:** enviar uma imagem (reduzida para PNG de até 512 px) ou **Gerar aleatoriamente** entre 20 modelos simples com as iniciais. Sai no topo dos PDFs.
- **Dados:** nome fantasia, razão social, CPF/CNPJ, região de atendimento (km), garantia padrão, e-mail, telefone e endereço.

### 5.10 Minha Conta (abas)
- **Minha conta:** foto (reduzida a 256×256), nome de exibição, idioma, moeda e fuso horário; opção **Sair sozinho 24 horas depois de entrar**.
- **Aparência:** tema Claro, Escuro ou Igual ao aparelho.
- **Meu Plano:** plano Gratuito (fase de testes); upgrade e cancelamento "em breve".
- **Alterar dados:** só a troca de senha.

### 5.11 PDF
- Só OS e orçamento.
- **Conteúdo:**
  - logotipo e dados do negócio, número e datas;
  - cliente, equipamentos, relato e visitas;
  - serviços e produtos, totais, garantia (com datas quando há entrega) e observações;
  - assinaturas (na OS).
- **Formatos:**
  - **A4** (`/api/pdf/os/<id>`);
  - **Celular** (`?formato=celular`): página estreita e alta (360×760 pt), uma coluna, itens empilhados.
- A escolha fica lembrada no aparelho. `?baixar=1` força o download.

### 5.12 Outras funções
- **Busca geral:** função `buscar_tudo` no banco, sem acento.
- **Sino:** visitas nos próximos 2 dias e OS aguardando pagamento (função `notificacoes`).
- **WhatsApp:** monta uma mensagem com o resumo da OS ou do orçamento.
- **Puxar para atualizar:** só com o app instalado na tela inicial.

## 6. Design System

- **Tokens:** em `globals.css`, expostos como classes (`bg-surface`, `text-ink-muted`, `border-border-control`, `bg-brand-gradient`, `text-brand-ink` e outras).
- **Identidade:** verde. O **degradê verde** (`--brand-900` → `--brand-600`) aparece só no botão de destaque (`variant="cta"`, no máximo um por tela), no card de destaque e no ícone. Um degradê azul foi testado e descartado.
- **Cores de apoio:**
  - Status da OS e categorias de serviço têm cor própria.
  - Valores recebidos em verde, a receber em amarelo e desconto em vermelho.
- **Botões:** formulários concluem com `variant="dark"`. Outras variantes: outline, ghost, danger, dangerSolid, success, successSoft.
- **Padrões de interface:**
  - Seções de formulário começam fechadas e abrem com switch (`CollapsibleSection`).
  - Criar abre um modal centralizado.
  - Ver detalhes abre uma janela central só de leitura (`useViewer().abrir({tipo,id})`) com botão Editar.
  - Títulos de tela **sem subtítulo**; **quase nenhuma dica embaixo dos campos** (ficam só cálculos úteis, como "Equivale a R$ …" e margem).
- **Celular:**
  - menu hambúrguer + menu fixo no rodapé;
  - controles com 44 px de altura;
  - modais em tela cheia;
  - tabelas viram lista de cards;
  - campos com 16 px de fonte (o iPhone não dá zoom).
- **Textos:** tratamento "você", sem emoji, sem exclamação (exceto a saudação). Formatos: R$ 1.250,00, 28/10/2026, OS 00042.

## 7. Banco de dados (Supabase / Postgres)

**Tabelas** (todas com `user_id` e RLS de dono):

| Tabela | Conteúdo |
|---|---|
| `meu_negocio` | 1 por técnico. Dados da empresa, `logo_url`, `tipo_precificacao` (servico, servico_visita, hora_visita, livre), `valor_hora`, `valor_visita`, `duracao_visita_min`, `cobrar_visita`, `valor_km`, `garantia_meses_padrao`. |
| `perfil` | `nome_exibicao`, `foto_path`, `idioma`, `moeda`, `fuso`, `sair_apos_24h`. |
| `numeracao` | `proxima_os` e `proximo_orcamento` (1 a 99999). |
| `base_clientes` | Clientes. Canal é enum `cliente_canal`. |
| `base_equipamentos` | Equipamentos. `tipo` (enum), `especificacoes` (jsonb), `senhas` (jsonb só com valores criptografados), `estado_geral` e `estado_detalhe` (legado). |
| `cadastro_servicos` | Serviços. `categoria` (enum `servico_categoria`), `valor`, `tempo_medio_min`, `ativo`. |
| `cadastro_produtos` | Produtos. `valor_custo`, `valor_venda`, `ativo`. |
| `base_orcamentos` + `orc_servicos` + `orc_produtos` | Orçamentos e seus itens. |
| `base_atendimentos` + `os_servicos` + `os_produtos` + `os_visitas` + `os_equipamentos` | OS e seus itens. Cabeçalho: `status` (enum `os_status`), `precificacao`, `cobrar_visita`, `valor_visita`, despesas, desconto, garantia, `valor_total`, `valor_total_manual`, `data_entrega`, `recebido`, `data_recebimento`, `valor_recebido`, `finalizado_em`. |

**Views:** `os_lista` (lista de OS com cliente, serviços e texto de busca) e `clientes_resumo`. Ambas `security_invoker`.

**Funções** (rodam com as permissões de quem chama; o anônimo não executa):
- `os_contagens`, `dashboard_resumo`, `melhores_clientes`, `clientes_resumo_geral`;
- `buscar_tudo`, `buscar_clientes`, `notificacoes`, `sem_acento`;
- `transformar_orcamento_em_os`;
- `finalizar_os` (legado; o app agora define o status direto).

**Gatilhos:**
- `handle_new_user`: cria negócio, perfil e numeração, lendo nome, negócio e telefone do cadastro.
- `definir_numero_os` / `definir_numero_orcamento`.
- `set_updated_at`.
- `finalizado_marca_recebido`: status Finalizado marca recebido o total com a data de hoje; outro status desmarca.

**Storage:** bucket público `avatars` (limite de 512 KB; jpeg, png e webp). Cada técnico só grava na pasta `<user_id>/`, onde ficam a foto (`foto-*.jpg|webp`) e o logotipo (`logo-*.png`).

**Migrações** (`supabase/migrations/`, em ordem):
1. `20261028000001_schema_inicial.sql`
2. `20261028000002_ajustes_seguranca_indices.sql`
3. `20261029000001_ajustes_desconto_garantia_perfil.sql`
4. `20261029000002_resumos_busca_notificacoes.sql`
5. `20261030000001_categorias_servico_avatar.sql`
6. `20261112000001_precificacao_recebimento_conta.sql`

## 8. Estrutura do código

```
src/app/
  (app)/                 telas logadas (layout com menu, barra, rodapé, sair 24 h)
    dashboard/ servicos/ agenda/ clientes/ orcamentos/
    cadastros/{servicos,produtos,templates}/
    meu-negocio/ (+ precificacao/)  minha-conta/  meu-plano/ (redireciona)  precificacao/ (redireciona)
  login/ criar-conta/ auth/{callback,signout,expirou}/  api/pdf/[tipo]/[id]/
src/components/
  layout/   menu lateral, hambúrguer, menu do rodapé, barra superior, busca, sino, cabeçalho de tela
  documento/ formulário de OS/orçamento, itens, PDF, WhatsApp, aviso de saída
  detalhes/ janelas de visualização (cliente, OS, orçamento, equipamento)
  clientes/ modal de cliente e de equipamento, campo de senha
  ui/       botões, campos, modais, abas, cards
src/lib/
  documento.ts  formulário, totais, métodos de precificação (sem "use client")
  documento-server.ts  carregar/montar OS e orçamento
  equipamentos.ts  campos por tipo   status.ts  labels.ts  dashboard.ts
  pdf/  dados e layout do PDF   supabase/  clientes do Supabase   crypto.ts  enderecos.ts  logos.ts
src/i18n/   tradução e formatação
scripts/    teste do PDF, verificação de traduções, ci-status.sh
supabase/migrations/   SQL aplicado
docs/       esta referência e o log de alterações
```

**Cuidados conhecidos:**
- Constantes usadas no servidor **não podem** vir de arquivos `"use client"`. Já causou um erro com `NaN` na paginação.
- O PDF na Vercel precisa das fontes do pdfkit; a verificação automática confere isso.
- Para esperar a publicação da Vercel, use o status do commit no GitHub (`.statuses[0].state`).

## 9. Pendências conhecidas

- Assinatura e pagamento (gateway, preço, teste grátis) e plano Pro da Vercel para uso comercial.
- Cálculo automático de distância e de deslocamento por km.
- Modelos (checklists) ainda vazios.
- Proteção contra senhas vazadas no Supabase (opcional, ainda desligada).
