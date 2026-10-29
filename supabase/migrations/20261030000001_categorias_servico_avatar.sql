-- =============================================================================
-- Novas categorias de serviço e foto de perfil mais leve
--
-- 1. "Tipo de serviço" passa a ter 7 opções:
--      Manutenção, Diagnóstico/Revisão, Montagem, Configuração,
--      Backup e Recuperação, Consultoria, Outros
--    Os serviços já cadastrados são convertidos assim:
--      manutencao_corretiva  -> manutencao
--      manutencao_preventiva -> diagnostico_revisao
--      montagem_pc           -> montagem
--      redes_impressoras     -> configuracao
--      backup_recuperacao, consultoria, outros: continuam iguais
-- 2. Foto de perfil: limite de 512 KB por arquivo (o app já reduz a foto antes de enviar).
-- =============================================================================

-- A lista de OS usa a categoria; sai e volta igual depois da troca.
drop view if exists public.os_lista;

create type public.servico_categoria_nova as enum (
  'manutencao', 'diagnostico_revisao', 'montagem', 'configuracao', 'backup_recuperacao', 'consultoria', 'outros'
);

alter table public.cadastro_servicos
  alter column categoria type public.servico_categoria_nova
  using (
    case categoria::text
      when 'manutencao_corretiva' then 'manutencao'
      when 'manutencao_preventiva' then 'diagnostico_revisao'
      when 'montagem_pc' then 'montagem'
      when 'redes_impressoras' then 'configuracao'
      else categoria::text
    end
  )::public.servico_categoria_nova;

drop type public.servico_categoria;
alter type public.servico_categoria_nova rename to servico_categoria;

create or replace view public.os_lista
with (security_invoker = true)
as
select
  a.id,
  a.numero,
  a.status,
  a.data_inicio,
  a.data_entrega,
  a.valor_total,
  a.valor_recebido,
  a.recebido,
  a.data_recebimento,
  a.cliente_id,
  a.relato,
  a.created_at,
  c.nome      as cliente,
  c.telefone  as telefone,
  coalesce(s.descricoes, '{}'::text[]) as servicos,
  coalesce(s.categorias, '{}'::text[]) as categorias,
  public.sem_acento(concat_ws(' ', c.nome, a.relato, array_to_string(s.descricoes, ' '))) as busca
from public.base_atendimentos a
left join public.base_clientes c on c.id = a.cliente_id
left join lateral (
  select
    array_agg(i.descricao order by i.ordem) as descricoes,
    array_agg(distinct cs.categoria::text) filter (where cs.categoria is not null) as categorias
  from public.os_servicos i
  left join public.cadastro_servicos cs on cs.id = i.servico_id
  where i.os_id = a.id
) s on true;

revoke all on public.os_lista from anon, public;
grant select on public.os_lista to authenticated;

-- Foto de perfil: até 512 KB, só JPG, PNG e WEBP.
update storage.buckets
   set file_size_limit = 524288,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'avatars';
