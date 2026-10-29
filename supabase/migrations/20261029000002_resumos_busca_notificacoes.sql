-- =============================================================================
-- Velocidade, busca, notificações e regra "Finalizado = recebido"
--
-- 1. Lista de OS pronta no banco (os_lista): cliente, serviços e texto de busca
--    já juntos, para a tela Serviços Prestados buscar só a página que aparece.
-- 2. Resumos calculados no banco (Dashboard e Clientes), em vez de baixar todas as OS.
-- 3. Busca geral da barra superior e busca de clientes no formulário (sem acento).
-- 4. Lembretes do sino: visitas próximas e pagamentos aguardando.
-- 5. OS marcada como Finalizado passa a contar como recebida naquela data.
--
-- Todas as funções rodam com as permissões de quem chama (RLS vale normalmente):
-- cada técnico só enxerga os próprios dados.
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- Texto sem acento e minúsculo, para buscas tolerantes ("joao" acha "João").
create or replace function public.sem_acento(t text)
returns text
language sql
stable
set search_path = ''
as $$ select lower(extensions.unaccent(coalesce(t, ''))) $$;

-- -----------------------------------------------------------------------------
-- 1. Lista de OS
-- -----------------------------------------------------------------------------
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

-- Quantas OS há em cada status, com os mesmos filtros da tela (para os números das abas).
create or replace function public.os_contagens(
  p_busca text default null,
  p_numero integer default null,
  p_de date default null,
  p_ate date default null,
  p_categoria text default null
)
returns table (status public.os_status, qtd integer)
language sql
stable
set search_path = ''
as $$
  select l.status, count(*)::integer
  from public.os_lista l
  where (p_de is null or l.data_inicio >= p_de)
    and (p_ate is null or l.data_inicio <= p_ate)
    and (p_categoria is null or p_categoria = any (l.categorias))
    and (
      coalesce(p_busca, '') = ''
      or l.busca like '%' || public.sem_acento(p_busca) || '%'
      or (p_numero is not null and l.numero = p_numero)
    )
  group by l.status
$$;

-- -----------------------------------------------------------------------------
-- 2. Resumos
-- -----------------------------------------------------------------------------

-- Números do Dashboard para um período e o período anterior de mesmo tamanho.
-- Regras iguais às da tela: "realizados" = finalizadas ou aguardando pagamento entregues no período;
-- "recebido" = dinheiro que já entrou (data do recebimento, ou entrega, ou início) até hoje.
create or replace function public.dashboard_resumo(
  p_inicio date,
  p_fim date,
  p_ant_inicio date,
  p_ant_fim date,
  p_semanal boolean default false
)
returns json
language sql
stable
set search_path = ''
as $$
  with os as (
    select
      status,
      data_entrega,
      valor_total,
      recebido,
      coalesce(valor_recebido, valor_total) as valor_rec,
      coalesce(data_recebimento, data_entrega, data_inicio) as data_rec
    from public.base_atendimentos
  ),
  barras as (
    select d::date as inicio,
           least((d + case when p_semanal then interval '6 days' else interval '0 days' end)::date, p_fim) as fim
    from generate_series(p_inicio::timestamp, p_fim::timestamp,
                         case when p_semanal then interval '7 days' else interval '1 day' end) d
  )
  select json_build_object(
    'realizados', (select count(*) from os where status in ('finalizado', 'aguardando_pagamento') and data_entrega between p_inicio and p_fim),
    'realizadosAntes', (select count(*) from os where status in ('finalizado', 'aguardando_pagamento') and data_entrega between p_ant_inicio and p_ant_fim),
    'recebido', (select coalesce(sum(valor_rec), 0) from os where recebido and data_rec <= p_fim and data_rec between p_inicio and p_fim),
    'recebidoAntes', (select coalesce(sum(valor_rec), 0) from os where recebido and data_rec <= p_fim and data_rec between p_ant_inicio and p_ant_fim),
    'aReceber', (
      select coalesce(sum(
        case
          when recebido and data_rec > p_fim then valor_rec
          when recebido then greatest(0, valor_total - valor_rec)
          else valor_total
        end), 0)
      from os where status = 'aguardando_pagamento'
    ),
    'aReceberQtd', (select count(*) from os where status = 'aguardando_pagamento'),
    'emAberto', (select count(*) from os where status in ('em_andamento', 'pendente', 'retorno')),
    'pendentes', (select count(*) from os where status = 'pendente'),
    'barras', (
      select coalesce(json_agg(json_build_object(
        'inicio', b.inicio,
        'fim', b.fim,
        'valor', (select coalesce(sum(valor_rec), 0) from os
                  where recebido and data_rec <= p_fim and data_rec between b.inicio and b.fim)
      ) order by b.inicio), '[]'::json)
      from barras b
    )
  )
