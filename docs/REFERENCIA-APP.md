# TecDesk: especificação completa do app

> Documento único de referência. Cole em outro chat ou IA para dar contexto completo do app.
> Estado em 16/11/2026. O histórico de mudanças fica em `docs/CHANGELOG.md`.

## Índice

1. [Resumo em 1 minuto](#1-resumo-em-1-minuto)
2. [Glossário](#2-glossário)
3. [Ambientes e infraestrutura](#3-ambientes-e-infraestrutura)
4. [Tecnologia](#4-tecnologia)
5. [Navegação e mapa de rotas](#5-navegação-e-mapa-de-rotas)
6. [Telas, uma por uma](#6-telas-uma-por-uma)
7. [Regras de negócio](#7-regras-de-negócio)
8. [Banco de dados](#8-banco-de-dados)
9. [Design System](#9-design-system)
10. [Estrutura do código](#10-estrutura-do-código)
11. [Fluxo de trabalho e regras de colaboração](#11-fluxo-de-trabalho-e-regras-de-colaboração)
12. [Cuidados conhecidos](#12-cuidados-conhecidos)
13. [Pendências e ideias futuras](#13-pendências-e-ideias-futuras)

---

## 1. Resumo em 1 minuto

- **O que é:** TecDesk, um sistema web para **técnicos de informática autônomos** controlarem atendimentos (ordens de serviço), clientes, equipamentos, orçamentos, agenda, preços e recebimentos.
- **Como é usado:** pelo navegador, no celular e no computador. Pode ser instalado na tela inicial do celular (PWA).
- **Modelo de conta:** 1 login = 1 técnico = 1 negócio. Não existe equipe nem vários usuários por negócio.
- **Idiomas:** português do Brasil (padrão), inglês e espanhol. Moeda (BRL, USD, EUR) e fuso horário são escolhidos por conta.
- **Fase atual:** testes. Tudo liberado, sem cobrança. A assinatura ainda não foi definida.
- **Nomes:** o produto chama-se TecDesk. O repositório é `app-tecOS` e o projeto no Supabase é `TecOS-v1`.
- **Dono do projeto:** não é programador. Toda explicação para ele deve ser em português simples.

## 2. Glossário

| Termo | Significado |
|---|---|
| **OS / Atendimento** | Ordem de serviço: um trabalho feito para um cliente. Na tela chama-se "Atendimento"; no banco, `base_atendimentos`; na rota, `/servicos`. |
| **Orçamento** | Proposta de preço. Pode virar uma OS uma única vez. |
| **Visita técnica** | Ida do técnico ao cliente. Cada OS pode ter várias, com data, hora e duração. Alimenta a Agenda. |
| **Tabela de Preços** | Lista de serviços que o técnico oferece, com valor e tempo médio (`cadastro_servicos`). |
| **Método de precificação** | Forma de calcular o valor do atendimento (4 opções, ver 7.3). |
| **Equipamento** | Máquina do cliente (computador, notebook, rede, impressora), com ficha técnica e senhas. |
| **Janela de visualização** | Janela central só de leitura que abre ao clicar num cliente, OS, orçamento ou equipamento. Tem botão Editar. |
| **Rascunho** | Cópia de uma OS ou orçamento novo guardada no próprio aparelho antes do primeiro Salvar. |

## 3. Ambientes e infraestrutura

| Item | Valor |
|---|---|
| App em produção | https://app-tec-os.vercel.app |
| Hospedagem | Vercel, região `gru1` (São Paulo). Publica sozinha a cada envio para `main`. |
| Repositório | GitHub `tommoraes13/app-tecOS` (branches `dev`, `main`, `ci-artefatos`) |
| Banco, login e arquivos | Supabase, projeto **TecOS-v1** (`ytpvbfgzuwvmktqcoucq`, São Paulo) |
| Outro projeto Supabase da organização | **Não pertence ao app. Nunca mexer.** |
| Node | 22.x |

**Variáveis de ambiente** (modelo em `.env.example`):

| Variável | Para que serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto no Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase. |
| `EQUIPMENT_SECRET_KEY` | Chave AES-256 (32 bytes em base64) que criptografa as senhas dos equipamentos. Fica **só na Vercel**. **Nunca trocar**: as senhas salvas deixariam de abrir. |

Arquivos `.env*.local` nunca vão para o git.

## 4. Tecnologia

| Camada | Escolha |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions), React 19 |
| Linguagem | TypeScript estrito |
| Estilo | Tailwind CSS 4, tokens em `src/app/globals.css`; tema claro e escuro (`next-themes`) |
| Ícones | `lucide-react` |
| Banco e login | Supabase (Postgres + Auth + Storage) via `@supabase/ssr` |
| PDF | `@react-pdf/renderer`, gerado no servidor |
| CEP | ViaCEP |
| Sugestão de endereço | Photon / OpenStreetMap (`photon.komoot.io`), gratuito |

**Como o app conversa com o banco**
- As telas (Server Components) leem direto do Supabase com o login do técnico.
- As gravações passam por Server Actions (arquivos `actions.ts`), que devolvem `{ ok: true, data }` ou `{ ok: false, error }`.
- Toda tabela tem `user_id` e RLS: cada técnico só enxerga e altera os próprios dados.
- O login é conferido localmente pelo token (`getClaims()`), sem chamada extra ao Supabase.

**Traduções**
- O texto em português é a própria chave: `t("Salvar")`.
- O sufixo `@@contexto` separa chaves iguais com sentidos diferentes (exemplo: `Estado@@UF`).
- Dicionários em `src/i18n/messages/en.ts` e `es.ts`.
- No cliente usa-se `useI18n()`; no servidor, `getI18n()` e `pageTitle()`.
- O objeto `fmt` formata dinheiro, datas, horas e números conforme o idioma, a moeda e o fuso da conta.
- `scripts/verificar-traducoes.ts` reprova a verificação automática se faltar alguma tradução.

**Segurança**
- Cabeçalhos em `next.config.ts`: CSP (só o próprio site, Supabase, ViaCEP e Photon), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy e COOP.
- Senhas de equipamentos criptografadas no servidor (`src/lib/crypto.ts`) e nunca enviadas abertas para a tela sem o técnico pedir.
- Funções do banco não são executáveis por visitantes sem login.

## 5. Navegação e mapa de rotas

### 5.1 Menu lateral (computador) e menu hambúrguer (celular)

1. Dashboard
2. Atendimentos
3. Minha Agenda
4. Clientes
5. Orçamentos
6. Meu Catálogo
   - Tabela de Preços
   - Produtos
   - Modelos
7. Meu Negócio (abaixo de um separador)
   - Dados do Negócio
   - Configurar Precificação

### 5.2 Menu fixo no rodapé (só celular)

Da esquerda para a direita:

| Posição | Ícone | Abre |
|---|---|---|
| 1 | Casa | Dashboard |
| 2 | Agenda | Minha Agenda |
| 3 | **+** (botão redondo de destaque) | Novo atendimento |
| 4 | Lupa | Atendimentos |
| 5 | Conta | Minha Conta |

O menu do rodapé some nas telas de OS e orçamento, que têm barra própria com Voltar, Total e Salvar.

### 5.3 Barra superior

- Busca geral (clientes, OS, orçamentos, serviços, produtos e nomes de telas).
- Ajuda.
- Sino de lembretes.
- Menu da conta: Minha Conta, Meu Plano, tema e Sair.

### 5.4 Mapa de rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` | Entrar | Público |
| `/criar-conta` | Criar conta | Público |
| `/auth/callback` | Retorno dos links de e-mail (confirmação, troca de senha) | Público |
| `/auth/signout` | Sair | Logado |
| `/auth/expirou` | Saída automática depois de 24 h | Logado |
| `/dashboard` | Dashboard | Logado |
| `/servicos` | Lista de atendimentos | Logado |
| `/servicos/novo` | Novo atendimento | Logado |
| `/servicos/[id]` | Editar atendimento | Logado |
| `/agenda` | Minha Agenda | Logado |
| `/clientes` | Clientes | Logado |
| `/orcamentos` | Lista de orçamentos | Logado |
| `/orcamentos/novo` | Novo orçamento | Logado |
| `/orcamentos/[id]` | Editar orçamento | Logado |
| `/cadastros/servicos` | Tabela de Preços | Logado |
| `/cadastros/produtos` | Produtos | Logado |
| `/cadastros/templates` | Modelos | Logado |
| `/meu-negocio` | Dados do Negócio | Logado |
| `/meu-negocio/precificacao` | Configurar Precificação | Logado |
| `/minha-conta` | Minha Conta (abas por `?aba=conta\|aparencia\|plano\|dados`) | Logado |
| `/api/pdf/os/[id]` e `/api/pdf/orcamento/[id]` | PDF (`?formato=celular`, `?baixar=1`) | Logado |
| `/precificacao` | Redireciona para `/meu-negocio/precificacao` | Logado |
| `/meu-plano` | Redireciona para `/minha-conta?aba=plano` | Logado |

Quem não está logado é levado para `/login`. Quem está logado e abre `/login` ou `/criar-conta` vai para `/dashboard`.

## 6. Telas, uma por uma

### 6.1 Entrar (`/login`)
- Campos: e-mail e senha.
- "Esqueci minha senha": envia um link por e-mail. Ao abrir, a pessoa entra e cai em Minha Conta › Alterar dados.
- Link "Criar conta".
- Mostra um aviso quando a pessoa foi desconectada pela regra das 24 horas.
- Seletor de idioma no rodapé.

### 6.2 Criar conta (`/criar-conta`)
- Campos: Seu nome, Nome do negócio, Telefone (WhatsApp), E-mail, Senha e Repita a senha.
- Validações: nome e negócio preenchidos, telefone com DDD, senha com 6 caracteres ou mais, as duas senhas iguais.
- Ao criar, o banco já monta Meu Negócio (nome fantasia, telefone, e-mail), o perfil (nome de exibição) e a numeração.
- Se o Supabase exigir confirmação de e-mail, aparece a tela "Confirme seu e-mail". Se não exigir, a pessoa entra direto no Dashboard.

### 6.3 Dashboard (`/dashboard`)
- **Saudação** com o nome de exibição.
- **Botões:** Novo atendimento (botão de destaque) e Novo orçamento. No celular ficam lado a lado.
- **Período:** Essa semana, Últimos 7, 15, **30 (padrão)** ou 90 dias.
- **Cards**, cada um comparado com o período anterior de mesmo tamanho:
  - Serviços realizados
  - Valor recebido (card de destaque)
  - Valores a receber
  - Atendimentos em aberto
- **Gráfico de ganhos:** valor recebido por dia, ou por semana nos períodos longos.
- **Listas:** últimos atendimentos e melhores clientes.
- **Origem dos números:** função `dashboard_resumo` e `melhores_clientes`.

### 6.4 Atendimentos (`/servicos`)
- **Carrossel "Mais recentes"** no topo.
- **Abas por status**, cada uma com a contagem.
- **Busca e filtros:** texto (cliente, número, serviço), data de/até e categoria do serviço.
- **Lista:** 10 por página. No celular vira lista de cards.
- **Cada linha mostra:** número da OS, cliente, serviços, data, status (com cor) e valor (verde se recebido, amarelo se a receber).
- **Clicar** abre a janela de visualização da OS.
- **Seleção múltipla** para excluir.
- **Origem dos dados:** view `os_lista` e função `os_contagens`.

### 6.5 Formulário de atendimento e de orçamento (`/servicos/novo`, `/servicos/[id]`, `/orcamentos/novo`, `/orcamentos/[id]`)

O mesmo componente serve aos dois (`src/components/documento/documento-form.tsx`).

**Bloco principal**
- Número (5 dígitos, editável, sem repetir para o mesmo técnico).
- Cliente: busca enquanto digita, ou cadastro de cliente novo sem sair da tela.
- Data de início (OS) ou data (orçamento).
- Relato do cliente.

**Seções recolhidas** (abrem com um liga/desliga)
- **Visitas técnicas** (só OS): data, hora e duração de cada visita. A duração sugerida é a visita padrão mais o tempo dos serviços.
- **Equipamentos:** escolhe equipamentos do cliente ou cadastra um novo.
- **Serviços:** itens da Tabela de Preços ou avulsos. Cada item tem quantidade, valor unitário e equipamento vinculado.
- **Produtos:** itens do cadastro de produtos ou avulsos, com os mesmos campos.
- **Despesas:**
  - Frete: cobrado do cliente, entra no total e no PDF.
  - Deslocamento, alimentação, insumos e outros: controle interno, não entram no total nem no PDF.
- **Desconto:** em R$ ou em %.

**Campos finais**
- Distância em km (digitada à mão).
- Garantia em meses (vem com o padrão de Meu Negócio).
- Observações (saem no PDF).

**Resumo** (coluna lateral no computador; no fim da tela no celular)
- Seletor do método de precificação **só daquele documento**.
- Linhas: serviços, produtos, frete, visita técnica, subtotal, desconto e total.
- Liga/desliga da visita técnica e valor da visita (nos métodos com visita).
- "Definir total manualmente" (exceto no método Livre, em que o total já é digitado).

**Ações**
- Status em pílulas (só OS).
- PDF: escolha entre A4 e celular; botões ver, baixar e compartilhar.
- Mensagem para WhatsApp: prévia editável, copiar ou enviar para o número do cliente.
- **Finalizar OS** (só OS): pergunta "O pagamento já foi recebido?".
- **Transformar em atendimento** (só orçamento).
- Salvar.

**No celular:** barra fixa no rodapé com Voltar, Total e Salvar.

### 6.6 Minha Agenda (`/agenda`)
- Calendário mensal com as visitas técnicas das OS.
- Lista "Próximos atendimentos" com quantos dias faltam.
- Botão Novo atendimento.
- Clicar numa visita abre a OS.

### 6.7 Clientes (`/clientes`)
- **Faixa de resumo:** nº de clientes, valor médio dos serviços, clientes em garantia e taxa de orçamentos aceitos.
- **Busca:** nome, telefone, e-mail ou cidade.
- **Filtros:** canal e situação (Em garantia, Com atendimentos, Sem atendimentos).
- **Lista:** nome, telefone, cidade, serviços prestados e último atendimento, com botões de ação.
- **Novo cliente** (modal):
  - Nome, telefone, e-mail.
  - Canal: Internet, Indicação, Tráfego pago, Redes sociais ou Outro.
  - Endereço: o CEP preenche pelo ViaCEP; digitar a rua mostra sugestões do OpenStreetMap.
  - Observações.
- **Janela do cliente:** dados, equipamentos, atendimentos e orçamentos, com botão Editar.

### 6.8 Equipamentos (dentro do cliente)
- **Tipos:** Computador (desktop), Notebook/laptop, Roteador/A.P./rede e Impressora.
- **Campos fixos:** tipo e nome do equipamento.
- **Seções recolhidas**, iguais para todos os tipos, cada uma mostrando quantos campos estão preenchidos:

| Seção | Desktop | Notebook | Rede | Impressora |
|---|---|---|---|---|
| **Acesso** | Usuário e senha | Usuário e senha | SSID e senha Wi-Fi 2.4G e 5G; usuário e senha admin | (nenhum) |
| **Hardware** | Processador, placa-mãe, memória, GPU, fonte, 3 discos, cooler, fans | Modelo, processador, memória, GPU, 2 discos | Tipo de equipamento, provedor | Marca, modelo, tipo de tinta |
| **Sistema** | Modo da BIOS, sistema operacional, nome na rede | Modo da BIOS, sistema operacional, nome na rede | IP de configuração, gateway, DHCP e faixa de IP | Modo de conexão, rede conectada, IP, gateway, Wi-Fi Direct, MAC |
| **Outros** | Backup (tipo, tamanho, diretório), impressora compartilhada, pasta compartilhada | (nenhum) | (nenhum) | (nenhum) |

- **Estado geral:** seção com liga/desliga e três textos: Sintomas, Defeitos e Solução.
- **Senhas:** aparecem mascaradas, com botões mostrar e copiar.
- **Janela do equipamento:** ficha técnica, senhas mascaradas e os serviços já feitos nele.
- A lista completa de campos está em `src/lib/equipamentos.ts`.

### 6.9 Orçamentos (`/orcamentos`)
- **Abas:** Aguardando aceite, Aprovados (os que já viraram atendimento) e Todos.
- **Busca** por cliente ou número.
- **Lista:** número, cliente, data e valor.
- Orçamento **não tem status próprio**: "aprovado" significa que já foi transformado em atendimento.

### 6.10 Tabela de Preços (`/cadastros/servicos`)
- **Cards acima da tabela:**
  - **Ticket médio:** média dos valores dos serviços cadastrados.
  - **Tempo médio:** média do tempo médio dos serviços que têm tempo informado.
  - **Serviços cadastrados:** quantidade.
- **Abas por categoria:** Manutenção, Diagnóstico/Revisão, Montagem, Configuração, Backup e Recuperação, Consultoria e Outros. Cada categoria tem cor própria.
- **Serviço:** nome, código (opcional, sem repetir), categoria, valor, tempo médio (passos de 15 min) e ativo/inativo.

### 6.11 Produtos (`/cadastros/produtos`)
- **Produto:** nome, código (opcional, sem repetir), valor de custo, valor de venda e ativo/inativo.
- A tela mostra a margem calculada.

### 6.12 Modelos (`/cadastros/templates`)
- Reservada para checklists e sequências de atendimento. **Ainda vazia.**

### 6.13 Dados do Negócio (`/meu-negocio`)
- **Logotipo:**
  - Enviar imagem (reduzida para PNG de até 512 px).
  - Ou "Gerar aleatoriamente": percorre 20 modelos simples com as iniciais do nome fantasia.
  - Aparece no topo dos PDFs.
- **Dados:** nome fantasia, razão social, CPF/CNPJ, e-mail, telefone, endereço completo, região de atendimento (km) e garantia padrão (meses).

### 6.14 Configurar Precificação (`/meu-negocio/precificacao`)
- **Método de precificação:** 4 cartões de escolha (ver 7.3).
- **Valor da hora técnica:** aparece só no método por hora.
- **Valor da visita técnica:** aparece só nos métodos com visita.
- **Duração padrão da visita técnica.**
- **Valor adicional por km:** guardado para uso futuro.

### 6.15 Minha Conta (`/minha-conta`)

| Aba | Conteúdo |
|---|---|
| **Minha conta** | Foto (reduzida a 256×256), nome de exibição, idioma, moeda, fuso horário; opção "Sair sozinho 24 horas depois de entrar". |
| **Aparência** | Tema Claro, Escuro ou Igual ao aparelho. |
| **Meu Plano** | Plano Gratuito (fase de testes). Upgrade e cancelamento marcados como "em breve". |
| **Alterar dados** | Somente a troca de senha. |

### 6.16 PDF
- Existe só para OS e orçamento.
- **Conteúdo:** logotipo e dados do negócio; número, datas e status; cliente; equipamentos; relato; visitas; serviços; produtos; totais; garantia; observações; assinaturas (só na OS).
- **Dois modelos:**
  - **A4:** folha comum, itens em tabela.
  - **Celular:** página estreita e alta (360×760 pt), uma coluna, itens empilhados, bom para WhatsApp.
- A escolha do modelo fica lembrada no aparelho.

## 7. Regras de negócio

### 7.1 Status da OS

| Status | Como entra | Conta como |
|---|---|---|
| **Em andamento** | Padrão ao criar | A receber |
| **Pendente** | Manual | A receber |
| **Aguardando Pagamento** | Ao finalizar sem ter recebido, ou manual | A receber |
| **Finalizado** | Ao finalizar tendo recebido, ou manual | **Recebido** |
| **Retorno** | Manual | A receber |

### 7.2 Recebimento (regra desde 12/11/2026)
- **O status decide tudo.** Não existem campos de recebimento nem de data de entrega na tela.
- **Finalizado:** recebido = sim, valor recebido = valor total, data do recebimento = hoje.
- **Qualquer outro status:** recebido = não, sem valor e sem data.
- **Não há** recebimento parcial nem data de recebimento futura.
- A regra é aplicada pelo gatilho `finalizado_marca_recebido` no banco, então vale para qualquer forma de alterar a OS.
- **Finalizar OS** pergunta se o pagamento já foi recebido:
  - "Sim, recebido" muda para Finalizado.
  - "Ainda não" muda para Aguardando Pagamento.
- A data de entrega é preenchida sozinha ao finalizar e serve de início da garantia.

### 7.3 Métodos de precificação

O técnico escolhe o padrão em Configurar Precificação. Cada OS e orçamento guarda o método usado, então mudar o padrão depois não altera documentos antigos.

| Valor no banco | Nome na tela | Cálculo |
|---|---|---|
| `servico` | Valor do Serviço | Soma do preço de cada serviço. Sem visita. |
| `servico_visita` | Valor do Serviço + Visita Técnica | Soma dos serviços + valor da visita. É o padrão de conta nova. |
| `hora_visita` | Hora Técnica + Visita Técnica | Cada serviço vira horas × valor da hora, mais a visita. |
| `livre` | Livre | O técnico digita o total em cada atendimento. |

**Detalhes do método por hora**
- As horas de cada serviço vêm do **tempo médio** da Tabela de Preços, arredondado para 15 minutos.
- Serviço sem tempo médio conta como 1 hora.
- As horas podem ser ajustadas em cada atendimento, em passos de meia hora.
- No PDF, as colunas viram "Horas" e "Valor/hora".

**Trocar o método dentro de um documento** converte os serviços do catálogo entre preço fixo e horas.

### 7.4 Total do documento
- **Total = serviços + produtos + visita técnica + frete − desconto.**
- Desconto em % é aplicado sobre o subtotal.
- As despesas internas (deslocamento, alimentação, insumos, outros) nunca entram no total.
- Com total manual ou método Livre, o PDF mostra só o total; os itens saem sem valores.

### 7.5 Orçamento vira atendimento
- "Transformar em atendimento" cria a OS copiando cliente, relato, itens, despesas, desconto, garantia, método e total.
- Só pode ser feito **uma vez por orçamento**.
- Feito pela função `transformar_orcamento_em_os`.

### 7.6 Numeração
- OS e orçamento têm numerações separadas.
- 5 dígitos (00001 a 99999), por técnico, editável e sem repetir.
- O banco sugere o próximo número.

### 7.7 Salvamento
- **Documento novo:** rascunho guardado no aparelho até o primeiro Salvar. Ao reabrir "Novo", o app oferece recuperar ou descartar.
- **Depois do primeiro Salvar:** o app grava sozinho cerca de 4 segundos após cada mudança e mostra "Salvo automaticamente às HH:MM".
- Aviso ao sair com mudanças não salvas.

### 7.8 Garantia
- Em meses, por documento; o padrão vem de Meu Negócio.
- Conta a partir da data de entrega da OS.
- "Clientes em garantia" na tela Clientes usa essa conta.

### 7.9 Sair depois de 24 horas
- Opção por conta, **desligada por padrão**.
- Ligada, o app compara a hora do login com a hora atual e encerra a sessão depois de 24 horas.
- Funciona tanto ao abrir uma tela quanto com a tela já aberta.

### 7.10 Lembretes (sino)
- Visitas técnicas de hoje e dos próximos 2 dias, de OS ainda não finalizadas.
- OS em Aguardando Pagamento.

### 7.11 Busca geral
- Procura sem diferenciar acento nem maiúsculas ("joao" acha "João").
- Devolve até 5 resultados de cada tipo, mais as telas do app.

## 8. Banco de dados

Postgres no Supabase. Todas as tabelas ficam no schema `public`, têm `user_id` (dono) e RLS com política de dono.
Colunas comuns omitidas nas tabelas abaixo: `id` (uuid), `user_id`, `created_at`, `updated_at`.

### 8.1 Visão geral das tabelas

| Tabela | Guarda | Quantas por técnico |
|---|---|---|
| `meu_negocio` | Dados da empresa e configuração de preços | 1 |
| `perfil` | Preferências da conta | 1 |
| `numeracao` | Próximo número de OS e de orçamento | 1 |
| `base_clientes` | Clientes | Várias |
| `base_equipamentos` | Equipamentos dos clientes | Várias |
| `cadastro_servicos` | Tabela de Preços | Várias |
| `cadastro_produtos` | Produtos | Várias |
| `base_orcamentos` | Orçamentos (cabeçalho) | Várias |
| `orc_servicos` | Serviços de cada orçamento | Várias |
| `orc_produtos` | Produtos de cada orçamento | Várias |
| `base_atendimentos` | OS (cabeçalho) | Várias |
| `os_servicos` | Serviços de cada OS | Várias |
| `os_produtos` | Produtos de cada OS | Várias |
| `os_visitas` | Visitas técnicas de cada OS | Várias |
| `os_equipamentos` | Equipamentos atendidos em cada OS | Várias |

### 8.2 Relações

```
auth.users ─┬─ meu_negocio (1)
            ├─ perfil (1)
            ├─ numeracao (1)
            ├─ cadastro_servicos
            ├─ cadastro_produtos
            └─ base_clientes ─┬─ base_equipamentos
                              ├─ base_orcamentos ─┬─ orc_servicos ── cadastro_servicos, base_equipamentos
                              │                   └─ orc_produtos ── cadastro_produtos, base_equipamentos
                              └─ base_atendimentos ─┬─ os_servicos ── cadastro_servicos, base_equipamentos
                                 (orcamento_id →    ├─ os_produtos ── cadastro_produtos, base_equipamentos
                                  base_orcamentos)  ├─ os_visitas
                                                    └─ os_equipamentos ── base_equipamentos
```

- Excluir um **cliente** apaga os equipamentos dele, mas **mantém** as OS e os orçamentos, que ficam com cliente "Não definido".
- Excluir um **serviço ou produto do catálogo** mantém os itens já lançados (a descrição e o valor ficam copiados no item).
- Excluir uma **OS ou orçamento** apaga os itens, visitas e vínculos.

### 8.3 `meu_negocio`

| Coluna | Tipo | Observação |
|---|---|---|
| `user_id` | uuid | Chave primária |
| `nome_fantasia`, `razao_social`, `cpf_cnpj` | texto | |
| `email`, `telefone` | texto | |
| `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado` | texto | |
| `logo_url` | texto | Caminho do logotipo no bucket `avatars` |
| `regiao_atendimento_km` | número | Raio de atendimento |
| `garantia_meses_padrao` | inteiro | Vem preenchida nos documentos novos |
| `tipo_precificacao` | texto | `servico`, `servico_visita`, `hora_visita` ou `livre` |
| `valor_hora` | dinheiro | Usado no método por hora |
| `valor_visita` | dinheiro | |
| `duracao_visita_min` | inteiro | Padrão 60 |
| `cobrar_visita` | sim/não | Acompanha o método (verdadeiro nos métodos com visita) |
| `valor_km` | dinheiro | Reservado para uso futuro |

### 8.4 `perfil`

| Coluna | Tipo | Observação |
|---|---|---|
| `user_id` | uuid | Chave primária |
| `nome_exibicao` | texto | Saudação e menu da conta |
| `foto_path` | texto | Caminho no bucket `avatars` |
| `idioma` | texto | `pt-BR`, `en` ou `es` |
| `moeda` | texto | `BRL`, `USD` ou `EUR` |
| `fuso` | texto | Padrão `America/Sao_Paulo` |
| `sair_apos_24h` | sim/não | Padrão não |

### 8.5 `numeracao`

| Coluna | Tipo | Observação |
|---|---|---|
| `user_id` | uuid | Chave primária |
| `proxima_os` | inteiro | 1 a 99999 |
| `proximo_orcamento` | inteiro | 1 a 99999 |

### 8.6 `base_clientes`

| Coluna | Tipo | Observação |
|---|---|---|
| `nome` | texto | Obrigatório |
| `telefone` | texto | Obrigatório |
| `email` | texto | |
| `canal` | enum `cliente_canal` | Como o cliente chegou |
| `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado` | texto | |
| `observacoes` | texto | |

### 8.7 `base_equipamentos`

| Coluna | Tipo | Observação |
|---|---|---|
| `cliente_id` | uuid | Dono do equipamento |
| `tipo` | enum `equipamento_tipo` | |
| `nome` | texto | Obrigatório |
| `especificacoes` | jsonb | Ficha técnica (chaves de `src/lib/equipamentos.ts`), mais `estado_ativo`, `estado_sintomas`, `estado_defeitos` e `estado_solucao` |
| `senhas` | jsonb | Só valores criptografados (AES-256) |
| `estado_geral`, `estado_detalhe` | enum / texto | **Legado.** O `estado_detalhe` antigo aparece como Sintomas. |

### 8.8 `cadastro_servicos`

| Coluna | Tipo | Observação |
|---|---|---|
| `nome` | texto | Obrigatório |
| `codigo` | texto | Opcional, único por técnico |
| `categoria` | enum `servico_categoria` | |
| `valor` | dinheiro | |
| `tempo_medio_min` | inteiro | Base do método por hora e da duração sugerida |
| `ativo` | sim/não | |
| `tipo_equipamento`, `tamanho_backup`, `localizacao_pastas` | texto | **Legado**, fora da tela |

### 8.9 `cadastro_produtos`

| Coluna | Tipo | Observação |
|---|---|---|
| `nome` | texto | Obrigatório |
| `codigo` | texto | Opcional, único por técnico |
| `valor_custo` | dinheiro | Opcional |
| `valor_venda` | dinheiro | |
| `ativo` | sim/não | |

### 8.10 `base_orcamentos`

| Coluna | Tipo | Observação |
|---|---|---|
| `numero` | inteiro | Único por técnico |
| `cliente_id` | uuid | Pode ficar vazio (cliente excluído) |
| `data` | data | |
| `relato` | texto | |
| `precificacao` | texto | Método usado neste orçamento |
| `cobrar_visita`, `valor_visita` | sim/não, dinheiro | |
| `despesas_ativas` | sim/não | |
| `despesa_frete` | dinheiro | Cobrado do cliente |
| `despesa_deslocamento`, `despesa_alimentacao`, `despesa_insumos`, `despesa_outros` | dinheiro | Controle interno |
| `desconto_tipo`, `desconto_valor` | texto, número | `valor` (R$) ou `percentual` (%) |
| `garantia_meses` | inteiro | |
| `valor_total`, `valor_total_manual` | dinheiro, sim/não | |
| `observacoes` | texto | |

### 8.11 `base_atendimentos` (OS)

Tem todas as colunas de `base_orcamentos` (exceto `data`) e mais:

| Coluna | Tipo | Observação |
|---|---|---|
| `orcamento_id` | uuid | Orçamento de origem, se houver |
| `data_inicio` | data | |
| `status` | enum `os_status` | Padrão `em_andamento` |
| `distancia_km` | número | Digitada à mão |
| `data_entrega` | data | Preenchida sozinha ao finalizar; início da garantia |
| `recebido` | sim/não | **Definido pelo gatilho** conforme o status |
| `valor_recebido` | dinheiro | Igual ao total quando Finalizado |
| `data_recebimento` | data | Hoje, quando Finalizado |
| `finalizado_em` | data e hora | |

### 8.12 Itens: `orc_servicos`, `orc_produtos`, `os_servicos`, `os_produtos`

| Coluna | Tipo | Observação |
|---|---|---|
| `orcamento_id` ou `os_id` | uuid | Documento do item |
| `servico_id` ou `produto_id` | uuid | Item do catálogo; vazio se avulso |
| `descricao` | texto | Copiada do catálogo ou digitada |
| `quantidade` | número | No método por hora, é a quantidade de horas |
| `valor_unitario` | dinheiro | No método por hora, é o valor da hora |
| `equipamento_id` | uuid | Equipamento vinculado, opcional |
| `ordem` | inteiro | Posição na lista |

### 8.13 `os_visitas`

| Coluna | Tipo | Observação |
|---|---|---|
| `os_id` | uuid | |
| `data` | data | |
| `hora` | hora | Opcional |
| `duracao_min` | inteiro | Opcional |
| `ordem` | inteiro | |

### 8.14 `os_equipamentos`

| Coluna | Tipo | Observação |
|---|---|---|
| `os_id` | uuid | |
| `equipamento_id` | uuid | |

### 8.15 Tipos enumerados

| Enum | Valores |
|---|---|
| `os_status` | `em_andamento`, `pendente`, `aguardando_pagamento`, `finalizado`, `retorno` |
| `cliente_canal` | `internet`, `indicacao`, `trafego_pago`, `redes_sociais`, `outro` |
| `equipamento_tipo` | `desktop`, `notebook`, `rede`, `impressora` |
| `equipamento_estado` | `funcionando`, `defeito`, `parado` (legado) |
| `servico_categoria` | `manutencao`, `diagnostico_revisao`, `montagem`, `configuracao`, `backup_recuperacao`, `consultoria`, `outros` |

### 8.16 Views

| View | Para que serve |
|---|---|
| `os_lista` | Lista de OS já com nome e telefone do cliente, serviços, categorias e texto de busca. Usada na tela Atendimentos. |
| `clientes_resumo` | Clientes com quantidade de serviços prestados e data do último atendimento. Usada na tela Clientes. |

As duas rodam com as permissões de quem consulta (`security_invoker`).

### 8.17 Funções

| Função | Para que serve |
|---|---|
| `dashboard_resumo` | Números do Dashboard no período e no período anterior. |
| `melhores_clientes` | Clientes que mais contrataram. |
| `clientes_resumo_geral` | Faixa de resumo da tela Clientes. |
| `os_contagens` | Quantidade de OS por status, com os filtros da tela. |
| `buscar_tudo` | Busca geral da barra superior. |
| `buscar_clientes` | Busca de cliente no formulário de OS e orçamento. |
| `notificacoes` | Lembretes do sino. |
| `sem_acento` | Tira acentos e maiúsculas para as buscas. |
| `transformar_orcamento_em_os` | Cria a OS a partir do orçamento. |
| `finalizar_os` | **Legado.** O app agora define o status direto. |

Todas rodam com as permissões de quem chama e não podem ser executadas sem login.

### 8.18 Gatilhos

| Gatilho | O que faz |
|---|---|
| `handle_new_user` | Ao criar a conta, cria `meu_negocio`, `perfil` e `numeracao`, lendo nome, negócio e telefone do cadastro. |
| `definir_numero_os`, `definir_numero_orcamento` | Dão o próximo número e avançam a numeração. |
| `finalizado_marca_recebido` | Aplica a regra de recebimento pelo status (ver 7.2). |
| `set_updated_at` | Atualiza a data de alteração. |

### 8.19 Arquivos (Storage)

- Bucket público `avatars`.
- Limite de 512 KB por arquivo; aceita JPEG, PNG e WebP.
- Cada técnico só grava na pasta `<user_id>/`.
- Conteúdo: foto de perfil (`foto-*.jpg|webp`) e logotipo (`logo-*.png`).

### 8.20 Migrações aplicadas

Ficam em `supabase/migrations/`, na ordem em que foram aplicadas:

1. `20261028000001_schema_inicial.sql`: tabelas, RLS, gatilhos e numeração.
2. `20261028000002_ajustes_seguranca_indices.sql`: bloqueio de funções e índices.
3. `20261029000001_ajustes_desconto_garantia_perfil.sql`: desconto, frete, garantia e perfil.
4. `20261029000002_resumos_busca_notificacoes.sql`: views, resumos, buscas e lembretes.
5. `20261030000001_categorias_servico_avatar.sql`: 7 categorias e regras do bucket.
6. `20261112000001_precificacao_recebimento_conta.sql`: 4 métodos, recebimento pelo status, sair após 24 h e criar conta.

## 9. Design System

**Cores e identidade**
- Identidade verde.
- **Degradê verde** (`--brand-900` → `--brand-600`) só em três lugares: botão de destaque, card de destaque e ícone do app. Um degradê azul foi testado e descartado pelo dono.
- Status da OS e categorias de serviço têm cor própria.
- Valores recebidos em verde, a receber em amarelo e desconto em vermelho.
- Tokens em `src/app/globals.css` (`:root` e `.dark`), usados como classes: `bg-surface`, `text-ink-muted`, `border-border-control`, `bg-brand-gradient`, `text-brand-ink`.

**Botões**
- `variant="cta"` (com degradê): no máximo um por tela.
- `variant="dark"`: conclui formulários.
- Outras: `outline`, `ghost`, `danger`, `dangerSolid`, `success`, `successSoft`.

**Padrões de tela**
- Título com ícone, **sem subtítulo**.
- **Quase nenhuma dica embaixo dos campos.** Ficam só as que mostram conta, como "Equivale a R$ …" e a margem do produto.
- Seções de formulário começam fechadas e abrem com um liga/desliga.
- Criar = modal centralizado.
- Ver detalhes = janela central só de leitura, com botão Editar.

**Celular**
- Menu hambúrguer e menu fixo no rodapé.
- Controles com 44 px de altura.
- Campos com fonte de 16 px (o iPhone não dá zoom ao tocar).
- Modais em tela cheia.
- Tabelas viram lista de cards.
- Botão Voltar no fim dos formulários.
- Puxar para atualizar, só com o app instalado na tela inicial.

**Textos**
- Tratamento "você".
- Sem emoji e sem exclamação (exceto a saudação).
- Formatos: R$ 1.250,00, 28/10/2026, OS 00042.

## 10. Estrutura do código

```
src/app/
  (app)/                    telas logadas (layout com menus, barra, rodapé e regra das 24 h)
    dashboard/
    servicos/               atendimentos (lista, novo, [id])
    agenda/
    clientes/
    orcamentos/             (lista, novo, [id])
    cadastros/servicos/     Tabela de Preços
    cadastros/produtos/
    cadastros/templates/    Modelos
    meu-negocio/            Dados do Negócio
    meu-negocio/precificacao/
    minha-conta/            abas
    meu-plano/  precificacao/   só redirecionam
  login/  criar-conta/
  auth/callback/  auth/signout/  auth/expirou/
  api/pdf/[tipo]/[id]/      geração do PDF
src/components/
  layout/      menu lateral, hambúrguer, rodapé, barra superior, busca, sino, cabeçalho
  documento/   formulário de OS e orçamento, itens, PDF, WhatsApp, aviso de saída
  detalhes/    janelas de visualização
  clientes/    modal de cliente e de equipamento, campo de senha
  forms/       endereço (CEP e sugestões)
  ui/          botões, campos, modais, abas, cards
src/lib/
  documento.ts          tipos do formulário, totais e métodos de precificação
  documento-server.ts   carregar e montar OS e orçamento
  equipamentos.ts       campos de cada tipo de equipamento
  status.ts  labels.ts  dashboard.ts  agenda.ts  format.ts
  pdf/                  dados e layout do PDF
  supabase/             clientes do Supabase (navegador, servidor, middleware)
  crypto.ts  cep.ts  enderecos.ts  logos.ts  perfil.ts
  database.types.ts     tipos gerados do banco
src/i18n/               tradução e formatação
scripts/                teste do PDF, verificação de traduções, ci-status.sh
supabase/migrations/    SQL aplicado no banco
docs/                   esta especificação e o log de alterações
CLAUDE.md               instruções para a IA que trabalha no repositório
```

**Onde mexer para cada coisa**

| Quero mudar | Arquivo |
|---|---|
| Itens do menu | `src/components/layout/nav-items.ts` |
| Menu do rodapé no celular | `src/components/layout/menu-rodape.tsx` |
| Formulário de OS e orçamento | `src/components/documento/documento-form.tsx` e `item-list.tsx` |
| Cálculo do total e métodos | `src/lib/documento.ts` |
| Campos dos equipamentos | `src/lib/equipamentos.ts` |
| Cores e nomes dos status | `src/lib/status.ts` |
| Layout do PDF | `src/lib/pdf/documento-pdf.tsx` |
| Cores e tokens | `src/app/globals.css` |
| Traduções | `src/i18n/messages/en.ts` e `es.ts` |

## 11. Fluxo de trabalho e regras de colaboração

**Publicação**
1. Trabalhar na branch `dev` e enviar para o GitHub.
2. A verificação automática (`.github/workflows/verificar.yml`) confere tipos, traduções e build, gera PDFs de exemplo e testa o PDF dentro do servidor. Acompanhar com `scripts/ci-status.sh dev`.
3. Com a verificação verde, mesclar em `main` (fast-forward). A Vercel publica sozinha.
4. Os PDFs de exemplo ficam na branch `ci-artefatos`: `teste-os.pdf`, `teste-os-en.pdf` e `teste-os-celular.pdf`.
5. Registrar a mudança no topo de `docs/CHANGELOG.md` e atualizar esta especificação quando uma regra mudar.

**Mudança no banco**
1. Mostrar o SQL ao dono.
2. Aplicar só com aprovação, e só no projeto TecOS-v1.
3. Salvar o SQL em `supabase/migrations/`.
4. Atualizar `src/lib/database.types.ts`.

**Como trabalhar com o dono**
- Conversar sempre em português do Brasil, em linguagem simples.
- **Perguntar antes de fazer** quando houver dúvida sobre o que ele quer; não começar tarefas só porque uma função foi mencionada.
- Nunca mexer no outro projeto do Supabase.
- Nunca trocar a `EQUIPMENT_SECRET_KEY`.

## 12. Cuidados conhecidos

- **Constantes usadas no servidor não podem vir de arquivos `"use client"`.** Já causou uma lista vazia por causa de um `NaN` na paginação. Constantes compartilhadas ficam em módulos comuns, como `src/lib/status.ts`.
- **PDF na Vercel** precisa das fontes do pdfkit no pacote (`outputFileTracingIncludes` em `next.config.ts`). A verificação automática confere isso.
- **Esperar a publicação da Vercel:** usar o status do commit no GitHub (`.statuses[0].state`), não o estado combinado.
- **Sugestões de endereço** do OpenStreetMap às vezes não trazem número ou CEP.
- **E-mails de cadastro** saem pelo servidor gratuito do Supabase, que envia poucos por hora. Para clientes de verdade, configurar um servidor de e-mail próprio.
- **Telas logadas nunca foram testadas pela IA**, que não tem login. Os testes no aparelho são feitos pelo dono.

## 13. Pendências e ideias futuras

- Assinatura e pagamento: definir gateway, preço e dias de teste. O uso comercial exige o plano Pro da Vercel.
- Cálculo automático de distância e cobrança por km.
- Tela Modelos (checklists e sequências de atendimento).
- Proteção contra senhas vazadas no Supabase (opcional, desligada).
- Servidor de e-mail próprio para os e-mails de cadastro e troca de senha.
