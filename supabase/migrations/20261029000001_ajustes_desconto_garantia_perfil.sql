-- =============================================================================
-- Ajustes de 29/10/2026
-- 1. Desconto (R$ ou %), frete e garantia na OS e no orçamento
-- 2. Garantia padrão em Meu Negócio
-- 3. Perfil da conta: nome de exibição, foto, idioma, moeda e fuso
-- 4. Pasta de fotos de perfil (Storage)
-- 5. "Transformar em atendimento" passa a copiar desconto, frete e garantia
-- =============================================================================

-- 1. OS e orçamento -------------------------------------------------------------
alter table public.base_atendimentos
  add column desconto_tipo  text not null default 'valor' check (desconto_tipo in ('valor', 'percentual')),
  add column desconto_valor numeric(12,2) not null default 0 check (desconto_valor >= 0),
  add column despesa_frete  numeric(12,2) not null default 0 check (despesa_frete >= 0),
  add column garantia_meses integer check (garantia_meses between 0 and 120);

alter table public.base_orcamentos
  add column desconto_tipo  text not null default 'valor' check (desconto_tipo in ('valor', 'percentual')),
  add column desconto_valor numeric(12,2) not null default 0 check (desconto_valor >= 0),
  add column despesa_frete  numeric(12,2) not null default 0 check (despesa_frete >= 0),
  add column garantia_meses integer check (garantia_meses between 0 and 120);

-- 2. Garantia padrão ---------------------------------------------------------------
alter table public.meu_negocio
  add column garantia_meses_padrao integer not null default 3 check (garantia_meses_padrao between 0 and 120);

-- 3. Perfil da conta --------------------------------------------------------------
create table public.perfil (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  nome_exibicao text,
  foto_path     text,
  idioma        text not null default 'pt-BR' check (idioma in ('pt-BR', 'en', 'es')),
  moeda         text not null default 'BRL' check (moeda in ('BRL', 'USD', 'EUR')),
  fuso          text not null default 'America/Sao_Paulo',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_updated_at before update on public.perfil
  for each row execute function public.set_updated_at();

alter table public.perfil enable row level security;

create policy "dono le" on public.perfil for select to authenticated
  using (user_id = (select auth.uid()));
create policy "dono edita" on public.perfil for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.perfil from anon;

-- Perfil para quem já tem conta
insert into public.perfil (user_id)
  select id from auth.users
  on conflict (user_id) do nothing;

-- Conta nova também ganha perfil
create or replace function public.handle_new_user()
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
  insert into public.perfil (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. Fotos de perfil ----------------------------------------------------------------
-- Pasta pública para exibir a foto; cada técnico só envia e apaga arquivos na própria pasta (<id>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatar: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatar: dono atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatar: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 5. Transformar orçamento em atendimento ------------------------------------------
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
    user_id, cliente_id, orcamento_id, relato, cobrar_visita, valor_visita,
    despesas_ativas, despesa_deslocamento, despesa_alimentacao, despesa_insumos, despesa_outros, despesa_frete,
    desconto_tipo, desconto_valor, garantia_meses,
    valor_total, valor_total_manual, observacoes
  ) values (
    orc.user_id, orc.cliente_id, orc.id, orc.relato, orc.cobrar_visita, orc.valor_visita,
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
