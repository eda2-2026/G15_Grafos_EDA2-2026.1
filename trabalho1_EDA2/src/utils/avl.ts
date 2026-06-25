export type AvlNode = {
  value: number
  height: number
  left: AvlNode | null
  right: AvlNode | null
}

export type RotationType = 'LL' | 'RR' | 'LR' | 'RL' | 'none'

export type AvlInsertMeta = {
  inserted: boolean
  rotation: RotationType
  pivotValue: number | null
}

export type AvlPlaybackStep = {
  root: AvlNode | null
  value: number
  rotation: RotationType
  pivotValue: number | null
  stage: 'insert' | 'rotation'
}

export type AvlPreset = {
  id: string
  label: string
  description: string
  values: number[]
  expectedRotation: Exclude<RotationType, 'none'>
}

export type AvlLayoutNode = {
  value: number
  x: number
  y: number
  depth: number
  height: number
  balance: number
}

export type AvlLayoutEdge = {
  from: number
  to: number
}

export type AvlLayout = {
  nodes: AvlLayoutNode[]
  edges: AvlLayoutEdge[]
  width: number
  height: number
}

export const AVL_PRESETS: AvlPreset[] = [
  {
    id: 'll',
    label: 'Caso LL',
    description: 'A insercao ocorre na subarvore esquerda do filho esquerdo e exige rotacao simples a direita.',
    values: [30, 20, 10],
    expectedRotation: 'LL',
  },
  {
    id: 'rr',
    label: 'Caso RR',
    description: 'A insercao ocorre na subarvore direita do filho direito e exige rotacao simples a esquerda.',
    values: [10, 20, 30],
    expectedRotation: 'RR',
  },
  {
    id: 'lr',
    label: 'Caso LR',
    description: 'A insercao cai no ramo direito do filho esquerdo e gera rotacao dupla esquerda-direita.',
    values: [30, 10, 20],
    expectedRotation: 'LR',
  },
  {
    id: 'rl',
    label: 'Caso RL',
    description: 'A insercao cai no ramo esquerdo do filho direito e gera rotacao dupla direita-esquerda.',
    values: [10, 30, 20],
    expectedRotation: 'RL',
  },
]

function getNodeHeight(node: AvlNode | null) {
  return node?.height ?? 0
}

function createNode(value: number): AvlNode {
  return {
    value,
    height: 1,
    left: null,
    right: null,
  }
}

function updateHeight(node: AvlNode): AvlNode {
  return {
    ...node,
    height: Math.max(getNodeHeight(node.left), getNodeHeight(node.right)) + 1,
  }
}

type MutableAvlNode = {
  value: number
  height: number
  left: MutableAvlNode | null
  right: MutableAvlNode | null
  parent: MutableAvlNode | null
}

type MutableAvlContext = {
  root: MutableAvlNode | null
}

function toMutable(node: AvlNode | null, parent: MutableAvlNode | null): MutableAvlNode | null {
  if (!node) {
    return null
  }

  const mutable: MutableAvlNode = {
    value: node.value,
    height: node.height,
    left: null,
    right: null,
    parent,
  }
  mutable.left = toMutable(node.left, mutable)
  mutable.right = toMutable(node.right, mutable)
  return mutable
}

function toImmutable(node: MutableAvlNode | null): AvlNode | null {
  if (!node) {
    return null
  }

  return {
    value: node.value,
    height: node.height,
    left: toImmutable(node.left),
    right: toImmutable(node.right),
  }
}

function recomputeHeights(node: MutableAvlNode | null): number {
  if (!node) {
    return 0
  }

  node.height = Math.max(recomputeHeights(node.left), recomputeHeights(node.right)) + 1
  return node.height
}

function getMutableBalanceFactor(node: MutableAvlNode | null) {
  if (!node) {
    return 0
  }

  return (node.left?.height ?? 0) - (node.right?.height ?? 0)
}

