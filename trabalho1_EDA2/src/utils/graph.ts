// Estruturas, grafos de exemplo e algoritmos (BFS, DFS, Dijkstra) usados pelo
// Laboratorio de Grafos. Cada algoritmo devolve uma lista de "passos" que o
// componente reproduz quadro a quadro para tornar a busca visivel.

export type GraphNodeId = string

export type GraphNode = {
  id: GraphNodeId
  x: number
  y: number
}

export type GraphEdge = {
  from: GraphNodeId
  to: GraphNodeId
  weight: number
}

export type Graph = {
  id: string
  label: string
  description: string
  directed: boolean
  weighted: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type GraphAlgorithmId = 'bfs' | 'dfs' | 'dijkstra'

/** Um quadro da animacao: o estado completo do algoritmo naquele instante. */
export type GraphStep = {
  /** No em foco no momento (destacado em laranja). */
  current: GraphNodeId | null
  /** Nos ja finalizados, na ordem em que foram visitados. */
  visited: GraphNodeId[]
  /** Conteudo atual da fila / pilha / fila de prioridade. */
  frontier: GraphNodeId[]
  /** Aresta sendo examinada neste passo (destacada). */
  activeEdge: { from: GraphNodeId; to: GraphNodeId } | null
  /** Distancias conhecidas (apenas Dijkstra; null nas travessias). */
  distances: Record<GraphNodeId, number> | null
  /** Texto explicativo exibido na barra de status. */
  description: string
}

export type GraphAlgorithm = {
  id: GraphAlgorithmId
  name: string
  shortName: string
  /** Nome da estrutura que guarda a fronteira (fila, pilha, ...). */
  frontierLabel: string
  usesWeight: boolean
  complexity: string
  description: string
}

export const GRAPH_ALGORITHMS: GraphAlgorithm[] = [
  {
    id: 'bfs',
    name: 'Busca em Largura (BFS)',
    shortName: 'BFS',
    frontierLabel: 'Fila (FIFO)',
    usesWeight: false,
    complexity: 'O(V + E)',
    description:
      'Explora o grafo em camadas: visita todos os vizinhos antes de avancar. Usa uma fila e encontra o caminho com menos arestas em grafos sem peso.',
  },
  {
    id: 'dfs',
    name: 'Busca em Profundidade (DFS)',
    shortName: 'DFS',
    frontierLabel: 'Pilha de chamadas (LIFO)',
    usesWeight: false,
    complexity: 'O(V + E)',
    description:
      'Mergulha o mais fundo possivel por um ramo antes de retroceder. Usa a pilha de chamadas (recursao) e e a base de ordenacao topologica e componentes conexas.',
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra (menor caminho)',
    shortName: 'Dijkstra',
    frontierLabel: 'Fila de prioridade',
    usesWeight: true,
    complexity: 'O((V + E) log V)',
    description:
      'Calcula o menor caminho a partir da origem em grafos com pesos nao negativos. A cada passo fixa o no mais proximo ainda em aberto e relaxa suas arestas.',
  },
]

export const GRAPH_PRESETS: Graph[] = [
  {
    id: 'cidades',
    label: 'Rede de cidades (com peso)',
    description:
      'Grafo nao direcionado e ponderado. Ideal para o Dijkstra: os pesos representam a distancia entre cidades.',
    directed: false,
    weighted: true,
    nodes: [
      { id: 'A', x: 110, y: 90 },
      { id: 'B', x: 360, y: 70 },
      { id: 'C', x: 620, y: 110 },
      { id: 'D', x: 130, y: 330 },
      { id: 'E', x: 390, y: 320 },
      { id: 'F', x: 640, y: 340 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'D', weight: 3 },
      { from: 'B', to: 'C', weight: 5 },
      { from: 'B', to: 'E', weight: 2 },
      { from: 'B', to: 'D', weight: 8 },
      { from: 'C', to: 'F', weight: 6 },
      { from: 'D', to: 'E', weight: 7 },
      { from: 'E', to: 'F', weight: 4 },
    ],
  },
  {
    id: 'grade',
    label: 'Malha sem peso',
    description:
      'Grafo nao direcionado e sem peso, organizado em malha. Otimo para enxergar as camadas da BFS e os mergulhos da DFS.',
    directed: false,
    weighted: false,
    nodes: [
      { id: '1', x: 130, y: 90 },
      { id: '2', x: 380, y: 90 },
      { id: '3', x: 630, y: 90 },
      { id: '4', x: 130, y: 250 },
      { id: '5', x: 380, y: 250 },
      { id: '6', x: 630, y: 250 },
      { id: '7', x: 255, y: 400 },
      { id: '8', x: 505, y: 400 },
    ],
    edges: [
      { from: '1', to: '2', weight: 1 },
      { from: '2', to: '3', weight: 1 },
      { from: '1', to: '4', weight: 1 },
      { from: '2', to: '5', weight: 1 },
      { from: '3', to: '6', weight: 1 },
      { from: '4', to: '5', weight: 1 },
      { from: '5', to: '6', weight: 1 },
      { from: '4', to: '7', weight: 1 },
      { from: '5', to: '7', weight: 1 },
      { from: '5', to: '8', weight: 1 },
      { from: '6', to: '8', weight: 1 },
    ],
  },
  {
    id: 'direcionado',
    label: 'Grafo direcionado',
    description:
      'Grafo direcionado (as arestas tem sentido). Mostra como BFS e DFS respeitam a direcao das setas.',
    directed: true,
    weighted: true,
    nodes: [
      { id: 'A', x: 120, y: 200 },
      { id: 'B', x: 330, y: 90 },
      { id: 'C', x: 330, y: 320 },
      { id: 'D', x: 540, y: 90 },
      { id: 'E', x: 540, y: 320 },
      { id: 'F', x: 720, y: 200 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 2 },
      { from: 'A', to: 'C', weight: 5 },
      { from: 'B', to: 'D', weight: 4 },
      { from: 'C', to: 'E', weight: 3 },
      { from: 'C', to: 'B', weight: 1 },
      { from: 'D', to: 'F', weight: 6 },
      { from: 'E', to: 'F', weight: 2 },
      { from: 'E', to: 'D', weight: 7 },
    ],
  },
]

type Adjacency = Map<GraphNodeId, { to: GraphNodeId; weight: number }[]>

/** Constroi a lista de adjacencia, duplicando arestas quando nao direcionado. */
function buildAdjacency(graph: Graph): Adjacency {
  const adjacency: Adjacency = new Map()
  graph.nodes.forEach((node) => adjacency.set(node.id, []))

  graph.edges.forEach((edge) => {
    adjacency.get(edge.from)?.push({ to: edge.to, weight: edge.weight })
    if (!graph.directed) {
      adjacency.get(edge.to)?.push({ to: edge.from, weight: edge.weight })
    }
  })

  // Ordem estavel: vizinhos visitados em ordem alfabetica/numerica.
  for (const list of adjacency.values()) {
    list.sort((first, second) => first.to.localeCompare(second.to, undefined, { numeric: true }))
  }

  return adjacency
}

function formatDistance(value: number): string {
  return value === Infinity ? '∞' : String(value)
}

export function runBfs(graph: Graph, start: GraphNodeId): GraphStep[] {
  const adjacency = buildAdjacency(graph)
  const steps: GraphStep[] = []
  const visited: GraphNodeId[] = []
  const queue: GraphNodeId[] = [start]
  const discovered = new Set<GraphNodeId>([start])

  steps.push({
    current: null,
    visited: [],
    frontier: [...queue],
    activeEdge: null,
    distances: null,
    description: `Inicio: ${start} entra na fila.`,
  })

  while (queue.length > 0) {
    const current = queue.shift() as GraphNodeId
    visited.push(current)
    steps.push({
      current,
      visited: [...visited],
      frontier: [...queue],
      activeEdge: null,
      distances: null,
      description: `Retira ${current} da frente da fila e o marca como visitado.`,
    })

    for (const { to } of adjacency.get(current) ?? []) {
      if (discovered.has(to)) {
        steps.push({
          current,
          visited: [...visited],
          frontier: [...queue],
          activeEdge: { from: current, to },
          distances: null,
          description: `Aresta ${current}–${to}: ${to} ja foi descoberto, segue em frente.`,
        })
        continue
      }

      discovered.add(to)
      queue.push(to)
      steps.push({
        current,
        visited: [...visited],
        frontier: [...queue],
        activeEdge: { from: current, to },
        distances: null,
        description: `Descobre ${to} a partir de ${current} e o adiciona ao fim da fila.`,
      })
    }
  }

  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    activeEdge: null,
    distances: null,
    description: `BFS concluida. Ordem de visita: ${visited.join(' → ')}.`,
  })

  return steps
}

