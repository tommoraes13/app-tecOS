-- =============================================================================
-- Ajustes apontados pelo verificador do Supabase após o esquema inicial
-- 1. Funções internas (gatilhos) não podem ser chamadas pela API
-- 2. Índices que cobrem as chaves compostas (id + user_id)
-- =============================================================================

-- 1. Funções de gatilho: só o próprio banco usa
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.definir_numero_os() from public, anon, authenticated;
revoke execute on function public.definir_numero_orcamento() from public, anon, authenticated;

-- 2. Índices compostos
drop index if exists public.base_equipamentos_cliente_idx;
create index base_equipamentos_cliente_idx on public.base_equipamentos (cliente_id, user_id);

drop index if exists public.base_orcamentos_cliente_idx;
create index base_orcamentos_cliente_idx on public.base_orcamentos (cliente_id, user_id);

drop index if exists public.base_atendimentos_cliente_idx;
create index base_atendimentos_cliente_idx on public.base_atendimentos (cliente_id, user_id);
create index base_atendimentos_orcamento_idx on public.base_atendimentos (orcamento_id, user_id);

drop index if exists public.orc_servicos_orcamento_idx;
drop index if exists public.orc_servicos_servico_idx;
drop index if exists public.orc_servicos_equipamento_idx;
create index orc_servicos_orcamento_idx on public.orc_servicos (orcamento_id, user_id);
create index orc_servicos_servico_idx on public.orc_servicos (servico_id, user_id);
create index orc_servicos_equipamento_idx on public.orc_servicos (equipamento_id, user_id);
create index orc_servicos_user_idx on public.orc_servicos (user_id);

drop index if exists public.orc_produtos_orcamento_idx;
drop index if exists public.orc_produtos_produto_idx;
drop index if exists public.orc_produtos_equipamento_idx;
create index orc_produtos_orcamento_idx on public.orc_produtos (orcamento_id, user_id);
create index orc_produtos_produto_idx on public.orc_produtos (produto_id, user_id);
create index orc_produtos_equipamento_idx on public.orc_produtos (equipamento_id, user_id);
create index orc_produtos_user_idx on public.orc_produtos (user_id);

drop index if exists public.os_visitas_os_idx;
create index os_visitas_os_idx on public.os_visitas (os_id, user_id);

drop index if exists public.os_equipamentos_equipamento_idx;
create index os_equipamentos_equipamento_idx on public.os_equipamentos (equipamento_id, user_id);
create index os_equipamentos_os_idx on public.os_equipamentos (os_id, user_id);
create index os_equipamentos_user_idx on public.os_equipamentos (user_id);

drop index if exists public.os_servicos_os_idx;
drop index if exists public.os_servicos_servico_idx;
drop index if exists public.os_servicos_equipamento_idx;
create index os_servicos_os_idx on public.os_servicos (os_id, user_id);
create index os_servicos_servico_idx on public.os_servicos (servico_id, user_id);
create index os_servicos_equipamento_idx on public.os_servicos (equipamento_id, user_id);
create index os_servicos_user_idx on public.os_servicos (user_id);

drop index if exists public.os_produtos_os_idx;
drop index if exists public.os_produtos_produto_idx;
drop index if exists public.os_produtos_equipamento_idx;
create index os_produtos_os_idx on public.os_produtos (os_id, user_id);
create index os_produtos_produto_idx on public.os_produtos (produto_id, user_id);
create index os_produtos_equipamento_idx on public.os_produtos (equipamento_id, user_id);
create index os_produtos_user_idx on public.os_produtos (user_id);
