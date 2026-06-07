export type RbColor = 'red' | 'black'

export type RbNode = {
  value: number
  color: RbColor
  left: RbNode | null
  right: RbNode | null
}

export type RbRotation = {
  direction: 'left' | 'right'
  pivotValue: number
}

export type RbInsertMeta = {
  inserted: boolean
  /** Quantas vezes o caso do "tio vermelho" disparou uma recoloracao. */
  recolorCount: number
  /** Rotacoes aplicadas, na ordem em que aconteceram. */
  rotations: RbRotation[]
  /** A raiz precisou ser repintada de preto ao final. */
  rootBlackened: boolean
  /** Nos que participaram do ajuste, para destacar na visualizacao. */
  highlightValues: number[]
}

export type RbCategory = 'recolor' | 'rotation' | 'double'

export type RbPreset = {
  id: string
  label: string
  description: string
  values: number[]
  category: RbCategory
}

export type RbLayoutNode = {
  value: number
  x: number
  y: number
  depth: number
  color: RbColor
}

export type RbLayoutEdge = {
  from: number
  to: number
}

export type RbLayout = {
  nodes: RbLayoutNode[]
  edges: RbLayoutEdge[]
  width: number
  height: number
}

export const RB_PRESETS: RbPreset[] = [
  {
    id: 'recolor',
    label: 'Caso recoloracao',
    description: 'O tio do novo no e vermelho, entao basta recolorir pai, tio e avo. Nenhuma rotacao acontece.',
    values: [10, 5, 15, 1],
    category: 'recolor',
  },
  {
    id: 'rotate-left',
    label: 'Caso rotacao a esquerda',
    description: 'Insercoes crescentes deixam dois vermelhos alinhados a direita e exigem rotacao simples a esquerda.',
    values: [10, 20, 30],
    category: 'rotation',
  },
  {
    id: 'rotate-right',
    label: 'Caso rotacao a direita',
    description: 'Insercoes decrescentes deixam dois vermelhos alinhados a esquerda e exigem rotacao simples a direita.',
    values: [30, 20, 10],
    category: 'rotation',
  },
  {
    id: 'rotate-double',
    label: 'Caso rotacao dupla',
    description: 'O novo no entra "em zigue-zague", exigindo uma rotacao para alinhar e outra para rebalancear.',
    values: [10, 30, 20],
    category: 'double',
  },
]

// --- Estrutura mutavel usada apenas durante a insercao ---
// A arvore exposta ao React permanece imutavel (RbNode), mas o algoritmo
// classico (CLRS) depende de ponteiros para o pai, entao trabalhamos sobre
// uma copia mutavel e devolvemos um novo snapshot imutavel no final.

type MutableNode = {
  value: number
  color: RbColor
  left: MutableNode | null
  right: MutableNode | null
  parent: MutableNode | null
}

type RotationContext = {
  root: MutableNode | null
}

function isRed(node: MutableNode | null): boolean {
  return node !== null && node.color === 'red'
}

function toMutable(node: RbNode | null, parent: MutableNode | null): MutableNode | null {
  if (!node) {
    return null
  }

  const mutable: MutableNode = {
    value: node.value,
    color: node.color,
    left: null,
    right: null,
    parent,
  }
  mutable.left = toMutable(node.left, mutable)
  mutable.right = toMutable(node.right, mutable)
  return mutable
}

function toImmutable(node: MutableNode | null): RbNode | null {
  if (!node) {
    return null
  }

  return {
    value: node.value,
    color: node.color,
    left: toImmutable(node.left),
    right: toImmutable(node.right),
  }
}

function rotateLeft(context: RotationContext, pivot: MutableNode) {
  const newRoot = pivot.right
  if (!newRoot) {
    return
  }

  pivot.right = newRoot.left
  if (newRoot.left) {
    newRoot.left.parent = pivot
  }

  newRoot.parent = pivot.parent
  if (!pivot.parent) {
    context.root = newRoot
  } else if (pivot === pivot.parent.left) {
    pivot.parent.left = newRoot
  } else {
    pivot.parent.right = newRoot
  }

  newRoot.left = pivot
  pivot.parent = newRoot
}

function rotateRight(context: RotationContext, pivot: MutableNode) {
  const newRoot = pivot.left
  if (!newRoot) {
    return
  }

  pivot.left = newRoot.right
  if (newRoot.right) {
    newRoot.right.parent = pivot
  }

  newRoot.parent = pivot.parent
  if (!pivot.parent) {
    context.root = newRoot
  } else if (pivot === pivot.parent.right) {
    pivot.parent.right = newRoot
  } else {
    pivot.parent.left = newRoot
  }

  newRoot.right = pivot
  pivot.parent = newRoot
}

function addHighlights(meta: RbInsertMeta, values: number[]) {
  for (const value of values) {
    if (!meta.highlightValues.includes(value)) {
      meta.highlightValues.push(value)
    }
  }
}

