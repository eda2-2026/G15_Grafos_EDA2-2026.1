import { useEffect, useRef, useState } from 'react'

const ANIMATION_DURATION = 1100

// easeInOutCubic: arranca devagar, acelera no meio e desacelera no fim,
// dando a sensacao organica de uma rotacao "caindo" no lugar.
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Formato minimo de layout que o hook sabe animar. */
export type TreeLayoutLike<TNode> = {
  nodes: TNode[]
  edges: { from: number; to: number }[]
  width: number
  height: number
}

export type AnimatedTreeLayout<TNode> = {
  /** Nos com coordenadas interpoladas no frame atual. */
  nodes: TNode[]
  /** Valores que acabaram de entrar na arvore (para o efeito de surgimento). */
  enteringValues: Set<number>
  /** Verdadeiro enquanto os nos estao deslizando para a nova posicao. */
  isAnimating: boolean
}

/**
 * Recebe o layout final de uma arvore (AVL, rubro-negra, ...) e devolve um
 * layout cujas posicoes sao interpoladas a cada frame. Como cada no e
 * identificado pelo seu valor, uma rotacao se traduz no mesmo no mudando de
 * coordenada -- e e justamente esse deslocamento que animamos para tornar o
 * rebalanceamento visivel. Propriedades extras do no (cor, fator de
 * balanceamento, ...) sao preservadas via espalhamento.
 */
export function useAnimatedTreeLayout<TNode extends { value: number; x: number; y: number }>(
  layout: TreeLayoutLike<TNode>,
): AnimatedTreeLayout<TNode> {
  const [nodes, setNodes] = useState<TNode[]>(layout.nodes)
  const [enteringValues, setEnteringValues] = useState<Set<number>>(() => new Set())
  const [isAnimating, setIsAnimating] = useState(false)

  // Posicoes atualmente desenhadas na tela, indexadas pelo valor do no.
  const positionsRef = useRef(new Map<number, { x: number; y: number }>())
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const targets = layout.nodes
    const previousPositions = positionsRef.current

    const targetPositions = new Map(targets.map((node) => [node.value, { x: node.x, y: node.y }]))
    const entering = new Set(targets.filter((node) => !previousPositions.has(node.value)).map((node) => node.value))

    // De onde cada no parte: nos ja existentes saem da posicao anterior;
    // nos novos ja nascem no destino (eles ganham o efeito de surgimento).
    const starts = targets.map((node) => previousPositions.get(node.value) ?? { x: node.x, y: node.y })

    const hasMovement = targets.some((node, index) => {
      const start = starts[index]
      return Math.abs(start.x - node.x) > 0.5 || Math.abs(start.y - node.y) > 0.5
    })

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    setEnteringValues(entering)

    if (!hasMovement) {
      positionsRef.current = targetPositions
      setNodes(targets)
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / ANIMATION_DURATION, 1)
      const eased = easeInOutCubic(progress)

      setNodes(
        targets.map((node, index) => {
          const start = starts[index]
          return {
            ...node,
            x: start.x + (node.x - start.x) * eased,
            y: start.y + (node.y - start.y) * eased,
          }
        }),
      )

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      positionsRef.current = targetPositions
      frameRef.current = null
      setIsAnimating(false)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [layout])

  return { nodes, enteringValues, isAnimating }
}
