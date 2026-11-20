# Log de alterações do TecDesk

Cada mudança publicada fica registrada aqui, da mais nova para a mais antiga. Ao fazer uma alteração, acrescente uma entrada no topo, com a data, o que mudou e se houve mudança no banco.

---

## 20/11/2026: primeiro acesso guiado, celular da conta e turma de alunos
**Banco:** `20261120000001_celular_primeiro_acesso.sql`

- Conta nova passa por um passo a passo de 5 telas (dados, senha, negócio, endereço, preços) antes de usar o app.
- Novo campo Celular em Minha Conta, separado do telefone de Meu Negócio.
- Criadas 30 contas de alunos (senha provisória 123, trocada no primeiro acesso).

## 19/11/2026: assinaturas, compartilhar PDF, convite e saída por inatividade
**Banco:** `20261119000001_assinaturas_inatividade.sql`

- **Assinatura da empresa** em Meu Negócio (desenhar ou enviar imagem), em todos os PDFs.
- **OS:** os botões Ver PDF, Baixar e Enviar viraram um só, **Compartilhar PDF**, que abre a prévia com abas PDF padrão / PDF mobile, **Assinar PDF** (cliente assina na tela, fica salvo na OS), **Baixar OS** e **Enviar OS**.
- **Agenda:** embaixo do cliente aparece Bairro · Serviço · Valor (com "+N" quando há mais serviços), no lugar de horário e endereço.
- **Criar conta removido.** Novos técnicos entram por convite do Supabase e completam os dados em Primeiro acesso.
- **Opção "Sair depois de 24 horas" removida.** Agora a sessão cai sozinha para quem fica mais de 3 dias sem usar o app.

## 16/11/2026: área de segurança do iPhone
- O app passa a respeitar a área do "risquinho" de baixo do iPhone (`viewport-fit=cover`). Antes, o celular informava 0 e os botões ficavam colados na beirada.
- Menu do rodapé, barra da OS e do orçamento, rodapé das janelas (Excluir, Editar, Salvar) e menu lateral ganharam a área de segurança mais uma folga.
- Janelas em tela cheia e menu lateral também respeitam a área de cima.

## 16/11/2026: margem de segurança no rodapé do celular
- Mais espaço embaixo do menu fixo do rodapé e da barra de baixo da OS e do orçamento (cerca de 14 px a mais), para os botões não ficarem colados na beirada da tela.
- O fim das telas também ganhou mais espaço, para nada ficar escondido atrás das barras.

## 16/11/2026: especificação completa
- `docs/REFERENCIA-APP.md` foi reescrito como especificação completa: índice, glossário, cada tela, regras de negócio e todas as tabelas do banco com suas colunas.
- Sem mudança no app nem no banco.

## 12/11/2026: precificação, recebimento pelo status, criar conta e menu do celular
**Banco:** `20261112000001_precificacao_recebimento_conta.sql`

**Precificação**
- Quatro métodos: Valor do Serviço, Serviço + Visita Técnica, Hora Técnica + Visita Técnica e Livre.
- No método por hora, cada serviço vira horas (tempo médio) × valor da hora, com as horas ajustáveis na OS.
- Cada OS e orçamento guarda o próprio método, que pode ser trocado no resumo.
- "Tabela de Preços" saiu do menu. As opções dela foram para Meu Negócio › Configurar Precificação.

**Atendimentos**
- O recebimento passa a ser decidido pelo status: Finalizado conta como recebido o total; os outros status contam como a receber.
- Saíram os campos Data da entrega e Recebimento.
- Finalizar OS pergunta se o pagamento já foi recebido.
- As 2 OS finalizadas com recebimento parcial passaram a constar como recebidas por inteiro.
- A tarefa diária de "pagamento com data futura" foi removida.

**Tabela de Preços**
- O submenu "Serviços" virou "Tabela de Preços", com os cards Ticket médio, Tempo médio e Serviços cadastrados.

