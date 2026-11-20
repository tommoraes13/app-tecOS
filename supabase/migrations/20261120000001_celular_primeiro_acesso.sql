-- =============================================================================
-- Novembro/2026: celular da conta e primeiro acesso guiado.
-- =============================================================================

-- 1. Celular da conta (pessoal, para contato e recuperação). O telefone de
--    Meu Negócio continua sendo o que sai nas OS e nas mensagens aos clientes.
alter table public.perfil
  add column telefone text,
  add column primeiro_acesso_pendente boolean not null default false;

-- 2. Toda conta nova (convite) começa com o primeiro acesso pendente: ao entrar,
--    o app abre o passo a passo (dados, senha, negócio, endereço, preços).
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
    nullif(left(trim(meta ->> 'telefone_negocio'), 30), '')
  )
  on conflict (user_id) do nothing;
  insert into public.numeracao (user_id) values (new.id)
    on conflict (user_id) do nothing;
  insert into public.perfil (user_id, nome_exibicao, telefone, primeiro_acesso_pendente)
  values (
    new.id,
    nullif(left(trim(meta ->> 'nome'), 120), ''),
    nullif(left(trim(meta ->> 'telefone'), 30), ''),
    true
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
