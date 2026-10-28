-- =============================================================================
-- TecDesk — esquema inicial (Fase 3)
-- 14 tabelas da Fase 1, regras de acesso (RLS), numeração automática,
-- Finalizar OS, transformar orçamento em atendimento e baixa automática
-- de recebimentos com data futura.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos fixos
-- -----------------------------------------------------------------------------
create type public.os_status as enum (
  'em_andamento', 'pendente', 'aguardando_pagamento', 'finalizado', 'retorno'
);

create type public.equipamento_tipo as enum ('desktop', 'notebook', 'rede', 'impressora');

create type public.equipamento_estado as enum ('funcionando', 'defeito', 'parado');

create type public.servico_categoria as enum (
  'manutencao_corretiva', 'manutencao_preventiva', 'montagem_pc', 'backup_recuperacao',
  'redes_impressoras', 'consultoria', 'outros'
);

create type public.cliente_canal as enum (
  'internet', 'indicacao', 'trafego_pago', 'redes_sociais', 'outro'
);

-- -----------------------------------------------------------------------------
-- Função comum: atualiza updated_at
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Meu Negócio (1 por técnico)
-- -----------------------------------------------------------------------------
create table public.meu_negocio (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  nome_fantasia         text,
  razao_social          text,
  cpf_cnpj              text,
  email                 text,
  telefone              text,
  cep                   text,
  endereco              text,
  numero                text,
  complemento           text,
  bairro                text,
  cidade                text,
  estado                text,
  regiao_atendimento_km numeric(8,1),
  logo_url              text,
  tipo_precificacao     text,
  valor_visita          numeric(12,2) not null default 0 check (valor_visita >= 0),
  duracao_visita_min    integer not null default 60 check (duracao_visita_min >= 0),
  cobrar_visita         boolean not null default true,
  valor_km              numeric(12,2) not null default 0 check (valor_km >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Próximo número de OS e de orçamento de cada técnico
create table public.numeracao (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  proxima_os        integer not null default 1 check (proxima_os between 1 and 99999),
  proximo_orcamento integer not null default 1 check (proximo_orcamento between 1 and 99999)
);

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.base_clientes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome        text not null check (length(trim(nome)) > 0),
  telefone    text not null,
  email       text,
  canal       public.cliente_canal,
  cep         text,
  endereco    text,
  numero      text,
  complemento text,
  bairro      text,
  cidade      text,
  estado      text,
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);
create index base_clientes_user_nome_idx on public.base_clientes (user_id, nome);

-- -----------------------------------------------------------------------------
-- Equipamentos (cada um pertence a 1 cliente)
--   especificacoes: campos do tipo (processador, RAM, SSID, IP, MAC...)
--   senhas: apenas valores criptografados pelo app (AES-256); o banco nunca vê a senha
-- -----------------------------------------------------------------------------
create table public.base_equipamentos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id     uuid not null,
  tipo           public.equipamento_tipo not null,
  nome           text not null check (length(trim(nome)) > 0),
  especificacoes jsonb not null default '{}'::jsonb,
  senhas         jsonb not null default '{}'::jsonb,
  estado_geral   public.equipamento_estado,
  estado_detalhe text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id),
  foreign key (cliente_id, user_id) references public.base_clientes (id, user_id) on delete cascade
);
create index base_equipamentos_cliente_idx on public.base_equipamentos (cliente_id);
create index base_equipamentos_user_idx on public.base_equipamentos (user_id);

-- -----------------------------------------------------------------------------
-- Catálogos
-- -----------------------------------------------------------------------------
create table public.cadastro_servicos (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome               text not null check (length(trim(nome)) > 0),
  codigo             text,
  categoria          public.servico_categoria,
  tamanho_backup     text,
  localizacao_pastas text,
  valor              numeric(12,2) not null default 0 check (valor >= 0),
  tempo_medio_min    integer check (tempo_medio_min >= 0),
  tipo_equipamento   text,
  ativo              boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, user_id)
);
create index cadastro_servicos_user_idx on public.cadastro_servicos (user_id, nome);
create unique index cadastro_servicos_codigo_uidx on public.cadastro_servicos (user_id, codigo) where codigo is not null;