function rotateLeftMutable(context: MutableAvlContext, pivot: MutableAvlNode) {
  const nextRoot = pivot.right

  if (!nextRoot) {
    return
  }

  pivot.right = nextRoot.left
  if (nextRoot.left) {
    nextRoot.left.parent = pivot
  }

  nextRoot.parent = pivot.parent
  if (!pivot.parent) {
    context.root = nextRoot
  } else if (pivot === pivot.parent.left) {
    pivot.parent.left = nextRoot
  } else {
    pivot.parent.right = nextRoot
  }

  nextRoot.left = pivot
  pivot.parent = nextRoot
}

function rotateRightMutable(context: MutableAvlContext, pivot: MutableAvlNode) {
  const nextRoot = pivot.left

  if (!nextRoot) {
    return
  }

  pivot.left = nextRoot.right
  if (nextRoot.right) {
    nextRoot.right.parent = pivot
  }

  nextRoot.parent = pivot.parent
  if (!pivot.parent) {
    context.root = nextRoot
  } else if (pivot === pivot.parent.right) {
    pivot.parent.right = nextRoot
  } else {
    pivot.parent.left = nextRoot
  }

  nextRoot.right = pivot
  pivot.parent = nextRoot
}

export function getBalanceFactor(node: AvlNode | null) {
  if (!node) {
    return 0
  }

  return getNodeHeight(node.left) - getNodeHeight(node.right)
}

function rotateRight(node: AvlNode) {
  const nextRoot = node.left

  if (!nextRoot) {
    return node
  }

  const movedSubtree = nextRoot.right
  const rotatedNode = updateHeight({
    ...node,
    left: movedSubtree,
  })

  return updateHeight({
    ...nextRoot,
    right: rotatedNode,
  })
}

function rotateLeft(node: AvlNode) {
  const nextRoot = node.right

  if (!nextRoot) {
    return node
  }

  const movedSubtree = nextRoot.left
  const rotatedNode = updateHeight({
    ...node,
    right: movedSubtree,
  })

  return updateHeight({
    ...nextRoot,
    left: rotatedNode,
  })
}

function insertNode(node: AvlNode | null, value: number, meta: AvlInsertMeta): AvlNode {
  if (!node) {
    meta.inserted = true
    return createNode(value)
  }

  if (value === node.value) {
    return node
  }

  let nextNode = node

  if (value < node.value) {
    nextNode = {
      ...node,
      left: insertNode(node.left, value, meta),
    }
  } else {
    nextNode = {
      ...node,
      right: insertNode(node.right, value, meta),
    }
  }

  nextNode = updateHeight(nextNode)
  const balance = getBalanceFactor(nextNode)

  if (balance > 1 && nextNode.left && value < nextNode.left.value) {
    meta.rotation = 'LL'
    meta.pivotValue = nextNode.value
    return rotateRight(nextNode)
  }

  if (balance < -1 && nextNode.right && value > nextNode.right.value) {
    meta.rotation = 'RR'
    meta.pivotValue = nextNode.value
    return rotateLeft(nextNode)
  }

  if (balance > 1 && nextNode.left && value > nextNode.left.value) {
    meta.rotation = 'LR'
    meta.pivotValue = nextNode.value
    return rotateRight({
      ...nextNode,
      left: rotateLeft(nextNode.left),
    })
  }

  if (balance < -1 && nextNode.right && value < nextNode.right.value) {
    meta.rotation = 'RL'
    meta.pivotValue = nextNode.value
    return rotateLeft({
      ...nextNode,
      right: rotateRight(nextNode.right),
    })
  }

  return nextNode
}

export function insertIntoAvl(root: AvlNode | null, value: number) {
  const meta: AvlInsertMeta = {
    inserted: false,
    rotation: 'none',
    pivotValue: null,
  }

  return {
    root: insertNode(root, value, meta),
    meta,
  }
}

function insertNodeWithoutBalancing(node: AvlNode | null, value: number, insertedRef: { inserted: boolean }): AvlNode {
  if (!node) {
    insertedRef.inserted = true
    return createNode(value)
  }

  if (value === node.value) {
    return node
  }

  if (value < node.value) {
    return updateHeight({
      ...node,
      left: insertNodeWithoutBalancing(node.left, value, insertedRef),
    })
  }

  return updateHeight({
    ...node,
    right: insertNodeWithoutBalancing(node.right, value, insertedRef),
  })
}

