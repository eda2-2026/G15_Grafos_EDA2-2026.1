import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  RB_PRESETS,
  buildRedBlackFromValues,
  buildRedBlackLayout,
  countNodes,
  countRedNodes,
  getBlackHeight,
  insertIntoRedBlack,
  type RbCategory,
  type RbInsertMeta,
  type RbLayoutNode,
  type RbNode,
} from '../utils/redBlack'
import { useAnimatedTreeLayout } from '../utils/useAnimatedTreeLayout'

type RbActionKind = 'none' | 'recolor' | 'rotation' | 'recolor-rotation'

type OperationLogEntry = {
  id: number
  kind: 'insert' | 'preset'
  message: string
  action: RbActionKind
}

const actionLabel: Record<RbActionKind, string> = {
  none: 'Sem ajuste',
  recolor: 'Recoloracao',
  rotation: 'Rotacao',
  'recolor-rotation': 'Recolor + Rotacao',
}

const actionTone: Record<RbActionKind, string> = {
  none: 'bg-slate-100 text-slate-700',
  recolor: 'bg-amber-100 text-amber-700',
  rotation: 'bg-sky-100 text-sky-700',
  'recolor-rotation': 'bg-violet-100 text-violet-700',
}

const categoryLabel: Record<RbCategory, string> = {
  recolor: 'Recoloracao',
  rotation: 'Rotacao',
  double: 'Rotacao dupla',
}

const categoryTone: Record<RbCategory, string> = {
  recolor: 'bg-amber-100 text-amber-700',
  rotation: 'bg-sky-100 text-sky-700',
  double: 'bg-violet-100 text-violet-700',
}

const NODE_FILL: Record<RbNode['color'], string> = {
  red: '#dc2626',
  black: '#1e293b',
}

function getActionKind(meta: RbInsertMeta): RbActionKind {
  const hasRotation = meta.rotations.length > 0
  const hasRecolor = meta.recolorCount > 0

  if (hasRotation && hasRecolor) {
    return 'recolor-rotation'
  }
  if (hasRotation) {
    return 'rotation'
  }
  if (hasRecolor) {
    return 'recolor'
  }
  return 'none'
}

