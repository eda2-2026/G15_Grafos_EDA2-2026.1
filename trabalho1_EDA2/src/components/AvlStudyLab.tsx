import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AVL_PRESETS,
  buildAvlFromValues,
  buildAvlLayout,
  countNodes,
  getBalanceFactor,
  insertIntoAvl,
  type AvlNode,
  type RotationType,
} from '../utils/avl'

type OperationLogEntry = {
  id: number
  kind: 'insert' | 'preset'
  message: string
  rotation: RotationType
}

const rotationTone: Record<RotationType, string> = {
  none: 'bg-slate-100 text-slate-700',
  LL: 'bg-emerald-100 text-emerald-700',
  RR: 'bg-sky-100 text-sky-700',
  LR: 'bg-amber-100 text-amber-700',
  RL: 'bg-rose-100 text-rose-700',
}

function buildRotationMessage(rotation: RotationType, pivotValue: number | null) {
  if (rotation === 'none') {
    return 'Nenhuma rotacao foi necessaria.'
  }

  const pivotText = pivotValue === null ? '' : ` no valor ${pivotValue}`

  if (rotation === 'LL') {
    return `Desbalanceamento LL detectado${pivotText}. O rebalanceamento usou rotacao simples a direita.`
  }

  if (rotation === 'RR') {
    return `Desbalanceamento RR detectado${pivotText}. O rebalanceamento usou rotacao simples a esquerda.`
  }

  if (rotation === 'LR') {
    return `Desbalanceamento LR detectado${pivotText}. O rebalanceamento usou rotacao dupla esquerda-direita.`
  }

  return `Desbalanceamento RL detectado${pivotText}. O rebalanceamento usou rotacao dupla direita-esquerda.`
}

export default function AvlStudyLab() {
  const [root, setRoot] = useState<AvlNode | null>(null)
  const [valueInput, setValueInput] = useState('')
  const [statusMessage, setStatusMessage] = useState(
    'Comece inserindo valores ou carregue um dos quatro casos classicos de AVL.',
  )
  const [lastRotation, setLastRotation] = useState<RotationType>('none')
  const [lastInsertedValue, setLastInsertedValue] = useState<number | null>(null)
  const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([])

  const totalNodes = useMemo(() => countNodes(root), [root])
  const rootBalance = useMemo(() => getBalanceFactor(root), [root])
  const layout = useMemo(() => buildAvlLayout(root), [root])

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
      setStatusMessage('Digite um numero inteiro para inserir na AVL.')
      return
    }

    const result = insertIntoAvl(root, parsedValue)

    if (!result.meta.inserted) {
      setStatusMessage(`O valor ${parsedValue} ja existe na arvore. A AVL nao permite duplicatas neste estudo.`)
      appendLog({
        kind: 'insert',
        rotation: 'none',
        message: `Tentativa ignorada: ${parsedValue} ja estava presente.`,
      })
      return
    }

    setRoot(result.root)
    setLastInsertedValue(parsedValue)
    setLastRotation(result.meta.rotation)
    setValueInput('')

    const rotationMessage = buildRotationMessage(result.meta.rotation, result.meta.pivotValue)
    setStatusMessage(`Valor ${parsedValue} inserido. ${rotationMessage}`)
    appendLog({
      kind: 'insert',
      rotation: result.meta.rotation,
      message: `Insercao de ${parsedValue}. ${rotationMessage}`,
    })
  }

  const handleLoadPreset = (presetId: string) => {
    const preset = AVL_PRESETS.find((item) => item.id === presetId)

    if (!preset) {
      return
    }

    const result = buildAvlFromValues(preset.values)
    const finalMeta = result.metas[result.metas.length - 1]

    setRoot(result.root)
    setLastInsertedValue(finalMeta?.value ?? null)
    setLastRotation(finalMeta?.rotation ?? 'none')

    const presetMessage = `${preset.label}: insercoes ${preset.values.join(' -> ')}. ${buildRotationMessage(
      finalMeta?.rotation ?? 'none',
      finalMeta?.pivotValue ?? null,
    )}`
    setStatusMessage(presetMessage)
    appendLog({
      kind: 'preset',
      rotation: finalMeta?.rotation ?? 'none',
      message: `Preset carregado (${preset.label}). ${preset.description}`,
    })
  }

  const handleReset = () => {
    setRoot(null)
    setValueInput('')
    setLastRotation('none')
    setLastInsertedValue(null)
    setStatusMessage('Laboratorio reiniciado. Escolha um preset ou monte uma nova sequencia manualmente.')
    appendLog({
      kind: 'preset',
      rotation: 'none',
      message: 'Arvore reiniciada para um novo experimento.',
    })
  }

  return (
    <section className="mt-6 battle-card rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Arvores Balanceadas
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Laboratorio AVL</h2>
          <p className="mt-3 text-slate-600">
            Estude insercoes em arvore AVL observando altura, fator de balanceamento e o tipo de
            rotacao usado para restaurar a busca binaria balanceada.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalNodes}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Altura</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{root?.height ?? 0}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raiz</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{root?.value ?? '-'}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultima rotacao</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{lastRotation === 'none' ? '-' : lastRotation}</p>
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
              className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
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
            {AVL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.id)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{preset.label}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rotationTone[preset.expectedRotation]}`}>
                    {preset.expectedRotation}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{preset.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sequencia: {preset.values.join(' -> ')}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-4">
            {root ? (
              <div className="overflow-x-auto">
                <svg
                  width={layout.width}
                  height={layout.height}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  className="mx-auto block"
                  role="img"
                  aria-label="Visualizacao da arvore AVL"
                >
                  {layout.edges.map((edge) => {
                    const from = layout.nodes.find((node) => node.value === edge.from)
                    const to = layout.nodes.find((node) => node.value === edge.to)

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

                  {layout.nodes.map((node) => (
                    <g key={node.value} transform={`translate(${node.x}, ${node.y})`}>
                      <circle
                        r="24"
                        fill={lastInsertedValue === node.value ? '#10b981' : '#0ea5e9'}
                        stroke="#e2e8f0"
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
                      <text
                        y="42"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#cbd5e1"
                      >
                        FB {node.balance}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 text-center text-slate-400">
                Carregue um caso classico ou insira valores para ver a AVL nascer.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Leitura rapida da arvore</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Cada no mostra o valor armazenado e, logo abaixo, o fator de balanceamento (`FB`),
              calculado por altura da esquerda menos altura da direita.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Enquanto o `FB` permanecer entre `-1` e `1`, a AVL continua balanceada. Fora desse
              intervalo, alguma das rotacoes `LL`, `RR`, `LR` ou `RL` precisa acontecer.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Fator da raiz atual: <span className="text-sky-700">{rootBalance}</span>
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rotationTone[entry.rotation]}`}>
                        {entry.rotation === 'none' ? 'Sem rotacao' : entry.rotation}
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
