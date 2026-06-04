export type Complexity = {
  best: string
  average: string
  worst: string
}

export type SearchRunResult = {
  index: number
  accessCount: number
}

export type SearchAlgorithm = {
  id: string
  name: string
  description: string
  complexity: Complexity
  requiresSorted: boolean
  search: (list: string[], target: string) => SearchRunResult
}

export type AlgorithmRoundResult = {
  algorithmId: string
  algorithmName: string
  foundIndex: number
  found: boolean
  accessCount: number
  medianTimeMs: number
  averageTimeMs: number
  minTimeMs: number
  maxTimeMs: number
  scannedItems: number
}

export type BattleRound = {
  query: string
  results: AlgorithmRoundResult[]
  winnerAlgorithmId: string | null
  createdAt: number
}

export type ScoreEntry = {
  algorithmId: string
  algorithmName: string
  points: number
  wins: number
}

export type Achievement = {
  id: string
  label: string
  unlocked: boolean
}
