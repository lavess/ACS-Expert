import { useEffect } from 'react'

interface Options {
  /** Largura da zona de gesto a partir da borda esquerda (px). */
  edge?:        number
  /** Distância mínima de arrasto horizontal para considerar abertura (px). */
  threshold?:   number
  /** Se desbloqueado, o hook ignora gestos. */
  enabled?:     boolean
  onOpen:       () => void
}

/**
 * Detecta swipe horizontal a partir da borda esquerda da viewport e
 * dispara `onOpen` quando o usuário arrastar > threshold para a direita.
 * Usado para abrir o drawer mobile.
 */
export function useEdgeSwipe({
  edge = 20,
  threshold = 60,
  enabled = true,
  onOpen,
}: Options) {
  useEffect(() => {
    if (!enabled) return

    let startX:   number | null = null
    let startY:   number | null = null
    let tracking: boolean       = false

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      if (t.clientX <= edge) {
        startX   = t.clientX
        startY   = t.clientY
        tracking = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || startX == null || startY == null) return
      const t  = e.touches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      // Cancela se o gesto é mais vertical do que horizontal
      if (Math.abs(dy) > Math.abs(dx)) {
        tracking = false
        return
      }
      if (dx > threshold) {
        tracking = false
        onOpen()
      }
    }

    const onTouchEnd = () => {
      tracking = false
      startX = startY = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    window.addEventListener('touchcancel',onTouchEnd,   { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('touchcancel',onTouchEnd)
    }
  }, [edge, threshold, enabled, onOpen])
}
