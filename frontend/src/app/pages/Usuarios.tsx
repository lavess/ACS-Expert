import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { UserPlus, Search, ChevronRight, ShieldCheck, Users, UserCog, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { usuariosService, type UsuarioAPI } from '@/services/usuariosService'
import type { Perfil } from '@/types'

const PERFIL_LABEL: Record<Perfil, string> = {
  acs: 'ACS',
  coordenador: 'Coordenador',
  gestor: 'Gestor',
}

const PERFIL_ICON: Record<Perfil, typeof Users> = {
  acs: Users,
  coordenador: UserCog,
  gestor: ShieldCheck,
}

const PERFIL_COLOR: Record<Perfil, string> = {
  acs: 'var(--acs-azul)',
  coordenador: '#7C3AED',
  gestor: '#059669',
}

export function Usuarios() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<Perfil | 'todos'>('todos')

  async function carregar() {
    try {
      setLoading(true)
      setErro(null)
      const { data } = await usuariosService.listar()
      setUsuarios(data)
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtrados = usuarios.filter((u) => {
    const matchBusca =
      !busca ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.matricula.includes(busca)
    const matchPerfil = filtroPerfil === 'todos' || u.perfil === filtroPerfil
    return matchBusca && matchPerfil
  })

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-6">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="pl-12 lg:pl-0">
            <h2 className="font-bold text-acs-ink font-display">Usuários</h2>
            <p className="text-xs text-acs-ink-3 mt-0.5">
              {loading ? 'Carregando…' : `${usuarios.length} cadastrados`}
            </p>
          </div>
          <button
            onClick={() => navigate('/novo-usuario')}
            className="flex items-center gap-2 bg-acs-azul text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-acs-azul-900 transition-colors"
          >
            <UserPlus size={16} />
            Novo usuário
          </button>
        </div>

        {/* Busca */}
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-acs-ink-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-acs-line bg-background text-sm text-acs-ink placeholder:text-acs-ink-3 focus:outline-none focus:ring-2 focus:ring-acs-azul"
          />
        </div>

        {/* Filtros de perfil */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {(['todos', 'acs', 'coordenador', 'gestor'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFiltroPerfil(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroPerfil === p
                  ? 'bg-acs-azul text-white'
                  : 'bg-white border border-acs-line text-acs-ink-3 hover:border-acs-azul hover:text-acs-azul'
              }`}
            >
              {p === 'todos' ? 'Todos' : PERFIL_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-6 py-4">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-acs-ink-3">
            <Loader2 size={28} className="animate-spin text-acs-azul" />
            <p className="text-sm">Carregando usuários…</p>
          </div>
        )}

        {/* Erro */}
        {!loading && erro && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-acs-vermelho-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-acs-vermelho" />
            </div>
            <p className="text-sm text-acs-ink-3 text-center">{erro}</p>
            <button
              onClick={carregar}
              className="flex items-center gap-2 text-sm text-acs-azul font-medium hover:underline"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista */}
        {!loading && !erro && (
          <div className="space-y-3">
            {filtrados.length === 0 && (
              <div className="text-center py-12 text-acs-ink-3 text-sm">
                Nenhum usuário encontrado.
              </div>
            )}
            {filtrados.map((u) => {
              const Icon = PERFIL_ICON[u.perfil]
              const cor  = PERFIL_COLOR[u.perfil]
              const iniciais = u.nome
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-acs-line p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow shadow-[0_1px_2px_rgba(10,20,40,.06)]"
                  onClick={() => navigate(`/usuario/${u.id}`)}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                    style={{ backgroundColor: cor }}
                  >
                    {iniciais}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-acs-ink text-sm truncate">{u.nome}</p>
                      {!u.ativo && (
                        <span className="text-[10px] bg-[#F1F5F9] text-acs-ink-3 px-2 py-0.5 rounded-full flex-shrink-0">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-acs-ink-3 mt-0.5">Mat. {u.matricula}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Icon size={12} style={{ color: cor }} />
                      <span className="text-xs font-medium" style={{ color: cor }}>
                        {PERFIL_LABEL[u.perfil]}
                      </span>
                      {u.microarea_nome && (
                        <>
                          <span className="text-acs-line">•</span>
                          <span className="text-xs text-acs-ink-3 truncate">{u.microarea_nome}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-acs-ink-3 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
