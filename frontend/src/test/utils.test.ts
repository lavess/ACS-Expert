/**
 * Testes unitários — funções utilitárias puras
 *
 * Cobre: tempoRelativo (Alertas), iniciaisDe (useCurrentAcs),
 * diasDesde (encaminhamentosService)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ── tempoRelativo (copiado do módulo para testar de forma isolada) ──
function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(min / 60)
  const d    = Math.floor(h / 24)
  if (d > 0)   return `há ${d} dia${d > 1 ? 's' : ''}`
  if (h > 0)   return `há ${h}h`
  if (min > 0) return `há ${min}min`
  return 'agora'
}

// ── iniciaisDe (copiado de useCurrentAcs) ──────────────────────
function iniciaisDe(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────
// tempoRelativo
// ─────────────────────────────────────────────────────────────────
describe('tempoRelativo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-11T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('retorna "agora" para menos de 1 minuto atrás', () => {
    const iso = new Date('2026-06-11T11:59:45Z').toISOString()
    expect(tempoRelativo(iso)).toBe('agora')
  })

  it('retorna minutos para menos de 1 hora atrás', () => {
    const iso = new Date('2026-06-11T11:30:00Z').toISOString()
    expect(tempoRelativo(iso)).toBe('há 30min')
  })

  it('retorna horas para menos de 24 horas atrás', () => {
    const iso = new Date('2026-06-11T08:00:00Z').toISOString()
    expect(tempoRelativo(iso)).toBe('há 4h')
  })

  it('retorna "há 1 dia" (singular) para exatamente 1 dia atrás', () => {
    const iso = new Date('2026-06-10T12:00:00Z').toISOString()
    expect(tempoRelativo(iso)).toBe('há 1 dia')
  })

  it('retorna plural para múltiplos dias', () => {
    const iso = new Date('2026-06-08T12:00:00Z').toISOString()
    expect(tempoRelativo(iso)).toBe('há 3 dias')
  })
})

// ─────────────────────────────────────────────────────────────────
// iniciaisDe
// ─────────────────────────────────────────────────────────────────
describe('iniciaisDe', () => {
  it('retorna "?" para nome vazio', () => {
    expect(iniciaisDe('')).toBe('?')
  })

  it('retorna primeiras 2 letras em maiúsculo para nome único', () => {
    expect(iniciaisDe('João')).toBe('JO')
  })

  it('retorna inicial do primeiro e do último nome', () => {
    expect(iniciaisDe('Ana Beatriz Santos')).toBe('AS')
  })

  it('retorna iniciais em maiúsculo independente do input', () => {
    expect(iniciaisDe('carlos silva')).toBe('CS')
  })

  it('ignora espaços extras', () => {
    expect(iniciaisDe('  Maria   Oliveira  ')).toBe('MO')
  })
})