export function insertIntoRedBlack(root: RbNode | null, value: number) {
  const context: RotationContext = { root: toMutable(root, null) }
  const meta: RbInsertMeta = {
    inserted: false,
    recolorCount: 0,
    rotations: [],
    rootBlackened: false,
    highlightValues: [],
  }

  // Insercao binaria comum, com o novo no nascendo vermelho.
  let parent: MutableNode | null = null
  let current = context.root

  while (current) {
    parent = current
    if (value === current.value) {
      return { root: toImmutable(context.root), meta }
    }
    current = value < current.value ? current.left : current.right
  }

  const inserted: MutableNode = { value, color: 'red', left: null, right: null, parent }
  meta.inserted = true

  if (!parent) {
    context.root = inserted
  } else if (value < parent.value) {
    parent.left = inserted
  } else {
    parent.right = inserted
  }

  // Conserto das violacoes "vermelho-vermelho" subindo ate a raiz.
  let node = inserted
  while (node.parent && node.parent.color === 'red') {
    const parentNode = node.parent
    const grandparent = parentNode.parent
    if (!grandparent) {
      break
    }

    if (parentNode === grandparent.left) {
      const uncle = grandparent.right
      if (isRed(uncle)) {
        // Caso 1: tio vermelho -> apenas recolore.
        parentNode.color = 'black'
        uncle!.color = 'black'
        grandparent.color = 'red'
        meta.recolorCount += 1
        addHighlights(meta, [parentNode.value, uncle!.value, grandparent.value])
        node = grandparent
      } else {
        if (node === parentNode.right) {
          // Caso 2: alinha o zigue-zague com uma rotacao a esquerda.
          node = parentNode
          rotateLeft(context, node)
          meta.rotations.push({ direction: 'left', pivotValue: node.value })
          addHighlights(meta, [node.value])
        }
        // Caso 3: recolore e rotaciona a direita sobre o avo.
        node.parent!.color = 'black'
        node.parent!.parent!.color = 'red'
        const rotationPivot = node.parent!.parent!
        addHighlights(meta, [node.parent!.value, rotationPivot.value])
        rotateRight(context, rotationPivot)
        meta.rotations.push({ direction: 'right', pivotValue: rotationPivot.value })
      }
    } else {
      const uncle = grandparent.left
      if (isRed(uncle)) {
        parentNode.color = 'black'
        uncle!.color = 'black'
        grandparent.color = 'red'
        meta.recolorCount += 1
        addHighlights(meta, [parentNode.value, uncle!.value, grandparent.value])
        node = grandparent
      } else {
        if (node === parentNode.left) {
          node = parentNode
          rotateRight(context, node)
          meta.rotations.push({ direction: 'right', pivotValue: node.value })
          addHighlights(meta, [node.value])
        }
        node.parent!.color = 'black'
        node.parent!.parent!.color = 'red'
        const rotationPivot = node.parent!.parent!
        addHighlights(meta, [node.parent!.value, rotationPivot.value])
        rotateLeft(context, rotationPivot)
        meta.rotations.push({ direction: 'left', pivotValue: rotationPivot.value })
      }
    }
  }

  if (context.root && context.root.color === 'red') {
    context.root.color = 'black'
    meta.rootBlackened = true
  }

  return { root: toImmutable(context.root), meta }
}

export function buildRedBlackFromValues(values: number[]) {
  let root: RbNode | null = null
  const metas: Array<RbInsertMeta & { value: number }> = []

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    const result = insertIntoRedBlack(root, value)
    root = result.root
    metas.push({
      value,
      ...result.meta,
    })
  }

  return { root, metas }
}

export function countNodes(node: RbNode | null): number {
  if (!node) {
    return 0
  }

  return 1 + countNodes(node.left) + countNodes(node.right)
}

export function countRedNodes(node: RbNode | null): number {
  if (!node) {
    return 0
  }

  return (node.color === 'red' ? 1 : 0) + countRedNodes(node.left) + countRedNodes(node.right)
}

/** Altura preta: numero de nos pretos de um caminho da raiz ate as folhas (NIL contam como preto). */
export function getBlackHeight(node: RbNode | null): number {
  if (!node) {
    return 1
  }

  return getBlackHeight(node.left) + (node.color === 'black' ? 1 : 0)
}

export function getTreeHeight(node: RbNode | null): number {
  if (!node) {
    return 0
  }

  return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right))
}

export function buildRedBlackLayout(root: RbNode | null): RbLayout {
  const nodes: RbLayoutNode[] = []
  const edges: RbLayoutEdge[] = []
  const positions = new Map<number, { order: number; depth: number }>()
  let order = 0

  function walk(node: RbNode | null, depth: number) {
    if (!node) {
      return
    }

    walk(node.left, depth + 1)
    positions.set(node.value, { order, depth })
    order += 1
    walk(node.right, depth + 1)
  }

  function connect(node: RbNode | null) {
    if (!node) {
      return
    }

    const currentPosition = positions.get(node.value)

    if (!currentPosition) {
      return
    }

    nodes.push({
      value: node.value,
      x: currentPosition.order * 88 + 56,
      y: currentPosition.depth * 104 + 56,
      depth: currentPosition.depth,
      color: node.color,
    })

    if (node.left) {
      edges.push({ from: node.value, to: node.left.value })
    }

    if (node.right) {
      edges.push({ from: node.value, to: node.right.value })
    }

    connect(node.left)
    connect(node.right)
  }

  walk(root, 0)
  connect(root)

  const width = Math.max(nodes.length * 88 + 24, 320)
  const height = Math.max(getTreeHeight(root) * 104 + 24, 180)

  return { nodes, edges, width, height }
}
