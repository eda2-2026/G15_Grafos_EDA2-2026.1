import { useEffect, useMemo, useState } from 'react'
import {
  GRAPH_ALGORITHMS,
  GRAPH_PRESETS,
  runGraphAlgorithm,
  type Graph,
  type GraphAlgorithmId,
  type GraphNodeId,
} from '../utils/graph'

const PLAYBACK_DELAY_MS = 1100
const NODE_RADIUS = 22
const VIEW_WIDTH = 820
const VIEW_HEIGHT = 470

type NodeState = 'idle' | 'frontier' | 'current' | 'visited'

const nodeFill: Record<NodeState, string> = {
  idle: '#1e293b',
  frontier: '#0ea5e9',
  current: '#f59e0b',
  visited: '#10b981',
}

const nodeStroke: Record<NodeState, string> = {
  idle: '#475569',
  frontier: '#38bdf8',
  current: '#fbbf24',
  visited: '#34d399',
}

const legendItems: { state: NodeState; label: string }[] = [
  { state: 'idle', label: 'Nao visitado' },
  { state: 'frontier', label: 'Na fronteira' },
  { state: 'current', label: 'Em foco' },
  { state: 'visited', label: 'Visitado' },
]

function formatDistance(value: number): string {
  return value === Infinity ? '∞' : String(value)
}

// Encurta a linha para que ela toque a borda dos circulos (e nao o centro),
// deixando espaco para a seta nos grafos direcionados.
function trimLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  padStart: number,
  padEnd: number,
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  return {
    x1: x1 + ux * padStart,
    y1: y1 + uy * padStart,
    x2: x2 - ux * padEnd,
    y2: y2 - uy * padEnd,
  }
}