export function insertIntoAvlWithoutBalancing(root: AvlNode | null, value: number) {
  const insertedRef = { inserted: false }

  return {
    root: insertNodeWithoutBalancing(root, value, insertedRef),
    inserted: insertedRef.inserted,
  }
}

export function insertIntoAvlWithPlayback(root: AvlNode | null, value: number) {
  const context: MutableAvlContext = { root: toMutable(root, null) }
  const meta: AvlInsertMeta = {
    inserted: false,
    rotation: 'none',
    pivotValue: null,
  }
  const steps: AvlPlaybackStep[] = []

  let parent: MutableAvlNode | null = null
  let current = context.root

  while (current) {
    parent = current
    if (value === current.value) {
      return { root: toImmutable(context.root), meta, steps }
    }
    current = value < current.value ? current.left : current.right
  }

  const inserted: MutableAvlNode = {
    value,
    height: 1,
    left: null,
    right: null,
    parent,
  }
  meta.inserted = true

  if (!parent) {
    context.root = inserted
  } else if (value < parent.value) {
    parent.left = inserted
  } else {
    parent.right = inserted
  }

  recomputeHeights(context.root)
  steps.push({
    root: toImmutable(context.root),
    value,
    rotation: 'none',
    pivotValue: null,
    stage: 'insert',
  })

  let ancestor = inserted.parent
  while (ancestor) {
    recomputeHeights(context.root)
    const balance = getMutableBalanceFactor(ancestor)

    if (balance > 1 && ancestor.left && value < ancestor.left.value) {
      meta.rotation = 'LL'
      meta.pivotValue = ancestor.value
      rotateRightMutable(context, ancestor)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      return { root: toImmutable(context.root), meta, steps }
    }

    if (balance < -1 && ancestor.right && value > ancestor.right.value) {
      meta.rotation = 'RR'
      meta.pivotValue = ancestor.value
      rotateLeftMutable(context, ancestor)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      return { root: toImmutable(context.root), meta, steps }
    }

    if (balance > 1 && ancestor.left && value > ancestor.left.value) {
      meta.rotation = 'LR'
      meta.pivotValue = ancestor.value
      rotateLeftMutable(context, ancestor.left)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      rotateRightMutable(context, ancestor)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      return { root: toImmutable(context.root), meta, steps }
    }

    if (balance < -1 && ancestor.right && value < ancestor.right.value) {
      meta.rotation = 'RL'
      meta.pivotValue = ancestor.value
      rotateRightMutable(context, ancestor.right)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      rotateLeftMutable(context, ancestor)
      recomputeHeights(context.root)
      steps.push({
        root: toImmutable(context.root),
        value,
        rotation: meta.rotation,
        pivotValue: meta.pivotValue,
        stage: 'rotation',
      })
      return { root: toImmutable(context.root), meta, steps }
    }

    ancestor = ancestor.parent
  }

  return { root: toImmutable(context.root), meta, steps }
}

export function buildAvlFromValues(values: number[]) {
  let root: AvlNode | null = null
  const metas: Array<AvlInsertMeta & { value: number }> = []

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    const result = insertIntoAvl(root, value)
    root = result.root
    metas.push({
      value,
      ...result.meta,
    })
  }

  return { root, metas }
}

export function countNodes(node: AvlNode | null): number {
  if (!node) {
    return 0
  }

  return 1 + countNodes(node.left) + countNodes(node.right)
}

export function buildAvlLayout(root: AvlNode | null) {
  const nodes: AvlLayoutNode[] = []
  const edges: AvlLayoutEdge[] = []
  const positions = new Map<number, { order: number; depth: number }>()
  let order = 0

  function walk(node: AvlNode | null, depth: number) {
    if (!node) {
      return
    }

    walk(node.left, depth + 1)
    positions.set(node.value, { order, depth })
    order += 1
    walk(node.right, depth + 1)
  }

  function connect(node: AvlNode | null) {
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
      height: node.height,
      balance: getBalanceFactor(node),
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
  const height = Math.max((root?.height ?? 1) * 104 + 24, 180)

  return { nodes, edges, width, height }
}
