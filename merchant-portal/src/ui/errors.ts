import { ApiError } from '../api'

export function toUserMessage(err: unknown, fallback: string) {
  // Network / CORS / server offline
  if (err instanceof TypeError) {
    const msg = String(err.message || '')
    if (msg.toLowerCase().includes('failed to fetch')) {
      return 'Não conseguimos ligar ao servidor agora. Se estiveres em desenvolvimento, confirma que o backend está ligado.'
    }
  }

  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return 'A tua sessão não está válida. Volta ao início e tenta novamente.'
    }

    if (String(err.message || '').startsWith('HTTP_')) {
      return 'O servidor respondeu com um erro temporário. Tenta novamente daqui a uns segundos.'
    }

    return String(err.message || fallback)
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as any).message || '')
    if (msg.toLowerCase().includes('failed to fetch')) {
      return 'Não conseguimos ligar ao servidor agora. Se estiveres em desenvolvimento, confirma que o backend está ligado.'
    }
    if (msg) return msg
  }

  return fallback
}
