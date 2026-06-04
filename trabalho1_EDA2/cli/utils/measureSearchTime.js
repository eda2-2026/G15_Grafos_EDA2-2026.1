import { performance } from 'node:perf_hooks'

export function measureSearchTime(
  searchFunction,
  tags,
  targetTag,
  repetitions = 1,
) {
  // O relogio e iniciado imediatamente antes de repetir varias buscas.
  const startTime = performance.now()
  let lastFoundIndex = -1

  for (let i = 0; i < repetitions; i += 1) {
    lastFoundIndex = searchFunction(tags, targetTag)
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime

  return {
    targetTag,
    foundIndex: lastFoundIndex,
    totalTimeMs: totalTime,
    averageTimeMs: totalTime / repetitions,
    repetitions,
  }
}