export function runDfs(graph: Graph, start: GraphNodeId): GraphStep[] {
  const adjacency = buildAdjacency(graph)
  const steps: GraphStep[] = []
  const visited: GraphNodeId[] = []
  const visitedSet = new Set<GraphNodeId>()
  const callStack: GraphNodeId[] = []

  steps.push({
    current: null,
    visited: [],
    frontier: [],
    activeEdge: null,
    distances: null,
    description: `Inicio da DFS recursiva a partir de ${start}.`,
  })

  const visit = (node: GraphNodeId, fromEdge: { from: GraphNodeId; to: GraphNodeId } | null) => {
    callStack.push(node)
    visitedSet.add(node)
    visited.push(node)
    steps.push({
      current: node,
      visited: [...visited],
      frontier: [...callStack],
      activeEdge: fromEdge,
      distances: null,
      description: `Entra em ${node} e o empilha na pilha de chamadas.`,
    })

    for (const { to } of adjacency.get(node) ?? []) {
      if (visitedSet.has(to)) {
        steps.push({
          current: node,
          visited: [...visited],
          frontier: [...callStack],
          activeEdge: { from: node, to },
          distances: null,
          description: `Aresta ${node}–${to}: ${to} ja visitado, nao desce.`,
        })
        continue
      }

      steps.push({
        current: node,
        visited: [...visited],
        frontier: [...callStack],
        activeEdge: { from: node, to },
        distances: null,
        description: `Desce de ${node} para ${to}.`,
      })
      visit(to, { from: node, to })
    }

    callStack.pop()
    steps.push({
      current: callStack[callStack.length - 1] ?? null,
      visited: [...visited],
      frontier: [...callStack],
      activeEdge: null,
      distances: null,
      description: `Termina ${node} e desempilha (backtrack).`,
    })
  }

  visit(start, null)

  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    activeEdge: null,
    distances: null,
    description: `DFS concluida. Ordem de visita: ${visited.join(' → ')}.`,
  })

  return steps
}

