import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AVL_PRESETS,
  buildAvlLayout,
  countNodes,
  getBalanceFactor,
  insertIntoAvlWithoutBalancing,
  insertIntoAvlWithPlayback,
  type AvlNode,
  type AvlLayoutNode,
  type AvlPlaybackStep,
  type RotationType,
} from '../utils/avl'
import { useAnimatedTreeLayout } from '../utils/useAnimatedTreeLayout'

const PLAYBACK_STEP_DELAY_MS = 2000
const PRESET_INSERT_STEP_DELAY_MS = 700

type OperationLogEntry = {
  id: number
  kind: 'insert' | 'preset'
  message: string
  rotation: RotationType
}

type PreparedAvlPreset = {
  presetId: string
  label: string
  description: string
  values: number[]
  preparedRoot: AvlNode | null
  finalRoot: AvlNode | null
  finalRotation: RotationType
  finalPivotValue: number | null
  rotationSteps: AvlPlaybackStep[]
}

const rotationTone: Record<RotationType, string> = {
  none: 'bg-slate-100 text-slate-700',
  LL: 'bg-emerald-100 text-emerald-700',
  RR: 'bg-sky-100 text-sky-700',
  LR: 'bg-amber-100 text-amber-700',
  RL: 'bg-rose-100 text-rose-700',
}