$$;

-- Clientes que mais contrataram: soma das OS, quantidade e último serviço.
create or replace function public.melhores_clientes(p_limite integer default 5)
returns table (id uuid, nome text, total numeric, qtd integer, ultimo date)
language sql
stable
set search_path = ''
as $$
  select c.id, c.nome, sum(a.valor_total), count(*)::integer, max(a.data_inicio)
  from public.base_atendimentos a
  join public.base_clientes c on c.id = a.cliente_id
  group by c.id, c.nome
  order by sum(a.valor_total) desc
  limit p_limite
$$;

-- Faixa de resumo da tela Clientes.
create or replace function public.clientes_resumo_geral(p_hoje date)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'valorMedio', (select coalesce(avg(valor_total), 0) from public.base_atendimentos),
    'emGarantia', (
      select coalesce(json_agg(distinct cliente_id), '[]'::json)
      from public.base_atendimentos
      where cliente_id is not null and data_entrega is not null and coalesce(garantia_meses, 0) > 0
        and (data_entrega + make_interval(months => garantia_meses))::date >= p_hoje
    ),
    'orcamentos', (select count(*) from public.base_orcamentos),
    'aceitos', (select count(*) from public.base_atendimentos where orcamento_id is not null)
  )
$$;

-- -----------------------------------------------------------------------------
-- 3. Buscas
-- -----------------------------------------------------------------------------

-- Busca geral da barra superior: até 5 de cada tipo.
create or replace function public.buscar_tudo(p_q text)
returns json
language sql
stable
set search_path = ''
as $$
  with q as (
    select public.sem_acento(trim(p_q)) as termo,
           nullif(regexp_replace(p_q, '\D', '', 'g'), '') as digitos
  )
  select json_build_object(
    'clientes', (
      select coalesce(json_agg(x), '[]'::json) from (
        select c.id, c.nome, c.telefone, c.cidade
        from public.base_clientes c, q
        where public.sem_acento(c.nome) like '%' || q.termo || '%'
           or (length(q.digitos) >= 3 and c.telefone like '%' || q.digitos || '%')
        order by c.nome limit 5
      ) x
    ),
    'os', (
      select coalesce(json_agg(x), '[]'::json) from (
        select l.id, l.numero, l.status, l.cliente, l.valor_total
        from public.os_lista l, q
        where l.busca like '%' || q.termo || '%'
           or (q.digitos is not null and length(q.digitos) <= 5 and l.numero = q.digitos::integer)
        order by l.data_inicio desc, l.numero desc limit 5
      ) x
    ),
    'orcamentos', (
      select coalesce(json_agg(x), '[]'::json) from (
        select o.id, o.numero, c.nome as cliente, o.valor_total
        from public.base_orcamentos o
        left join public.base_clientes c on c.id = o.cliente_id, q
        where public.sem_acento(concat_ws(' ', c.nome, o.relato)) like '%' || q.termo || '%'
           or (q.digitos is not null and length(q.digitos) <= 5 and o.numero = q.digitos::integer)
        order by o.data desc, o.numero desc limit 5
      ) x
    ),
    'servicos', (
      select coalesce(json_agg(x), '[]'::json) from (
        select s.id, s.nome, s.codigo, s.valor
        from public.cadastro_servicos s, q
        where public.sem_acento(concat_ws(' ', s.nome, s.codigo)) like '%' || q.termo || '%'
        order by s.nome limit 5
      ) x
    ),
    'produtos', (
      select coalesce(json_agg(x), '[]'::json) from (
        select p.id, p.nome, p.codigo, p.valor_venda
        from public.cadastro_produtos p, q
        where public.sem_acento(concat_ws(' ', p.nome, p.codigo)) like '%' || q.termo || '%'
        order by p.nome limit 5
      ) x
    )
  )
$$;

-- Busca de clientes no formulário da OS e do orçamento (conforme você digita).
create or replace function public.buscar_clientes(p_q text, p_limite integer default 20)
returns table (id uuid, nome text, telefone text, bairro text, cidade text)
language sql
stable
set search_path = ''
as $$
  select c.id, c.nome, c.telefone, c.bairro, c.cidade
  from public.base_clientes c
  where coalesce(trim(p_q), '') = ''
     or public.sem_acento(c.nome) like '%' || public.sem_acento(trim(p_q)) || '%'
     or (length(regexp_replace(p_q, '\D', '', 'g')) >= 3
         and c.telefone like '%' || regexp_replace(p_q, '\D', '', 'g') || '%')
  order by c.nome
  limit p_limite
