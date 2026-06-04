import type { AlgorithmRoundResult, BattleRound, SearchAlgorithm } from '../types/search'

type BenchmarkOptions = {
  repetitions?: number
  warmupRepetitions?: number
}

function calculateMedian(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function runAlgorithm(
  algorithm: SearchAlgorithm,
  list: string[],
  query: string,
  options?: BenchmarkOptions,
): AlgorithmRoundResult {
  const repetitions = options?.repetitions ?? 40
  const warmupRepetitions = options?.warmupRepetitions ?? 10
  const durationResults: number[] = []

  const sampleRun = algorithm.search(list, query)

  for (let index = 0; index < warmupRepetitions; index += 1) {
    algorithm.search(list, query)
  }

  for (let index = 0; index < repetitions; index += 1) {
    const startTime = performance.now()
    algorithm.search(list, query)
    const endTime = performance.now()
    durationResults.push(endTime - startTime)
  }

  const totalTime = durationResults.reduce((sum, value) => sum + value, 0)

  return {
    algorithmId: algorithm.id,
    algorithmName: algorithm.name,
    foundIndex: sampleRun.index,
    found: sampleRun.index !== -1,
    accessCount: sampleRun.accessCount,
    medianTimeMs: calculateMedian(durationResults),
    averageTimeMs: totalTime / durationResults.length,
    minTimeMs: Math.min(...durationResults),
    maxTimeMs: Math.max(...durationResults),
    scannedItems: list.length,
  }
}

function pickRoundWinner(results: AlgorithmRoundResult[]) {
  if (results.length === 0) {
    return null
  }

  const bestMedianTime = Math.min(...results.map((result) => result.medianTimeMs))
  const medianWinners = results.filter((result) => result.medianTimeMs === bestMedianTime)

  if (medianWinners.length === 1) {
    return medianWinners[0].algorithmId
  }

  const bestAverageTime = Math.min(...medianWinners.map((result) => result.averageTimeMs))
  const averageWinners = medianWinners.filter(
    (result) => result.averageTimeMs === bestAverageTime,
  )

  if (averageWinners.length === 1) {
    return averageWinners[0].algorithmId
  }

  const bestAccessCount = Math.min(...averageWinners.map((result) => result.accessCount))
  const accessWinners = averageWinners.filter((result) => result.accessCount === bestAccessCount)

  if (accessWinners.length === 1) {
    return accessWinners[0].algorithmId
  }

  return null
}

export function runBattleRound(
  algorithms: SearchAlgorithm[],
  normalList: string[],
  sortedList: string[],
  query: string,
  options?: BenchmarkOptions,
): BattleRound {
  const results = algorithms.map((algorithm) => {
    const selectedList = algorithm.requiresSorted ? sortedList : normalList
    return runAlgorithm(algorithm, selectedList, query, options)
  })

  const winnerAlgorithmId = pickRoundWinner(results)

  return {
    query,
    results,
    winnerAlgorithmId,
    createdAt: Date.now(),
  }
}