// Resumo visual exibido sobre a arvore enquanto a rotacao acontece.
const rotationHint: Record<Exclude<RotationType, 'none'>, { icon: string; label: string }> = {
  LL: { icon: '↻', label: 'Rotacao simples a direita' },
  RR: { icon: '↺', label: 'Rotacao simples a esquerda' },
  LR: { icon: '↺↻', label: 'Rotacao dupla esquerda-direita' },
  RL: { icon: '↻↺', label: 'Rotacao dupla direita-esquerda' },
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
  const [sequenceValues, setSequenceValues] = useState<number[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>(AVL_PRESETS[0]?.id ?? '')
  const [statusMessage, setStatusMessage] = useState(
    'Comece inserindo valores ou carregue um dos quatro casos classicos de AVL.',
  )
  const [lastRotation, setLastRotation] = useState<RotationType>('none')
  const [lastInsertedValue, setLastInsertedValue] = useState<number | null>(null)
  const [lastPivotValue, setLastPivotValue] = useState<number | null>(null)
  const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([])
  const [preparedPreset, setPreparedPreset] = useState<PreparedAvlPreset | null>(null)
  const [isPreparingPreset, setIsPreparingPreset] = useState(false)
  const [isPlayingPreset, setIsPlayingPreset] = useState(false)
  const playbackRunIdRef = useRef(0)

  const totalNodes = useMemo(() => countNodes(root), [root])
  const rootBalance = useMemo(() => getBalanceFactor(root), [root])
  const layout = useMemo(() => buildAvlLayout(root), [root])
  const { nodes: animatedNodes, enteringValues, isAnimating } = useAnimatedTreeLayout<AvlLayoutNode>(layout)

  // Rotacao destacada durante a animacao (null quando nao ha rotacao a mostrar).
  const activeRotation = isAnimating && lastRotation !== 'none' ? lastRotation : null

  const appendLog = (entry: Omit<OperationLogEntry, 'id'>) => {
    setOperationLog((currentLog) => [
      { id: Date.now() + currentLog.length, ...entry },
      ...currentLog,
    ].slice(0, 8))
  }

  useEffect(() => {
    return () => {
      playbackRunIdRef.current += 1
    }
  }, [])

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const stopPlayback = () => {
    playbackRunIdRef.current += 1
    setIsPreparingPreset(false)
    setIsPlayingPreset(false)
  }

  const applyPlaybackStep = (step: AvlPlaybackStep) => {
    setRoot(step.root)
    setLastInsertedValue(step.value)
    setLastRotation(step.stage === 'rotation' ? step.rotation : 'none')
    setLastPivotValue(step.stage === 'rotation' ? step.pivotValue : null)
  }

  const clearPreparedScenario = () => {
    setPreparedPreset(null)
  }

  const preparePreset = async (presetId: string) => {
    const preset = AVL_PRESETS.find((item) => item.id === presetId)

    if (!preset) {
      return
    }

    const runId = playbackRunIdRef.current + 1
    playbackRunIdRef.current = runId
    setSelectedPresetId(presetId)
    clearPreparedScenario()
    setSequenceValues([])
    setIsPreparingPreset(true)
    setRoot(null)
    setLastRotation('none')
    setLastInsertedValue(null)
    setLastPivotValue(null)
    setStatusMessage(`Preparando ${preset.label}: ${preset.values.join(' -> ')}.`)

    let currentRoot: AvlNode | null = null
    let preparedRoot: AvlNode | null = null
    let finalRoot: AvlNode | null = null
    let finalRotation: RotationType = 'none'
    let finalPivotValue: number | null = null
    let rotationSteps: AvlPlaybackStep[] = []

    try {
      for (let index = 0; index < preset.values.length; index += 1) {
        const value = preset.values[index]
        const isLastValue = index === preset.values.length - 1

        if (isLastValue) {
          const result = insertIntoAvlWithPlayback(currentRoot, value)
          const insertStep = result.steps.find((step) => step.stage === 'insert')

          preparedRoot = insertStep?.root ?? result.root
          finalRoot = result.root
          finalRotation = result.meta.rotation
          finalPivotValue = result.meta.pivotValue
          rotationSteps = result.steps.filter((step) => step.stage === 'rotation')
          currentRoot = preparedRoot
        } else {
          const result = insertIntoAvlWithoutBalancing(currentRoot, value)
          currentRoot = result.root
        }

        if (playbackRunIdRef.current !== runId) {
          return
        }

        setRoot(currentRoot)
        setLastInsertedValue(value)
        setLastRotation('none')
        setLastPivotValue(null)

        if (isLastValue && finalRotation !== 'none') {
          setStatusMessage(`Arvore montada com ${preset.values.join(' -> ')}. Clique em um botao para iniciar as rotacoes.`)
        } else {
          setStatusMessage(`Inserindo ${value} para montar a arvore do caso ${preset.label}.`)
        }

        await sleep(PRESET_INSERT_STEP_DELAY_MS)
      }

      if (playbackRunIdRef.current !== runId) {
        return
      }

      setSequenceValues(preset.values)
      setPreparedPreset({
        presetId,
        label: preset.label,
        description: preset.description,
        values: preset.values,
        preparedRoot,
        finalRoot,
        finalRotation,
        finalPivotValue,
        rotationSteps,
      })
    } finally {
      if (playbackRunIdRef.current === runId) {
        setIsPreparingPreset(false)
      }
    }
  }

  const runPresetStepByStep = async () => {
    if (!preparedPreset || isPreparingPreset || isPlayingPreset) {
      return
    }

    const runId = playbackRunIdRef.current + 1
    playbackRunIdRef.current = runId
    setIsPlayingPreset(true)

    try {
      for (let index = 0; index < preparedPreset.rotationSteps.length; index += 1) {
        if (playbackRunIdRef.current !== runId) {
          return
        }

        const step = preparedPreset.rotationSteps[index]
        applyPlaybackStep(step)
        setStatusMessage(
          `Rotacao ${preparedPreset.finalRotation} em execucao (${index + 1}/${preparedPreset.rotationSteps.length}).`,
        )
        await sleep(PLAYBACK_STEP_DELAY_MS)
      }

      if (playbackRunIdRef.current !== runId) {
        return
      }

      setRoot(preparedPreset.finalRoot)
      setSequenceValues(preparedPreset.values)
      setLastInsertedValue(preparedPreset.values[preparedPreset.values.length - 1] ?? null)
      setLastRotation(preparedPreset.finalRotation)
      setLastPivotValue(preparedPreset.finalPivotValue)
      setStatusMessage(
        `${preparedPreset.label}: insercoes ${preparedPreset.values.join(' -> ')}. ${buildRotationMessage(
          preparedPreset.finalRotation,
          preparedPreset.finalPivotValue,
        )}`,
      )
      appendLog({
        kind: 'preset',
        rotation: preparedPreset.finalRotation,
        message: `Preset executado passo a passo (${preparedPreset.label}). ${preparedPreset.description}`,
      })
      clearPreparedScenario()
    } finally {
      if (playbackRunIdRef.current === runId) {
        setIsPlayingPreset(false)
      }
    }
  }

  const handleInsert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    stopPlayback()
    if (preparedPreset && preparedPreset.rotationSteps.length > 0) {
      setStatusMessage('Existe uma rotacao pendente. Clique em "Iniciar rotacoes" ou "Fazer tudo de uma vez" antes de inserir outro valor.')
      return
    }
    clearPreparedScenario()

    const parsedValue = Number(valueInput)
    if (!Number.isInteger(parsedValue)) {
      setStatusMessage('Digite um numero inteiro para inserir na AVL.')
      return
    }

    const result = insertIntoAvlWithPlayback(root, parsedValue)

    if (!result.meta.inserted) {
      setStatusMessage(`O valor ${parsedValue} ja existe na arvore. A AVL nao permite duplicatas neste estudo.`)
      appendLog({
        kind: 'insert',
        rotation: 'none',
        message: `Tentativa ignorada: ${parsedValue} ja estava presente.`,
      })
      return
    }

    const insertStep = result.steps.find((step) => step.stage === 'insert')
    const preparedRoot = insertStep?.root ?? result.root
    const rotationSteps = result.steps.filter((step) => step.stage === 'rotation')
    const nextValues = [...sequenceValues, parsedValue]

    setRoot(preparedRoot)
    setSequenceValues(nextValues)
    setLastInsertedValue(parsedValue)
    setLastRotation('none')
    setLastPivotValue(null)
    setValueInput('')

    if (rotationSteps.length > 0) {
      setPreparedPreset({
        presetId: 'manual',
        label: 'Sequencia manual',
        description: 'Arvore montada manualmente pelo usuario.',
        values: nextValues,
        preparedRoot,
        finalRoot: result.root,
        finalRotation: result.meta.rotation,
        finalPivotValue: result.meta.pivotValue,
        rotationSteps,
      })
      setStatusMessage(`Valor ${parsedValue} inserido. A arvore foi montada; clique em um botao para iniciar a rotacao ${result.meta.rotation}.`)
    } else {
      setStatusMessage(`Valor ${parsedValue} inserido. Nenhuma rotacao foi necessaria.`)
    }

    appendLog({
      kind: 'insert',
      rotation: result.meta.rotation,
      message: `Insercao de ${parsedValue}. ${buildRotationMessage(result.meta.rotation, result.meta.pivotValue)}`,
    })
  }

  const handleLoadPreset = (presetId: string) => {
    if (!preparedPreset || preparedPreset.presetId !== presetId || isPreparingPreset || isPlayingPreset) {
      return
    }

    setRoot(preparedPreset.finalRoot)
    setSequenceValues(preparedPreset.values)
    setLastInsertedValue(preparedPreset.values[preparedPreset.values.length - 1] ?? null)
    setLastRotation(preparedPreset.finalRotation)
    setLastPivotValue(preparedPreset.finalPivotValue)

    const presetMessage = `${preparedPreset.label}: insercoes ${preparedPreset.values.join(' -> ')}. ${buildRotationMessage(
      preparedPreset.finalRotation,
      preparedPreset.finalPivotValue,
    )}`
    setStatusMessage(presetMessage)
    appendLog({
      kind: 'preset',
      rotation: preparedPreset.finalRotation,
      message: `Preset finalizado de uma vez (${preparedPreset.label}). ${preparedPreset.description}`,
    })
    clearPreparedScenario()
  }

  const handleReset = () => {
    stopPlayback()
    clearPreparedScenario()
    setRoot(null)
    setSequenceValues([])
    setValueInput('')
    setLastRotation('none')
    setLastInsertedValue(null)
    setLastPivotValue(null)
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
              disabled={isPreparingPreset || isPlayingPreset}
              className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isPreparingPreset || isPlayingPreset}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Inserir valor
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isPreparingPreset || isPlayingPreset}
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
                onClick={() => preparePreset(preset.id)}
                disabled={isPreparingPreset || isPlayingPreset}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  selectedPresetId === preset.id
                    ? 'border-sky-400 bg-sky-50'
                    : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50'
                } disabled:cursor-not-allowed disabled:opacity-60`}
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

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={runPresetStepByStep}
              disabled={!preparedPreset || isPreparingPreset || isPlayingPreset}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPreparingPreset
                ? 'Montando arvore...'
                : isPlayingPreset
                  ? 'Executando rotacoes...'
                  : 'Iniciar rotacoes'}
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset(selectedPresetId)}
              disabled={!preparedPreset || isPreparingPreset || isPlayingPreset}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Fazer tudo de uma vez
            </button>
          </div>

          <div className="relative mt-6 flex min-h-[560px] flex-col justify-center rounded-2xl border border-slate-200 bg-slate-950 p-4">
            {activeRotation && (
              <div className="tree-event-badge pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/90 px-4 py-2 shadow-lg backdrop-blur">
                  <span className="text-xl leading-none text-white">{rotationHint[activeRotation].icon}</span>
                  <span className="text-sm font-semibold text-white">
                    Rotacao {activeRotation}
                  </span>
                  <span className="hidden text-xs text-slate-300 sm:inline">
                    {rotationHint[activeRotation].label}
                  </span>
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
                  aria-label="Visualizacao da arvore AVL"
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
                    const isPivot = activeRotation !== null && lastPivotValue === node.value

                    return (
                      <g key={node.value} transform={`translate(${node.x}, ${node.y})`}>
                        {isPivot && (
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
                            fill={isInserted ? '#10b981' : '#0ea5e9'}
                            stroke={isPivot ? '#f59e0b' : '#e2e8f0'}
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
                          fill="#cbd5e1"
                        >
                          FB {node.balance}
                        </text>
                      </g>
                    )
                  })}
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