$$;

-- -----------------------------------------------------------------------------
-- 4. Lembretes do sino
-- -----------------------------------------------------------------------------
create or replace function public.notificacoes(p_hoje date)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'visitas', (
      select coalesce(json_agg(x), '[]'::json) from (
        select v.os_id, v.data, to_char(v.hora, 'HH24:MI') as hora, a.numero, c.nome as cliente
        from public.os_visitas v
        join public.base_atendimentos a on a.id = v.os_id
        left join public.base_clientes c on c.id = a.cliente_id
        where v.data between p_hoje and p_hoje + 2
          and a.status not in ('finalizado', 'aguardando_pagamento')
        order by v.data, v.hora nulls last limit 10
      ) x
    ),
    'pagamentos', (
      select coalesce(json_agg(x), '[]'::json) from (
        select a.id as os_id, a.numero, c.nome as cliente, a.valor_total,
               case when a.recebido then a.data_recebimento end as previsto
        from public.base_atendimentos a
        left join public.base_clientes c on c.id = a.cliente_id
        where a.status = 'aguardando_pagamento'
        order by coalesce(case when a.recebido then a.data_recebimento end, a.data_entrega, a.data_inicio) limit 10
      ) x
    ),
    'pagamentosQtd', (select count(*) from public.base_atendimentos where status = 'aguardando_pagamento')
  )
$$;

-- -----------------------------------------------------------------------------
-- 5. Finalizado = recebido
-- Ao marcar a OS como Finalizado, ela passa a constar como recebida: valor total
-- (se nada foi informado) e data de hoje (se não havia data ou se era futura).
-- -----------------------------------------------------------------------------
create or replace function public.finalizado_marca_recebido()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if new.status = 'finalizado' and (tg_op = 'INSERT' or old.status is distinct from 'finalizado') then
    if not new.recebido then
      new.recebido := true;
      new.valor_recebido := coalesce(new.valor_recebido, new.valor_total);
      new.data_recebimento := case when new.data_recebimento is null or new.data_recebimento > hoje then hoje else new.data_recebimento end;
    end if;
    new.data_entrega := coalesce(new.data_entrega, hoje);
    new.finalizado_em := coalesce(new.finalizado_em, now());
  end if;
  return new;
end;
$$;

drop trigger if exists finalizado_marca_recebido on public.base_atendimentos;
create trigger finalizado_marca_recebido
  before insert or update on public.base_atendimentos
  for each row execute function public.finalizado_marca_recebido();

-- OS que já estão como Finalizado sem recebimento: passam a recebidas na data de entrega (ou de início).
update public.base_atendimentos
   set recebido = true,
       valor_recebido = coalesce(valor_recebido, valor_total),
       data_recebimento = coalesce(data_recebimento, data_entrega, data_inicio)
 where status = 'finalizado' and not recebido;

-- -----------------------------------------------------------------------------
-- Permissões: só quem está logado usa as funções
-- -----------------------------------------------------------------------------
revoke execute on function public.sem_acento(text) from public, anon;
revoke execute on function public.os_contagens(text, integer, date, date, text) from public, anon;
revoke execute on function public.dashboard_resumo(date, date, date, date, boolean) from public, anon;
revoke execute on function public.melhores_clientes(integer) from public, anon;
revoke execute on function public.clientes_resumo_geral(date) from public, anon;
revoke execute on function public.buscar_tudo(text) from public, anon;
revoke execute on function public.buscar_clientes(text, integer) from public, anon;
revoke execute on function public.notificacoes(date) from public, anon;
revoke execute on function public.finalizado_marca_recebido() from public, anon, authenticated;

grant execute on function public.sem_acento(text) to authenticated;
grant execute on function public.os_contagens(text, integer, date, date, text) to authenticated;
grant execute on function public.dashboard_resumo(date, date, date, date, boolean) to authenticated;
grant execute on function public.melhores_clientes(integer) to authenticated;
grant execute on function public.clientes_resumo_geral(date) to authenticated;
grant execute on function public.buscar_tudo(text) to authenticated;
grant execute on function public.buscar_clientes(text, integer) to authenticated;
grant execute on function public.notificacoes(date) to authenticated;