create table public.cadastro_produtos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome        text not null check (length(trim(nome)) > 0),
  codigo      text,
  valor_custo numeric(12,2) check (valor_custo >= 0),
  valor_venda numeric(12,2) not null default 0 check (valor_venda >= 0),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);
create index cadastro_produtos_user_idx on public.cadastro_produtos (user_id, nome);
create unique index cadastro_produtos_codigo_uidx on public.cadastro_produtos (user_id, codigo) where codigo is not null;

-- -----------------------------------------------------------------------------
-- Orçamentos (sem status nesta versão)
-- -----------------------------------------------------------------------------
create table public.base_orcamentos (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  numero                integer not null check (numero between 1 and 99999),
  cliente_id            uuid not null,
  relato                text,
  data                  date not null default current_date,
  cobrar_visita         boolean not null default false,
  valor_visita          numeric(12,2) not null default 0 check (valor_visita >= 0),
  despesas_ativas       boolean not null default false,
  despesa_deslocamento  numeric(12,2) not null default 0 check (despesa_deslocamento >= 0),
  despesa_alimentacao   numeric(12,2) not null default 0 check (despesa_alimentacao >= 0),
  despesa_insumos       numeric(12,2) not null default 0 check (despesa_insumos >= 0),
  despesa_outros        numeric(12,2) not null default 0 check (despesa_outros >= 0),
  valor_total           numeric(12,2) not null default 0 check (valor_total >= 0),
  valor_total_manual    boolean not null default false,
  observacoes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, numero),
  foreign key (cliente_id, user_id) references public.base_clientes (id, user_id) on delete restrict
);
create index base_orcamentos_cliente_idx on public.base_orcamentos (cliente_id);
create index base_orcamentos_user_data_idx on public.base_orcamentos (user_id, data desc);

create table public.orc_servicos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  orcamento_id   uuid not null,
  servico_id     uuid,
  descricao      text not null,
  quantidade     numeric(10,2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  equipamento_id uuid,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  foreign key (orcamento_id, user_id) references public.base_orcamentos (id, user_id) on delete cascade,
  foreign key (servico_id, user_id) references public.cadastro_servicos (id, user_id) on delete set null (servico_id),
  foreign key (equipamento_id, user_id) references public.base_equipamentos (id, user_id) on delete set null (equipamento_id)
);
create index orc_servicos_orcamento_idx on public.orc_servicos (orcamento_id);
create index orc_servicos_servico_idx on public.orc_servicos (servico_id);
create index orc_servicos_equipamento_idx on public.orc_servicos (equipamento_id);

create table public.orc_produtos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  orcamento_id   uuid not null,
  produto_id     uuid,
  descricao      text not null,
  quantidade     numeric(10,2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  equipamento_id uuid,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  foreign key (orcamento_id, user_id) references public.base_orcamentos (id, user_id) on delete cascade,
  foreign key (produto_id, user_id) references public.cadastro_produtos (id, user_id) on delete set null (produto_id),
  foreign key (equipamento_id, user_id) references public.base_equipamentos (id, user_id) on delete set null (equipamento_id)
);
create index orc_produtos_orcamento_idx on public.orc_produtos (orcamento_id);
create index orc_produtos_produto_idx on public.orc_produtos (produto_id);
create index orc_produtos_equipamento_idx on public.orc_produtos (equipamento_id);

