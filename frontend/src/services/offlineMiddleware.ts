/**
 * Middleware offline para chamadas de API.
 *
 * cachedGet      — GET com fallback para cache IndexedDB quando offline.
 * queuedMutation — POST/PUT/PATCH que enfileira quando offline e retorna
 *                  objeto otimista com offline_uuid.
 */
import api from './api'
import { cacheSet, cacheGet } from './offlineCache'
import { enqueue } from './offlineQueue'
import { v4 as uuid } from './uuid'

/** Verifica se o erro é de rede (sem resposta do servidor). */
function isNetworkError(err: unknown): boolean {
  return !!(
    err &&
    typeof err === 'object' &&
    'isAxiosError' in err &&
    (err as any).isAxiosError &&
    !(err as any).response
  )
}

/**
 * GET com cache automático.
 * - Online: chama API, salva resultado no cache, retorna.
 * - Offline ou falha de rede: devolve cache se existir; senão lança erro.
 */
export async function cachedGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const cacheKey =
    url +
    (params
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : '')

  if (navigator.onLine) {
    try {
      const { data } = await api.get<T>(url, { params })
      await cacheSet(cacheKey, data)
      return data
    } catch (err) {
      if (isNetworkError(err)) {
        const cached = await cacheGet<T>(cacheKey)
        if (cached !== null) return cached
      }
      throw err
    }
  } else {
    const cached = await cacheGet<T>(cacheKey)
    if (cached !== null) return cached
    throw new Error('Sem conexão e sem dados em cache para esta página.')
  }
}

/**
 * POST/PUT/PATCH com fila offline.
 * - Online: envia normalmente.
 * - Offline ou falha de rede: salva na fila, retorna objeto otimista.
 */
export async function queuedMutation<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  body: Record<string, unknown>,
  optimisticData?: Partial<T>
): Promise<{ data: T; queued: boolean }> {
  if (navigator.onLine) {
    try {
      const { data } = await api.request<T>({ method, url, data: body })
      return { data, queued: false }
    } catch (err) {
      if (isNetworkError(err)) {
        return saveToQueue<T>(method, url, body, optimisticData)
      }
      throw err
    }
  } else {
    return saveToQueue<T>(method, url, body, optimisticData)
  }
}

async function saveToQueue<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  body: Record<string, unknown>,
  optimisticData?: Partial<T>
): Promise<{ data: T; queued: boolean }> {
  const offlineUuid = uuid()
  await enqueue({ method, url, body: { ...body, offline_uuid: offlineUuid }, offlineUuid })
  return {
    data: { ...optimisticData, offline_uuid: offlineUuid, _offline: true } as unknown as T,
    queued: true,
  }
}