export function runDijkstra(graph: Graph, start: GraphNodeId): GraphStep[] {
  const adjacency = buildAdjacency(graph)
  const steps: GraphStep[] = []
  const distances: Record<GraphNodeId, number> = {}
  graph.nodes.forEach((node) => {
    distances[node.id] = Infinity
  })
  distances[start] = 0

  const visited: GraphNodeId[] = []
  const visitedSet = new Set<GraphNodeId>()

  // Fronteira = nos ainda nao fixados com distancia finita, ordenados pela distancia.
  const buildFrontier = () =>
    graph.nodes
      .map((node) => node.id)
      .filter((id) => !visitedSet.has(id) && distances[id] < Infinity)
      .sort((first, second) => distances[first] - distances[second])

  steps.push({
    current: null,
    visited: [],
    frontier: buildFrontier(),
    activeEdge: null,
    distances: { ...distances },
    description: `Distancia de ${start} = 0 e de todos os demais = ∞.`,
  })

  while (true) {
    let chosen: GraphNodeId | null = null
    let best = Infinity
    for (const node of graph.nodes) {
      if (!visitedSet.has(node.id) && distances[node.id] < best) {
        best = distances[node.id]
        chosen = node.id
      }
    }

    if (chosen === null) {
      break
    }

    visitedSet.add(chosen)
    visited.push(chosen)
    steps.push({
      current: chosen,
      visited: [...visited],
      frontier: buildFrontier(),
      activeEdge: null,
      distances: { ...distances },
      description: `Fixa ${chosen} com distancia ${formatDistance(distances[chosen])} (menor da fila de prioridade).`,
    })

    for (const { to, weight } of adjacency.get(chosen) ?? []) {
      if (visitedSet.has(to)) {
        continue
      }

      const candidate = distances[chosen] + weight
      if (candidate < distances[to]) {
        const previous = formatDistance(distances[to])
        distances[to] = candidate
        steps.push({
          current: chosen,
          visited: [...visited],
          frontier: buildFrontier(),
          activeEdge: { from: chosen, to },
          distances: { ...distances },
          description: `Relaxa ${chosen}→${to}: ${distances[chosen]}+${weight}=${candidate} melhora ${previous}.`,
        })
      } else {
        steps.push({
          current: chosen,
          visited: [...visited],
          frontier: buildFrontier(),
          activeEdge: { from: chosen, to },
          distances: { ...distances },
          description: `Aresta ${chosen}→${to}: ${distances[chosen]}+${weight} nao melhora ${formatDistance(distances[to])}.`,
        })
      }
    }
  }

  const resumo = graph.nodes
    .map((node) => `${node.id}=${formatDistance(distances[node.id])}`)
    .join(', ')
  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    activeEdge: null,
    distances: { ...distances },
    description: `Dijkstra concluida. Menores distancias a partir de ${start}: ${resumo}.`,
  })

  return steps
}

export function runGraphAlgorithm(
  algorithm: GraphAlgorithmId,
  graph: Graph,
  start: GraphNodeId,
): GraphStep[] {
  if (algorithm === 'bfs') {
    return runBfs(graph, start)
  }
  if (algorithm === 'dfs') {
    return runDfs(graph, start)
  }
  return runDijkstra(graph, start)
}