-- -----------------------------------------------------------------------------
-- Atendimentos (OS)
-- -----------------------------------------------------------------------------
create table public.base_atendimentos (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  numero                integer not null check (numero between 1 and 99999),
  cliente_id            uuid not null,
  orcamento_id          uuid,
  relato                text,
  data_inicio           date not null default current_date,
  status                public.os_status not null default 'em_andamento',
  distancia_km          numeric(8,1) check (distancia_km >= 0),
  cobrar_visita         boolean not null default false,
  valor_visita          numeric(12,2) not null default 0 check (valor_visita >= 0),
  despesas_ativas       boolean not null default false,
  despesa_deslocamento  numeric(12,2) not null default 0 check (despesa_deslocamento >= 0),
  despesa_alimentacao   numeric(12,2) not null default 0 check (despesa_alimentacao >= 0),
  despesa_insumos       numeric(12,2) not null default 0 check (despesa_insumos >= 0),
  despesa_outros        numeric(12,2) not null default 0 check (despesa_outros >= 0),
  valor_total           numeric(12,2) not null default 0 check (valor_total >= 0),
  valor_total_manual    boolean not null default false,
  data_entrega          date,
  recebido              boolean not null default false,
  data_recebimento      date,
  valor_recebido        numeric(12,2) check (valor_recebido >= 0),
  finalizado_em         timestamptz,
  observacoes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, numero),
  unique (orcamento_id),
  foreign key (cliente_id, user_id) references public.base_clientes (id, user_id) on delete restrict,
  foreign key (orcamento_id, user_id) references public.base_orcamentos (id, user_id) on delete set null (orcamento_id)
);
create index base_atendimentos_cliente_idx on public.base_atendimentos (cliente_id);
create index base_atendimentos_user_status_idx on public.base_atendimentos (user_id, status);
create index base_atendimentos_user_data_idx on public.base_atendimentos (user_id, data_inicio desc);
create index base_atendimentos_receber_idx on public.base_atendimentos (data_recebimento)
  where status = 'aguardando_pagamento' and recebido;

create table public.os_visitas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  os_id        uuid not null,
  data         date not null default current_date,
  hora         time,
  duracao_min  integer check (duracao_min >= 0),
  ordem        integer not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (os_id, user_id) references public.base_atendimentos (id, user_id) on delete cascade
);
create index os_visitas_os_idx on public.os_visitas (os_id);
create index os_visitas_user_data_idx on public.os_visitas (user_id, data);

create table public.os_equipamentos (
  os_id          uuid not null,
  equipamento_id uuid not null,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (os_id, equipamento_id),
  foreign key (os_id, user_id) references public.base_atendimentos (id, user_id) on delete cascade,
  foreign key (equipamento_id, user_id) references public.base_equipamentos (id, user_id) on delete cascade
);
create index os_equipamentos_equipamento_idx on public.os_equipamentos (equipamento_id);

create table public.os_servicos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  os_id          uuid not null,
  servico_id     uuid,
  descricao      text not null,
  quantidade     numeric(10,2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  equipamento_id uuid,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  foreign key (os_id, user_id) references public.base_atendimentos (id, user_id) on delete cascade,
  foreign key (servico_id, user_id) references public.cadastro_servicos (id, user_id) on delete set null (servico_id),
  foreign key (equipamento_id, user_id) references public.base_equipamentos (id, user_id) on delete set null (equipamento_id)
);
create index os_servicos_os_idx on public.os_servicos (os_id);
create index os_servicos_servico_idx on public.os_servicos (servico_id);
create index os_servicos_equipamento_idx on public.os_servicos (equipamento_id);

