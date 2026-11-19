-- =============================================================================
-- Novembro/2026: assinatura da empresa, assinatura do cliente na OS
-- e fim da opção "sair depois de 24 h" (troca por saída após 3 dias sem uso, feita no app).
-- =============================================================================

-- 1. Assinatura da empresa (Meu Negócio) e do cliente (em cada OS) -------------
alter table public.meu_negocio
  add column assinatura_path text;

alter table public.base_atendimentos
  add column assinatura_cliente_path text,
  add column assinatura_cliente_em timestamptz;

-- 2. Arquivos das assinaturas: pasta privada, só o dono lê e grava -------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assinaturas', 'assinaturas', false, 262144, array['image/png'])
on conflict (id) do nothing;

create policy "assinatura: dono le" on storage.objects for select to authenticated
  using (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assinatura: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assinatura: dono atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assinatura: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3. A opção "sair depois de 24 h" deixa de existir ------------------------------
alter table public.perfil
  drop column sair_apos_24h;

-- 4. Cadastro fechado: só entra quem foi convidado pelo painel do Supabase ------
-- Mesmo que a opção de cadastro aberto continue ligada no Supabase, o banco recusa
-- contas novas que não vieram de um convite.
create or replace function public.bloquear_cadastro_aberto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invited_at is null then
    raise exception 'Cadastro fechado: peça um convite.';
  end if;
  return new;
end;
$$;

revoke execute on function public.bloquear_cadastro_aberto() from public, anon, authenticated;

create trigger bloquear_cadastro_aberto
  before insert on auth.users
  for each row execute function public.bloquear_cadastro_aberto();