export default function GraphStudyLab() {
  const [selectedGraphId, setSelectedGraphId] = useState<string>(GRAPH_PRESETS[0]?.id ?? '')
  const [algorithmId, setAlgorithmId] = useState<GraphAlgorithmId>('bfs')
  const [startNode, setStartNode] = useState<GraphNodeId>(GRAPH_PRESETS[0]?.nodes[0]?.id ?? '')
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const graph: Graph = useMemo(
    () => GRAPH_PRESETS.find((preset) => preset.id === selectedGraphId) ?? GRAPH_PRESETS[0],
    [selectedGraphId],
  )

  const algorithm = useMemo(
    () => GRAPH_ALGORITHMS.find((item) => item.id === algorithmId) ?? GRAPH_ALGORITHMS[0],
    [algorithmId],
  )

  const steps = useMemo(
    () => runGraphAlgorithm(algorithmId, graph, startNode),
    [algorithmId, graph, startNode],
  )

  // Qualquer mudanca de grafo/algoritmo/origem reinicia a reproducao.
  useEffect(() => {
    setStepIndex(0)
    setIsPlaying(false)
  }, [steps])

  const isLastStep = stepIndex >= steps.length - 1

  useEffect(() => {
    if (!isPlaying) {
      return
    }
    if (isLastStep) {
      setIsPlaying(false)
      return
    }
    const timer = setTimeout(() => setStepIndex((index) => index + 1), PLAYBACK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isPlaying, isLastStep, stepIndex])

  const currentStep = steps[stepIndex]
  const currentDistances = currentStep.distances
  const visitedSet = useMemo(() => new Set(currentStep.visited), [currentStep])
  const frontierSet = useMemo(() => new Set(currentStep.frontier), [currentStep])

  const nodeStateOf = (id: GraphNodeId): NodeState => {
    if (currentStep.current === id) return 'current'
    if (visitedSet.has(id)) return 'visited'
    if (frontierSet.has(id)) return 'frontier'
    return 'idle'
  }

  const handleSelectGraph = (id: string) => {
    const preset = GRAPH_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setSelectedGraphId(id)
    setStartNode(preset.nodes[0]?.id ?? '')
  }

  const handleReset = () => {
    setStepIndex(0)
    setIsPlaying(false)
  }

  const handlePrev = () => {
    setIsPlaying(false)
    setStepIndex((index) => Math.max(0, index - 1))
  }

  const handleNext = () => {
    setIsPlaying(false)
    setStepIndex((index) => Math.min(steps.length - 1, index + 1))
  }

  const togglePlay = () => {
    if (isLastStep) {
      setStepIndex(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((playing) => !playing)
  }

  const frontierTitle = algorithm.frontierLabel

  return (
    <section className="mt-6 battle-card rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Grafos</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Laboratorio de Buscas em Grafos</h2>
          <p className="mt-3 text-slate-600">
            Escolha um grafo, uma origem e um algoritmo. Reproduza a busca passo a passo e observe a
            fronteira (fila, pilha ou fila de prioridade), os nos visitados e as arestas exploradas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{graph.nodes.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Arestas</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{graph.edges.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Algoritmo</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{algorithm.shortName}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Passo</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stepIndex + 1}
              <span className="text-base font-medium text-slate-400">/{steps.length}</span>
            </p>
          </article>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        {currentStep.description}
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">
              Grafo
              <select
                value={selectedGraphId}
                onChange={(event) => handleSelectGraph(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500"
              >
                {GRAPH_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Algoritmo
              <select
                value={algorithmId}
                onChange={(event) => setAlgorithmId(event.target.value as GraphAlgorithmId)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500"
              >
                {GRAPH_ALGORITHMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Origem
              <select
                value={startNode}
                onChange={(event) => setStartNode(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500"
              >
                {graph.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {algorithm.usesWeight && !graph.weighted && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              Este grafo nao tem pesos: o Dijkstra trata cada aresta com custo 1, comportando-se como
              a BFS.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              {isPlaying ? 'Pausar' : isLastStep ? 'Repetir' : 'Reproduzir'}
            </button>
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isLastStep}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proximo →
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Reiniciar
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={stepIndex}
            onChange={(event) => {
              setIsPlaying(false)
              setStepIndex(Number(event.target.value))
            }}
            className="mt-4 w-full accent-sky-600"
            aria-label="Linha do tempo da execucao"
          />

          <div className="relative mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4">
            <svg
              width="100%"
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              className="mx-auto block"
              role="img"
              aria-label="Visualizacao do grafo"
            >
              <defs>
                <marker
                  id="graph-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker
                  id="graph-arrow-active"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                </marker>
              </defs>

              {graph.edges.map((edge) => {
                const from = graph.nodes.find((node) => node.id === edge.from)
                const to = graph.nodes.find((node) => node.id === edge.to)
                if (!from || !to) return null

                const isActive =
                  currentStep.activeEdge !== null &&
                  ((currentStep.activeEdge.from === edge.from && currentStep.activeEdge.to === edge.to) ||
                    (!graph.directed &&
                      currentStep.activeEdge.from === edge.to &&
                      currentStep.activeEdge.to === edge.from))

                const padEnd = graph.directed ? NODE_RADIUS + 8 : NODE_RADIUS
                const line = trimLine(from.x, from.y, to.x, to.y, NODE_RADIUS, padEnd)
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={isActive ? '#fbbf24' : '#475569'}
                      strokeWidth={isActive ? 4 : 2}
                      markerEnd={
                        graph.directed
                          ? `url(#${isActive ? 'graph-arrow-active' : 'graph-arrow'})`
                          : undefined
                      }
                    />
                    {graph.weighted && (
                      <g>
                        <circle cx={midX} cy={midY} r="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                        <text
                          x={midX}
                          y={midY + 4}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="700"
                          fill={isActive ? '#fbbf24' : '#e2e8f0'}
                        >
                          {edge.weight}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {graph.nodes.map((node) => {
                const state = nodeStateOf(node.id)
                const distance = currentStep.distances?.[node.id]
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    {state === 'current' && (
                      <circle
                        className="tree-highlight-ring"
                        r="26"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                      />
                    )}
                    <circle
                      r={NODE_RADIUS}
                      fill={nodeFill[state]}
                      stroke={nodeStroke[state]}
                      strokeWidth="3"
                    />
                    <text
                      y="5"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="700"
                      fill="#f8fafc"
                    >
                      {node.id}
                    </text>
                    {distance !== undefined && (
                      <text
                        y={-NODE_RADIUS - 8}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill="#cbd5e1"
                      >
                        d={formatDistance(distance)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            {legendItems.map((item) => (
              <div key={item.state} className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="inline-block h-4 w-4 rounded-full border-2"
                  style={{ background: nodeFill[item.state], borderColor: nodeStroke[item.state] }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">{algorithm.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{algorithm.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Complexidade: <span className="text-sky-700">{algorithm.complexity}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{graph.description}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">{frontierTitle}</h3>
            {currentStep.frontier.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Fronteira vazia.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentStep.frontier.map((id, index) => (
                  <span
                    key={`${id}-${index}`}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                      index === 0
                        ? 'border-sky-400 bg-sky-100 text-sky-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {algorithmId === 'bfs'
                ? 'A frente da fila (destacada) e o proximo no a ser visitado.'
                : algorithmId === 'dfs'
                  ? 'O topo da pilha (destacado) e o no ativo da recursao.'
                  : 'O menor da fila de prioridade (destacado) sera fixado em seguida.'}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ordem de visita</h3>
            {currentStep.visited.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nenhum no visitado ainda.</p>
            ) : (
              <p className="mt-3 text-sm font-semibold text-slate-800">
                {currentStep.visited.join(' → ')}
              </p>
            )}
          </section>

          {currentDistances && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-900">Distancias</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {graph.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center"
                  >
                    <p className="text-xs font-semibold text-slate-500">{node.id}</p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatDistance(currentDistances[node.id])}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
