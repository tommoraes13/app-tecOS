// Gerado a partir do banco do Supabase (TecOS-v1). Regerar quando o banco mudar.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      base_atendimentos: {
        Row: {
          cliente_id: string | null
          cobrar_visita: boolean
          created_at: string
          data_entrega: string | null
          data_inicio: string
          data_recebimento: string | null
          despesa_alimentacao: number
          despesa_deslocamento: number
          despesa_insumos: number
          despesa_outros: number
          despesas_ativas: boolean
          distancia_km: number | null
          finalizado_em: string | null
          id: string
          numero: number
          observacoes: string | null
          orcamento_id: string | null
          recebido: boolean
          relato: string | null
          status: Database["public"]["Enums"]["os_status"]
          updated_at: string
          user_id: string
          valor_recebido: number | null
          valor_total: number
          valor_total_manual: boolean
          valor_visita: number
          desconto_tipo: string
          desconto_valor: number
          despesa_frete: number
          garantia_meses: number | null
        }
        Insert: {
          cliente_id?: string | null
          cobrar_visita?: boolean
          created_at?: string
          data_entrega?: string | null
          data_inicio?: string
          data_recebimento?: string | null
          despesa_alimentacao?: number
          despesa_deslocamento?: number
          despesa_insumos?: number
          despesa_outros?: number
          despesas_ativas?: boolean
          distancia_km?: number | null
          finalizado_em?: string | null
          id?: string
          numero: number
          observacoes?: string | null
          orcamento_id?: string | null
          recebido?: boolean
          relato?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          user_id?: string
          valor_recebido?: number | null
          valor_total?: number
          valor_total_manual?: boolean
          valor_visita?: number
          desconto_tipo?: string
          desconto_valor?: number
          despesa_frete?: number
          garantia_meses?: number | null
        }
        Update: {
          cliente_id?: string | null
          cobrar_visita?: boolean
          created_at?: string
          data_entrega?: string | null
          data_inicio?: string
          data_recebimento?: string | null
          despesa_alimentacao?: number
          despesa_deslocamento?: number
          despesa_insumos?: number
          despesa_outros?: number
          despesas_ativas?: boolean
          distancia_km?: number | null
          finalizado_em?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          recebido?: boolean
          relato?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          user_id?: string
          valor_recebido?: number | null
          valor_total?: number
          valor_total_manual?: boolean
          valor_visita?: number
          desconto_tipo?: string
          desconto_valor?: number
          despesa_frete?: number
          garantia_meses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "base_atendimentos_cliente_id_user_id_fkey"
            columns: ["cliente_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_clientes"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "base_atendimentos_orcamento_id_user_id_fkey"
            columns: ["orcamento_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_orcamentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      base_clientes: {
        Row: {
          bairro: string | null
          canal: Database["public"]["Enums"]["cliente_canal"] | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          canal?: Database["public"]["Enums"]["cliente_canal"] | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          bairro?: string | null
          canal?: Database["public"]["Enums"]["cliente_canal"] | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      base_equipamentos: {
        Row: {
          cliente_id: string
          created_at: string
          especificacoes: Json
          estado_detalhe: string | null
          estado_geral: Database["public"]["Enums"]["equipamento_estado"] | null
          id: string
          nome: string
          senhas: Json
          tipo: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          especificacoes?: Json
          estado_detalhe?: string | null
          estado_geral?: Database["public"]["Enums"]["equipamento_estado"] | null
          id?: string
          nome: string
          senhas?: Json
          tipo: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          especificacoes?: Json
          estado_detalhe?: string | null
          estado_geral?: Database["public"]["Enums"]["equipamento_estado"] | null
          id?: string
          nome?: string
          senhas?: Json
          tipo?: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_equipamentos_cliente_id_user_id_fkey"
            columns: ["cliente_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_clientes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      base_orcamentos: {
        Row: {
          cliente_id: string | null
          cobrar_visita: boolean
          created_at: string
          data: string
          despesa_alimentacao: number
          despesa_deslocamento: number
          despesa_insumos: number
          despesa_outros: number
          despesas_ativas: boolean
          id: string
          numero: number
          observacoes: string | null
          relato: string | null
          updated_at: string
          user_id: string
          valor_total: number
          valor_total_manual: boolean
          valor_visita: number
          desconto_tipo: string
          desconto_valor: number
          despesa_frete: number
          garantia_meses: number | null
        }
        Insert: {
          cliente_id?: string | null
          cobrar_visita?: boolean
          created_at?: string
          data?: string
          despesa_alimentacao?: number
          despesa_deslocamento?: number
          despesa_insumos?: number
          despesa_outros?: number
          despesas_ativas?: boolean
          id?: string
          numero: number
          observacoes?: string | null
          relato?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number
          valor_total_manual?: boolean
          valor_visita?: number
          desconto_tipo?: string
          desconto_valor?: number
          despesa_frete?: number
          garantia_meses?: number | null
        }
        Update: {
          cliente_id?: string | null
          cobrar_visita?: boolean
          created_at?: string
          data?: string
          despesa_alimentacao?: number
          despesa_deslocamento?: number
          despesa_insumos?: number
          despesa_outros?: number
          despesas_ativas?: boolean
          id?: string
          numero?: number
          observacoes?: string | null
          relato?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number
          valor_total_manual?: boolean
          valor_visita?: number
          desconto_tipo?: string
          desconto_valor?: number
          despesa_frete?: number
          garantia_meses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "base_orcamentos_cliente_id_user_id_fkey"
            columns: ["cliente_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_clientes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      cadastro_produtos: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
          valor_custo: number | null
          valor_venda: number
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id?: string
          valor_custo?: number | null
          valor_venda?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valor_custo?: number | null
          valor_venda?: number
        }
        Relationships: []
      }
      cadastro_servicos: {
        Row: {
          ativo: boolean
          categoria: Database["public"]["Enums"]["servico_categoria"] | null
          codigo: string | null
          created_at: string
          id: string
          localizacao_pastas: string | null
          nome: string
          tamanho_backup: string | null
          tempo_medio_min: number | null
          tipo_equipamento: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["servico_categoria"] | null
          codigo?: string | null
          created_at?: string
          id?: string
          localizacao_pastas?: string | null
          nome: string
          tamanho_backup?: string | null
          tempo_medio_min?: number | null
          tipo_equipamento?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["servico_categoria"] | null
          codigo?: string | null
          created_at?: string
          id?: string
          localizacao_pastas?: string | null
          nome?: string
          tamanho_backup?: string | null
          tempo_medio_min?: number | null
          tipo_equipamento?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      meu_negocio: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cobrar_visita: boolean
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string
          duracao_visita_min: number
          email: string | null
          endereco: string | null
          estado: string | null
          logo_url: string | null
          nome_fantasia: string | null
          numero: string | null
          razao_social: string | null
          regiao_atendimento_km: number | null
          telefone: string | null
          tipo_precificacao: string | null
          updated_at: string
          user_id: string
          valor_km: number
          valor_visita: number
          garantia_meses_padrao: number
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cobrar_visita?: boolean
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          duracao_visita_min?: number
          email?: string | null
          endereco?: string | null
          estado?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string | null
          regiao_atendimento_km?: number | null
          telefone?: string | null
          tipo_precificacao?: string | null
          updated_at?: string
          user_id: string
          valor_km?: number
          valor_visita?: number
          garantia_meses_padrao?: number
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cobrar_visita?: boolean
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          duracao_visita_min?: number
          email?: string | null
          endereco?: string | null
          estado?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string | null
          regiao_atendimento_km?: number | null
          telefone?: string | null
          tipo_precificacao?: string | null
          updated_at?: string
          user_id?: string
          valor_km?: number
          valor_visita?: number
          garantia_meses_padrao?: number
        }
        Relationships: []
      }
      numeracao: {
        Row: {
          proxima_os: number
          proximo_orcamento: number
          user_id: string
        }
        Insert: {
          proxima_os?: number
          proximo_orcamento?: number
          user_id: string
        }
        Update: {
          proxima_os?: number
          proximo_orcamento?: number
          user_id?: string
        }
        Relationships: []
      }
      orc_produtos: {
        Row: {
          created_at: string
          descricao: string
          equipamento_id: string | null
          id: string
          orcamento_id: string
          ordem: number
          produto_id: string | null
          quantidade: number
          user_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          equipamento_id?: string | null
          id?: string
          orcamento_id: string
          ordem?: number
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          equipamento_id?: string | null
          id?: string
          orcamento_id?: string
          ordem?: number
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orc_produtos_orcamento_id_user_id_fkey"
            columns: ["orcamento_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_orcamentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      orc_servicos: {
        Row: {
          created_at: string
          descricao: string
          equipamento_id: string | null
          id: string
          orcamento_id: string
          ordem: number
          quantidade: number
          servico_id: string | null
          user_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          equipamento_id?: string | null
          id?: string
          orcamento_id: string
          ordem?: number
          quantidade?: number
          servico_id?: string | null
          user_id?: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          equipamento_id?: string | null
          id?: string
          orcamento_id?: string
          ordem?: number
          quantidade?: number
          servico_id?: string | null
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orc_servicos_orcamento_id_user_id_fkey"
            columns: ["orcamento_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_orcamentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      os_equipamentos: {
        Row: {
          created_at: string
          equipamento_id: string
          os_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipamento_id: string
          os_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          equipamento_id?: string
          os_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_equipamentos_equipamento_id_user_id_fkey"
            columns: ["equipamento_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_equipamentos"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "os_equipamentos_os_id_user_id_fkey"
            columns: ["os_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_atendimentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      os_produtos: {
        Row: {
          created_at: string
          descricao: string
          equipamento_id: string | null
          id: string
          ordem: number
          os_id: string
          produto_id: string | null
          quantidade: number
          user_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          equipamento_id?: string | null
          id?: string
          ordem?: number
          os_id: string
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          equipamento_id?: string | null
          id?: string
          ordem?: number
          os_id?: string
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_produtos_os_id_user_id_fkey"
            columns: ["os_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_atendimentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      os_servicos: {
        Row: {
          created_at: string
          descricao: string
          equipamento_id: string | null
          id: string
          ordem: number
          os_id: string
          quantidade: number
          servico_id: string | null
          user_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          equipamento_id?: string | null
          id?: string
          ordem?: number
          os_id: string
          quantidade?: number
          servico_id?: string | null
          user_id?: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          equipamento_id?: string | null
          id?: string
          ordem?: number
          os_id?: string
          quantidade?: number
          servico_id?: string | null
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_servicos_os_id_user_id_fkey"
            columns: ["os_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_atendimentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      os_visitas: {
        Row: {
          created_at: string
          data: string
          duracao_min: number | null
          hora: string | null
          id: string
          ordem: number
          os_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          duracao_min?: number | null
          hora?: string | null
          id?: string
          ordem?: number
          os_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          data?: string
          duracao_min?: number | null
          hora?: string | null
          id?: string
          ordem?: number
          os_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_visitas_os_id_user_id_fkey"
            columns: ["os_id", "user_id"]
            isOneToOne: false
            referencedRelation: "base_atendimentos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      perfil: {
        Row: {
          created_at: string
          foto_path: string | null
          fuso: string
          idioma: string
          moeda: string
          nome_exibicao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foto_path?: string | null
          fuso?: string
          idioma?: string
          moeda?: string
          nome_exibicao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          foto_path?: string | null
          fuso?: string
          idioma?: string
          moeda?: string
          nome_exibicao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      clientes_resumo: {
        Row: {
          bairro: string | null
          canal: Database["public"]["Enums"]["cliente_canal"] | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string | null
          nome: string | null
          numero: string | null
          observacoes: string | null
          servicos_prestados: number | null
          telefone: string | null
          ultimo_atendimento: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      baixar_recebimentos_do_dia: { Args: never; Returns: number }
      finalizar_os: {
        Args: { p_os_id: string }
        Returns: Database["public"]["Enums"]["os_status"]
      }
      transformar_orcamento_em_os: {
        Args: { p_orcamento_id: string }
        Returns: string
      }
    }
    Enums: {
      cliente_canal: "internet" | "indicacao" | "trafego_pago" | "redes_sociais" | "outro"
      equipamento_estado: "funcionando" | "defeito" | "parado"
      equipamento_tipo: "desktop" | "notebook" | "rede" | "impressora"
      os_status: "em_andamento" | "pendente" | "aguardando_pagamento" | "finalizado" | "retorno"
      servico_categoria:
        | "manutencao_corretiva"
        | "manutencao_preventiva"
        | "montagem_pc"
        | "backup_recuperacao"
        | "redes_impressoras"
        | "consultoria"
        | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> = (PublicSchema["Tables"] &
  PublicSchema["Views"])[T] extends { Row: infer R }
  ? R
  : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