create table public.os_produtos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  os_id          uuid not null,
  produto_id     uuid,
  descricao      text not null,
  quantidade     numeric(10,2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  equipamento_id uuid,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  foreign key (os_id, user_id) references public.base_atendimentos (id, user_id) on delete cascade,
  foreign key (produto_id, user_id) references public.cadastro_produtos (id, user_id) on delete set null (produto_id),
  foreign key (equipamento_id, user_id) references public.base_equipamentos (id, user_id) on delete set null (equipamento_id)
);
create index os_produtos_os_idx on public.os_produtos (os_id);
create index os_produtos_produto_idx on public.os_produtos (produto_id);
create index os_produtos_equipamento_idx on public.os_produtos (equipamento_id);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create trigger set_updated_at before update on public.meu_negocio
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.base_clientes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.base_equipamentos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cadastro_servicos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cadastro_produtos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.base_orcamentos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.base_atendimentos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Conta nova: cria Meu Negócio e a numeração
-- -----------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.meu_negocio (user_id, email) values (new.id, new.email)
    on conflict (user_id) do nothing;
  insert into public.numeracao (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Numeração automática de OS e orçamento
--   Número vazio  → usa o próximo e avança o contador.
--   Número digitado → aceita (se não repetir) e, se for maior, avança o contador.
-- -----------------------------------------------------------------------------
create function public.definir_numero_os()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  proximo integer;
begin
  insert into public.numeracao (user_id) values (new.user_id) on conflict (user_id) do nothing;

  if new.numero is null then
    update public.numeracao set proxima_os = proxima_os + 1
      where user_id = new.user_id
      returning proxima_os - 1 into proximo;
    new.numero := proximo;
  else
    update public.numeracao set proxima_os = greatest(proxima_os, new.numero + 1)
      where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create function public.definir_numero_orcamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  proximo integer;
begin
  insert into public.numeracao (user_id) values (new.user_id) on conflict (user_id) do nothing;

  if new.numero is null then
    update public.numeracao set proximo_orcamento = proximo_orcamento + 1
      where user_id = new.user_id
      returning proximo_orcamento - 1 into proximo;
    new.numero := proximo;
  else
    update public.numeracao set proximo_orcamento = greatest(proximo_orcamento, new.numero + 1)
      where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger definir_numero before insert on public.base_atendimentos
  for each row execute function public.definir_numero_os();
create trigger definir_numero before insert on public.base_orcamentos
  for each row execute function public.definir_numero_orcamento();

-- -----------------------------------------------------------------------------
-- Finalizar OS (regras confirmadas na Fase 1)
-- -----------------------------------------------------------------------------
create function public.finalizar_os(p_os_id uuid)
returns public.os_status
language plpgsql
security invoker
set search_path = ''
as $$
declare
  os public.base_atendimentos;
  novo public.os_status;
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into os from public.base_atendimentos where id = p_os_id for update;
  if not found then
    raise exception 'OS não encontrada';
  end if;

  if not os.recebido then
    novo := 'aguardando_pagamento';
  elsif os.data_recebimento is null or os.data_recebimento <= hoje then
    novo := 'finalizado';
  else
    novo := 'aguardando_pagamento';
  end if;

  update public.base_atendimentos
     set status        = novo,
         data_entrega  = coalesce(data_entrega, hoje),
         valor_recebido = case when recebido then coalesce(valor_recebido, valor_total) else valor_recebido end,
         finalizado_em = case when novo = 'finalizado' then now() else finalizado_em end
   where id = p_os_id;

  return novo;
end;
$$;

-- Recebimentos com data futura: viram Finalizado quando a data chega (roda todo dia)
create function public.baixar_recebimentos_do_dia()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  qtd integer;
begin
  update public.base_atendimentos
     set status = 'finalizado', finalizado_em = now()
   where status = 'aguardando_pagamento'
     and recebido
     and data_recebimento is not null
     and data_recebimento <= (now() at time zone 'America/Sao_Paulo')::date;
  get diagnostics qtd = row_count;
  return qtd;
end;
$$;

revoke execute on function public.baixar_recebimentos_do_dia() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Transformar orçamento em atendimento (uma vez por orçamento)
-- -----------------------------------------------------------------------------
create function public.transformar_orcamento_em_os(p_orcamento_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  orc public.base_orcamentos;
  nova_os uuid;
begin
  select * into orc from public.base_orcamentos where id = p_orcamento_id for update;
  if not found then
    raise exception 'Orçamento não encontrado';
  end if;

  if exists (select 1 from public.base_atendimentos where orcamento_id = p_orcamento_id) then
    raise exception 'Este orçamento já virou atendimento';
  end if;

  insert into public.base_atendimentos (
    user_id, cliente_id, orcamento_id, relato, cobrar_visita, valor_visita,
    despesas_ativas, despesa_deslocamento, despesa_alimentacao, despesa_insumos, despesa_outros,
    valor_total, valor_total_manual, observacoes
  ) values (
    orc.user_id, orc.cliente_id, orc.id, orc.relato, orc.cobrar_visita, orc.valor_visita,
    orc.despesas_ativas, orc.despesa_deslocamento, orc.despesa_alimentacao, orc.despesa_insumos, orc.despesa_outros,
    orc.valor_total, orc.valor_total_manual, orc.observacoes
  ) returning id into nova_os;

  insert into public.os_servicos (user_id, os_id, servico_id, descricao, quantidade, valor_unitario, equipamento_id, ordem)
    select user_id, nova_os, servico_id, descricao, quantidade, valor_unitario, equipamento_id, ordem
      from public.orc_servicos where orcamento_id = p_orcamento_id;

  insert into public.os_produtos (user_id, os_id, produto_id, descricao, quantidade, valor_unitario, equipamento_id, ordem)
    select user_id, nova_os, produto_id, descricao, quantidade, valor_unitario, equipamento_id, ordem
      from public.orc_produtos where orcamento_id = p_orcamento_id;

  -- Equipamentos citados nos itens passam a fazer parte da OS
  insert into public.os_equipamentos (os_id, equipamento_id, user_id)
    select distinct nova_os, equipamento_id, orc.user_id
      from (
        select equipamento_id from public.orc_servicos where orcamento_id = p_orcamento_id
        union
        select equipamento_id from public.orc_produtos where orcamento_id = p_orcamento_id
      ) e
     where equipamento_id is not null;

  -- Primeira visita técnica, hoje
  insert into public.os_visitas (user_id, os_id) values (orc.user_id, nova_os);

  return nova_os;
end;
$$;

-- -----------------------------------------------------------------------------
-- Clientes com o nº de serviços prestados (calculado, nunca salvo)
-- -----------------------------------------------------------------------------
create view public.clientes_resumo
with (security_invoker = true)
as
select
  c.*,
  (select count(*) from public.base_atendimentos a where a.cliente_id = c.id)::integer as servicos_prestados,
  (select max(a.data_inicio) from public.base_atendimentos a where a.cliente_id = c.id) as ultimo_atendimento
from public.base_clientes c;

-- -----------------------------------------------------------------------------
-- Regras de acesso (RLS): cada técnico só lê e altera o que é seu
-- -----------------------------------------------------------------------------
alter table public.meu_negocio       enable row level security;
alter table public.numeracao         enable row level security;
alter table public.base_clientes     enable row level security;
alter table public.base_equipamentos enable row level security;
alter table public.cadastro_servicos enable row level security;
alter table public.cadastro_produtos enable row level security;
alter table public.base_orcamentos   enable row level security;
alter table public.orc_servicos      enable row level security;
alter table public.orc_produtos      enable row level security;
alter table public.base_atendimentos enable row level security;
alter table public.os_visitas        enable row level security;
alter table public.os_equipamentos   enable row level security;
alter table public.os_servicos       enable row level security;
alter table public.os_produtos       enable row level security;

-- Meu Negócio e numeração: ler e editar a própria linha (criadas pelo cadastro)
create policy "dono le" on public.meu_negocio for select to authenticated
  using (user_id = (select auth.uid()));
create policy "dono edita" on public.meu_negocio for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "dono le" on public.numeracao for select to authenticated
  using (user_id = (select auth.uid()));
create policy "dono edita" on public.numeracao for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Demais tabelas: acesso completo às próprias linhas
do $$
declare
  t text;
begin
  foreach t in array array[
    'base_clientes', 'base_equipamentos', 'cadastro_servicos', 'cadastro_produtos',
    'base_orcamentos', 'orc_servicos', 'orc_produtos',
    'base_atendimentos', 'os_visitas', 'os_equipamentos', 'os_servicos', 'os_produtos'
  ] loop
    execute format(
      'create policy "dono acessa" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- Visitantes sem login não acessam nada
revoke all on all tables in schema public from anon;
revoke execute on function public.finalizar_os(uuid) from public, anon;
revoke execute on function public.transformar_orcamento_em_os(uuid) from public, anon;
grant execute on function public.finalizar_os(uuid) to authenticated;
grant execute on function public.transformar_orcamento_em_os(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Tarefa diária: 00:05 no horário de Brasília (03:05 UTC)
-- -----------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'baixar-recebimentos-do-dia',
  '5 3 * * *',
  $$select public.baixar_recebimentos_do_dia()$$
);