**PDF**
- Novo modelo para celular (estreito e alto), além do A4. A escolha fica lembrada no aparelho.

**Conta e acesso**
- Tela própria de Criar conta (nome, negócio, telefone, e-mail, senha), que já preenche Meu Negócio e Minha Conta.
- Opção de sair sozinho 24 horas depois de entrar.
- Minha Conta ganhou as abas Minha conta, Aparência, Meu Plano e Alterar dados (só senha).

**Celular**
- Menu fixo no rodapé: Início, Agenda, + Novo atendimento, Atendimentos e Conta.

**Textos e telas**
- Saíram os subtítulos das telas e a maioria das explicações embaixo dos campos.
- O Dashboard abre em "Últimos 30 dias".

**Documentação**
- Criados `docs/REFERENCIA-APP.md` e este log.

## 30/10/2026: volta o degradê verde
- O degradê azul foi testado e descartado; voltou o verde no botão principal, no card de destaque, no logo e no ícone.
- O tamanho do botão ajustado no quadro de design continua.

## 29/10/2026: celular, logotipo, endereço, equipamento e salvamento automático
**Celular**
- Mais espaço no rodapé e na barra superior; datas alinhadas no iPhone.
- Botão Voltar no fim dos formulários; puxar para atualizar (app instalado).
- Carrossel alinhado e botões do Dashboard lado a lado.

**Menu**
- Nova ordem: Meu Catálogo (Serviços, Produtos, Modelos), Tabela de Preços e Meu Negócio.

**Logotipo**
- Logotipo do negócio (enviar ou gerar entre 20 modelos), que sai no topo dos PDFs.

**Endereço**
- Sugestões do OpenStreetMap enquanto digita.

**Equipamento**
- Seções Acesso, Hardware, Sistema e Outros recolhidas.
- Estado geral com Sintomas, Defeitos e Solução.

**Salvamento**
- OS e orçamento: rascunho no aparelho até o 1º Salvar; depois salva sozinho.

## 29/10/2026: cores, categorias, resumo da OS e segurança
**Banco:** `20261030000001_categorias_servico_avatar.sql`

- Sete categorias de serviço, cada uma com sua cor.
- Ícones nos títulos e cores de apoio (status, valores).
- "Serviços Prestados" virou "Atendimentos", com 10 por página.
- Resumo da OS com subtotal e desconto; status em pílulas; Finalizado conta como recebido.
- Foto de perfil reduzida.
- Cabeçalhos de segurança (CSP, HSTS e outros).
- PDF corrigido na Vercel (fontes do pdfkit no pacote).

## 29/10/2026: velocidade, busca e lembretes
**Banco:** `20261029000002_resumos_busca_notificacoes.sql`

- Janelas de visualização (cliente, OS, orçamento, equipamento) com botão Editar.
- Busca geral na barra superior e sino de lembretes.
- Listas e Dashboard calculados no banco.

## 29/10/2026: idiomas, conta e PDF
**Banco:** `20261029000001_ajustes_desconto_garantia_perfil.sql`

- Português, inglês e espanhol; moeda e fuso por conta.
- Minha Conta (foto, nome, idioma, moeda, fuso), Meu Plano e recuperação de senha.
- Desconto, frete, garantia e mensagem de WhatsApp na OS e no orçamento.
- PDF da OS e do orçamento (ver, baixar, compartilhar).
- Agenda com calendário; Dashboard com gráfico de ganhos e melhores clientes.

## 28 e 29/10/2026: primeira versão
**Banco:** `20261028000001_schema_inicial.sql` e `20261028000002_ajustes_seguranca_indices.sql`

- Esqueleto do app (Next.js 15, Tailwind 4, Supabase) e login.
- Meu Negócio, catálogos de serviços e produtos, clientes e equipamentos (senhas criptografadas).
- Atendimentos (OS) e orçamentos com finalizar e transformar.
- Verificação automática (tipos, build, PDF de exemplo).