function buildActionMessage(meta: RbInsertMeta): string {
  const parts: string[] = []

  if (meta.recolorCount > 0) {
    const plural = meta.recolorCount > 1 ? 'recoloracoes' : 'recoloracao'
    parts.push(`${meta.recolorCount} ${plural} pelo caso do tio vermelho`)
  }

  for (const rotation of meta.rotations) {
    const side = rotation.direction === 'left' ? 'esquerda' : 'direita'
    parts.push(`rotacao a ${side} no no ${rotation.pivotValue}`)
  }

  if (meta.rootBlackened) {
    parts.push('raiz repintada de preto')
  }

  if (parts.length === 0) {
    return 'Nenhum ajuste de cor ou rotacao foi necessario.'
  }

  const sentence = parts.join('; ')
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

export default function RedBlackStudyLab() {
  const [root, setRoot] = useState<RbNode | null>(null)
  const [valueInput, setValueInput] = useState('')
  const [statusMessage, setStatusMessage] = useState(
    'Comece inserindo valores ou carregue um dos casos classicos de arvore rubro-negra.',
  )
  const [lastAction, setLastAction] = useState<RbActionKind>('none')
  const [lastInsertedValue, setLastInsertedValue] = useState<number | null>(null)
  const [highlightValues, setHighlightValues] = useState<number[]>([])
  const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([])

  const totalNodes = useMemo(() => countNodes(root), [root])
  const redNodes = useMemo(() => countRedNodes(root), [root])
  const blackHeight = useMemo(() => getBlackHeight(root), [root])
  const layout = useMemo(() => buildRedBlackLayout(root), [root])
  const { nodes: animatedNodes, enteringValues, isAnimating } = useAnimatedTreeLayout<RbLayoutNode>(layout)

  // O destaque (anel + banner) so aparece enquanto a animacao do ajuste roda.
  const showAction = isAnimating && lastAction !== 'none'

  const appendLog = (entry: Omit<OperationLogEntry, 'id'>) => {
    setOperationLog((currentLog) => [
      { id: Date.now() + currentLog.length, ...entry },
      ...currentLog,
    ].slice(0, 8))
  }

  const handleInsert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedValue = Number(valueInput)
    if (!Number.isInteger(parsedValue)) {
      setStatusMessage('Digite um numero inteiro para inserir na arvore rubro-negra.')
      return
    }

    const result = insertIntoRedBlack(root, parsedValue)

    if (!result.meta.inserted) {
      setStatusMessage(`O valor ${parsedValue} ja existe na arvore. Este estudo nao usa duplicatas.`)
      appendLog({
        kind: 'insert',
        action: 'none',
        message: `Tentativa ignorada: ${parsedValue} ja estava presente.`,
      })
      return
    }

    const actionKind = getActionKind(result.meta)
    const actionMessage = buildActionMessage(result.meta)

    setRoot(result.root)
    setLastInsertedValue(parsedValue)
    setLastAction(actionKind)
    setHighlightValues(result.meta.highlightValues)
    setValueInput('')

    setStatusMessage(`Valor ${parsedValue} inserido. ${actionMessage}`)
    appendLog({
      kind: 'insert',
      action: actionKind,
      message: `Insercao de ${parsedValue}. ${actionMessage}`,
    })
  }

  const handleLoadPreset = (presetId: string) => {
    const preset = RB_PRESETS.find((item) => item.id === presetId)

    if (!preset) {
      return
    }

    const result = buildRedBlackFromValues(preset.values)
    const finalMeta = result.metas[result.metas.length - 1]
    const actionKind = finalMeta ? getActionKind(finalMeta) : 'none'

    setRoot(result.root)
    setLastInsertedValue(finalMeta?.value ?? null)
    setLastAction(actionKind)
    setHighlightValues(finalMeta?.highlightValues ?? [])

    const presetMessage = `${preset.label}: insercoes ${preset.values.join(' -> ')}. ${
      finalMeta ? buildActionMessage(finalMeta) : ''
    }`
    setStatusMessage(presetMessage)
    appendLog({
      kind: 'preset',
      action: actionKind,
      message: `Preset carregado (${preset.label}). ${preset.description}`,
    })
  }

  const handleReset = () => {
    setRoot(null)
    setValueInput('')
    setLastAction('none')
    setLastInsertedValue(null)
    setHighlightValues([])
    setStatusMessage('Laboratorio reiniciado. Escolha um preset ou monte uma nova sequencia manualmente.')
    appendLog({
      kind: 'preset',
      action: 'none',
      message: 'Arvore reiniciada para um novo experimento.',
    })
  }

  return (
    <section className="mt-6 battle-card rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
            Arvores Balanceadas
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Laboratorio Rubro-Negra</h2>
          <p className="mt-3 text-slate-600">
            Estude insercoes em arvore rubro-negra observando as cores dos nos, a altura preta e como
            o balanceamento se restaura por recoloracao e rotacoes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalNodes}
              <span className="ml-2 text-sm font-semibold text-rose-600">{redNodes} rubros</span>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Altura preta</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{blackHeight}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raiz</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{root?.value ?? '-'}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultima acao</p>
            <p className="mt-2 text-base font-bold text-slate-900">{actionLabel[lastAction]}</p>
          </article>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        {statusMessage}
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={handleInsert}>
            <input
              type="number"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Ex.: 42"
              className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700"
            >
              Inserir valor
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Reiniciar
            </button>
          </form>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {RB_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.id)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-rose-300 hover:bg-rose-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{preset.label}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryTone[preset.category]}`}>
                    {categoryLabel[preset.category]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{preset.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sequencia: {preset.values.join(' -> ')}
                </p>
              </button>
            ))}
          </div>

          <div className="relative mt-6 flex min-h-[560px] flex-col justify-center rounded-2xl border border-slate-200 bg-slate-950 p-4">
            {showAction && (
              <div className="tree-event-badge pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/90 px-4 py-2 shadow-lg backdrop-blur">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
                    <span className="inline-block h-3 w-3 rounded-full bg-slate-200" />
                  </span>
                  <span className="text-sm font-semibold text-white">{actionLabel[lastAction]}</span>
                </div>
              </div>
            )}
            {root ? (
              <div className="overflow-x-auto">
                <svg
                  width={layout.width}
                  height={layout.height}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  className="mx-auto block"
                  role="img"
                  aria-label="Visualizacao da arvore rubro-negra"
                >
                  {layout.edges.map((edge) => {
                    const from = animatedNodes.find((node) => node.value === edge.from)
                    const to = animatedNodes.find((node) => node.value === edge.to)

                    if (!from || !to) {
                      return null
                    }

                    return (
                      <line
                        key={`${edge.from}-${edge.to}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#334155"
                        strokeWidth="2"
                      />
                    )
                  })}

                  {animatedNodes.map((node) => {
                    const isInserted = lastInsertedValue === node.value
                    const isHighlighted = showAction && highlightValues.includes(node.value)
                    const strokeColor = isInserted ? '#34d399' : isHighlighted ? '#f59e0b' : '#e2e8f0'

                    return (
                      <g key={node.value} transform={`translate(${node.x}, ${node.y})`}>
                        {isHighlighted && (
                          <circle
                            className="tree-highlight-ring"
                            r="26"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                          />
                        )}
                        <g className={enteringValues.has(node.value) ? 'tree-node-enter' : undefined}>
                          <circle
                            r="24"
                            fill={NODE_FILL[node.color]}
                            stroke={strokeColor}
                            strokeWidth="3"
                          />
                          <text
                            y="5"
                            textAnchor="middle"
                            fontSize="14"
                            fontWeight="700"
                            fill="#f8fafc"
                          >
                            {node.value}
                          </text>
                        </g>
                        <text
                          y="42"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill={node.color === 'red' ? '#fca5a5' : '#94a3b8'}
                        >
                          {node.color === 'red' ? 'rubro' : 'negro'}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 text-center text-slate-400">
                Carregue um caso classico ou insira valores para ver a rubro-negra nascer.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Regras da rubro-negra</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              <li>1. Todo no e rubro ou negro; a raiz e sempre negra.</li>
              <li>2. Um no rubro nunca pode ter um filho rubro (sem vermelhos consecutivos).</li>
              <li>3. Todo caminho da raiz ate as folhas tem a mesma quantidade de nos negros.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Ao inserir, o no nasce rubro. Se isso quebrar a regra 2, a arvore conserta com
              <span className="font-semibold text-amber-700"> recoloracao</span> ou
              <span className="font-semibold text-sky-700"> rotacoes</span>.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Altura preta atual: <span className="text-rose-700">{blackHeight}</span>
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">Historico de operacoes</h3>
            <div className="mt-3 space-y-3">
              {operationLog.length === 0 ? (
                <p className="text-sm text-slate-600">Nenhuma operacao registrada ainda.</p>
              ) : (
                operationLog.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.kind === 'insert' ? 'Insercao manual' : 'Preset demonstrativo'}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionTone[entry.action]}`}>
                        {actionLabel[entry.action]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{entry.message}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
