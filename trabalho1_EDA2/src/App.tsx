import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { PRESET_SYSTEM_TAGS } from './tagData'
import { BATTLE_ALGORITHMS } from './utils/algorithms'
import { runBattleRound } from './utils/benchmark'
import type { BattleRound, ScoreEntry } from './types/search'
import SortingVisualizer from './components/SortingVisualizer'
import AvlStudyLab from './components/AvlStudyLab'


function buildInitialScoreboard(): ScoreEntry[] {
  return BATTLE_ALGORITHMS.map((algorithm) => ({
    algorithmId: algorithm.id,
    algorithmName: algorithm.name,
    points: 0,
    wins: 0,
  }))
}

function App() {
  const [tagName, setTagName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [systemTags, setSystemTags] = useState<string[]>(PRESET_SYSTEM_TAGS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(BATTLE_ALGORITHMS[0]?.id ?? '')
  const [battleHistory, setBattleHistory] = useState<BattleRound[]>([])
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>(buildInitialScoreboard)
  const [playerPoints, setPlayerPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(
    'Faça uma busca e escolha um algoritmo para tentar prever o vencedor da rodada.',
  )
  const [systemTagsVisible, setSystemTagsVisible] = useState(true)

  const searchableTags = useMemo(() => [...tags, ...systemTags], [tags, systemTags])
  const sortedSearchableTags = useMemo(
    () => [...searchableTags].sort((first, second) => first.localeCompare(second)),
    [searchableTags],
  )

  const ranking = useMemo(
    () => [...scoreboard].sort((first, second) => second.points - first.points),
    [scoreboard],
  )

  const latestRound = battleHistory[0] ?? null
  
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextTag = tagName.trim()
    if (!nextTag) {
      return
    }

    setTags((currentTags) => [...currentTags, nextTag])
    setTagName('')
  }

  const handleAddSystemTags = () => {
    setSystemTags(PRESET_SYSTEM_TAGS)
  }

  const handleRandomTag = () => {
    if (searchableTags.length === 0) return
    const randomIndex = Math.floor(Math.random() * searchableTags.length)
    setSearchTerm(searchableTags[randomIndex])
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedSearch = searchTerm.trim()
    if (!trimmedSearch || !selectedAlgorithmId) {
      return
    }

    const round = runBattleRound(
      BATTLE_ALGORITHMS,
      searchableTags,
      sortedSearchableTags,
      trimmedSearch,
      { repetitions: 50, warmupRepetitions: 12 },
    )

    setBattleHistory((currentHistory) => [round, ...currentHistory].slice(0, 25))

    setScoreboard((currentScoreboard) =>
      currentScoreboard.map((entry) => {
        if (round.winnerAlgorithmId !== entry.algorithmId) {
          return entry
        }

        return {
          ...entry,
          points: entry.points + 1,
          wins: entry.wins + 1,
        }
      }),
    )

    if (round.winnerAlgorithmId === null) {
      setStreak(0)
      setFeedback('Empate nesta rodada. Nenhum algoritmo pontuou e seu palpite não valeu ponto.')
      return
    }

    const winner = round.results.find((result) => result.algorithmId === round.winnerAlgorithmId)
    const selectedAlgorithm = BATTLE_ALGORITHMS.find(
      (algorithm) => algorithm.id === selectedAlgorithmId,
    )
    const playerWonPoint = round.winnerAlgorithmId === selectedAlgorithmId

    setStreak((currentStreak) => currentStreak + 1)
    if (playerWonPoint) {
      setPlayerPoints((currentPoints) => currentPoints + 1)
      setFeedback(
        `Rodada vencida por ${winner?.algorithmName ?? 'algoritmo desconhecido'}. Você acertou o palpite e ganhou 1 ponto.`,
      )
      return
    }

    setFeedback(
      `Rodada vencida por ${winner?.algorithmName ?? 'algoritmo desconhecido'}. Seu palpite foi ${selectedAlgorithm?.name ?? 'algoritmo desconhecido'}.`,
    )
  }

  const winnerId = latestRound?.winnerAlgorithmId ?? null
  const winnerName = winnerId
    ? latestRound?.results.find((result) => result.algorithmId === winnerId)?.algorithmName
    : null

  const isSingleLeader = ranking.length > 1 && ranking[0].points > ranking[1].points
  const leaderText = isSingleLeader
    ? `${ranking[0].algorithmName} está liderando.`
    : 'Placar empatado no momento.'

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="battle-card rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Modo Batalha</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Gamificação de busca por tags</h1>
            <p className="mt-3 text-slate-600">
              A cada busca, os algoritmos competem em performance. Escolha seu palpite antes da
              rodada: se acertar o vencedor, você ganha 1 ponto. Empate não pontua.
            </p>

        <form className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto]" onSubmit={handleSearchSubmit}>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Digite a tag para a rodada"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleRandomTag}
              title="Escolher tag aleatória"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Aleatória
            </button>
          </div>
          <select
            value={selectedAlgorithmId}
            onChange={(event) => setSelectedAlgorithmId(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
          >
            {BATTLE_ALGORITHMS.map((algorithm) => (
              <option key={algorithm.id} value={algorithm.id}>
                {algorithm.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Iniciar rodada
          </button>
        </form>

        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {feedback}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Streak</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{streak}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rodadas</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{battleHistory.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seus pontos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{playerPoints}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ranking</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{leaderText}</p>
          </article>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Placar</h2>
          <div className="mt-3 space-y-3">
            {ranking.map((entry) => {
              const algorithm = BATTLE_ALGORITHMS.find((a) => a.id === entry.algorithmId)
              return (
                <div
                  key={entry.algorithmId}
                  className="rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{entry.algorithmName}</p>
                    <p className="text-lg font-bold text-emerald-700">{entry.points} pts</p>
                  </div>
                  <p className="text-sm text-slate-500">Vitórias: {entry.wins}</p>
                  {algorithm && (
                    <>
                      <p className="mt-2 text-sm text-slate-600">{algorithm.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Complexidade — melhor: {algorithm.complexity.best} · média: {algorithm.complexity.average} · pior: {algorithm.complexity.worst}
                        {algorithm.requiresSorted && ' · requer lista ordenada'}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>


        {latestRound && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Última rodada</h2>
            <p className="mt-2 text-sm text-slate-700">
              Busca: <strong>{latestRound.query}</strong>
            </p>
            <p className="text-sm text-slate-700">
              Resultado: {winnerName ? `vitória de ${winnerName}` : 'empate'}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latestRound.results.map((result) => (
                <article
                  key={result.algorithmId}
                  className={`rounded-xl border px-3 py-3 ${
                    winnerId === result.algorithmId
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{result.algorithmName}</p>
                  <p className="text-sm text-slate-700">Mediana: {result.medianTimeMs.toFixed(4)} ms</p>
                  <p className="text-sm text-slate-700">Média: {result.averageTimeMs.toFixed(4)} ms</p>
                  <p className="text-sm text-slate-700">Acessos: {result.accessCount}</p>
                  <p className="text-sm text-slate-700">
                    {result.found
                      ? `Tag encontrada no índice ${result.foundIndex}.`
                      : 'Tag não encontrada.'}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <SortingVisualizer />
      <AvlStudyLab />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Cadastro local</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Criar tags</h2>
        <p className="mt-3 text-slate-600">
          Digite uma tag e clique em salvar. Ela fica visível apenas enquanto a página estiver
          aberta.
        </p>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={tagName}
            onChange={(event) => setTagName(event.target.value)}
            placeholder="Ex.: estudos"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
          >
            Salvar
          </button>
        </form>

        <button
          type="button"
          onClick={handleAddSystemTags}
          className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Recarregar 104000 tags do sistema
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tags criadas</h2>

        {tags.length === 0 ? (
          <p className="mt-3 text-slate-600">Nenhuma tag cadastrada ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tags.map((tag, index) => (
              <li
                key={`${tag}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Tags do sistema</h2>
          <button
            type="button"
            className="flex transform items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            onClick={() => setSystemTagsVisible((visible) => !visible)}
            aria-expanded={systemTagsVisible}
          >
            <span
              className={`transition-transform duration-200 ${
                systemTagsVisible ? 'rotate-0' : '-rotate-90'
              }`}
            >
              ↓
            </span>
          </button>
        </div>

        {systemTagsVisible && (
          <>
            {systemTags.length === 0 ? (
              <p className="mt-3 text-slate-600">Nenhuma tag do sistema foi adicionada ainda.</p>
            ) : (
              <p className="mt-3 max-h-72 overflow-y-auto leading-7 text-slate-700">
                {systemTags.join(', ')}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
