-- =============================================================================
-- Novembro/2026: métodos de precificação, recebimento pelo status, sair após 24 h
-- e criação de conta completa.
-- =============================================================================

-- 1. Métodos de precificação ---------------------------------------------------
--   servico        = Valor do Serviço
--   servico_visita = Valor do Serviço + Visita Técnica
--   hora_visita    = Hora Técnica + Visita Técnica (horas = tempo médio dos serviços)
--   livre          = Livre (total digitado em cada atendimento)
alter table public.meu_negocio
  add column valor_hora numeric(12,2) not null default 0 check (valor_hora >= 0);

update public.meu_negocio
   set tipo_precificacao = case
         when tipo_precificacao = 'por_hora' then 'hora_visita'
         when cobrar_visita then 'servico_visita'
         else 'servico'
       end;

alter table public.meu_negocio
  alter column tipo_precificacao set default 'servico_visita',
  alter column tipo_precificacao set not null,
  add constraint meu_negocio_tipo_precificacao_check
    check (tipo_precificacao in ('servico', 'servico_visita', 'hora_visita', 'livre'));

-- Método usado em cada OS e orçamento (fica gravado mesmo se a configuração mudar depois).
alter table public.base_atendimentos
  add column precificacao text not null default 'servico_visita'
    check (precificacao in ('servico', 'servico_visita', 'hora_visita', 'livre'));
alter table public.base_orcamentos
  add column precificacao text not null default 'servico_visita'
    check (precificacao in ('servico', 'servico_visita', 'hora_visita', 'livre'));

update public.base_atendimentos
   set precificacao = case when valor_total_manual then 'livre' when cobrar_visita then 'servico_visita' else 'servico' end;
update public.base_orcamentos
   set precificacao = case when valor_total_manual then 'livre' when cobrar_visita then 'servico_visita' else 'servico' end;

-- 2. Recebimento decidido pelo status ------------------------------------------
-- Finalizado = recebido o valor total; qualquer outro status = não recebido.
-- Sem recebimento parcial e sem data futura.
create or replace function public.finalizado_marca_recebido()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if new.status = 'finalizado' then
    new.recebido := true;
    new.valor_recebido := new.valor_total;
    new.data_recebimento := case
      when new.data_recebimento is null or new.data_recebimento > hoje then hoje
      else new.data_recebimento
    end;
    new.data_entrega := coalesce(new.data_entrega, hoje);
    new.finalizado_em := coalesce(new.finalizado_em, now());
  else
    new.recebido := false;
    new.valor_recebido := null;
    new.data_recebimento := null;
    new.finalizado_em := null;
  end if;
  return new;
end;
$$;

-- Aplica a regra nas OS que já existem (as 2 finalizadas com recebimento parcial passam a constar como recebidas por inteiro).
update public.base_atendimentos set status = status;

-- A tarefa diária de "recebimento com data futura" deixa de existir.
select cron.unschedule('baixar-recebimentos-do-dia')
 where exists (select 1 from cron.job where jobname = 'baixar-recebimentos-do-dia');
drop function if exists public.baixar_recebimentos_do_dia();

-- 3. Sair sozinho depois de 24 h ------------------------------------------------
alter table public.perfil
  add column sair_apos_24h boolean not null default false;

-- 4. Criar conta completa: nome, nome do negócio e telefone vêm do cadastro ------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.meu_negocio (user_id, email, nome_fantasia, telefone)
  values (
    new.id,
    new.email,
    nullif(left(trim(meta ->> 'negocio'), 120), ''),
    nullif(left(trim(meta ->> 'telefone'), 30), '')
  )
  on conflict (user_id) do nothing;
  insert into public.numeracao (user_id) values (new.id)
    on conflict (user_id) do nothing;
  insert into public.perfil (user_id, nome_exibicao)
  values (new.id, nullif(left(trim(meta ->> 'nome'), 120), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 5. Transformar orçamento em atendimento: copia também o método de precificação --
create or replace function public.transformar_orcamento_em_os(p_orcamento_id uuid)
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
    user_id, cliente_id, orcamento_id, relato, cobrar_visita, valor_visita, precificacao,
    despesas_ativas, despesa_deslocamento, despesa_alimentacao, despesa_insumos, despesa_outros, despesa_frete,
    desconto_tipo, desconto_valor, garantia_meses,
    valor_total, valor_total_manual, observacoes
  ) values (
    orc.user_id, orc.cliente_id, orc.id, orc.relato, orc.cobrar_visita, orc.valor_visita, orc.precificacao,
    orc.despesas_ativas, orc.despesa_deslocamento, orc.despesa_alimentacao, orc.despesa_insumos, orc.despesa_outros, orc.despesa_frete,
    orc.desconto_tipo, orc.desconto_valor, orc.garantia_meses,
    orc.valor_total, orc.valor_total_manual, orc.observacoes
  ) returning id into nova_os;

  insert into public.os_servicos (user_id, os_id, servico_id, descricao, quantidade, valor_unitario, equipamento_id, ordem)
    select user_id, nova_os, servico_id, descricao, quantidade, valor_unitario, equipamento_id, ordem
      from public.orc_servicos where orcamento_id = p_orcamento_id;

  insert into public.os_produtos (user_id, os_id, produto_id, descricao, quantidade, valor_unitario, equipamento_id, ordem)
    select user_id, nova_os, produto_id, descricao, quantidade, valor_unitario, equipamento_id, ordem
      from public.orc_produtos where orcamento_id = p_orcamento_id;

  insert into public.os_equipamentos (os_id, equipamento_id, user_id)
    select distinct nova_os, equipamento_id, orc.user_id
      from (
        select equipamento_id from public.orc_servicos where orcamento_id = p_orcamento_id
        union
        select equipamento_id from public.orc_produtos where orcamento_id = p_orcamento_id
      ) e
     where equipamento_id is not null;

  insert into public.os_visitas (user_id, os_id) values (orc.user_id, nova_os);

  return nova_os;
end;
$$;
