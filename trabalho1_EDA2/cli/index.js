import { buildLargeTagList, initialTags } from './data/tags.js'
import { sequentialSearch } from './search/sequentialSearch.js'
import { measureSearchTime } from './utils/measureSearchTime.js'

function printHeader(datasetSize, repetitions) {
  console.log('=== Busca Sequencial em Tags ===')
  console.log(`Tags base: [${initialTags.join(', ')}]`)
  console.log(`Dataset total: ${datasetSize} tags`)
  console.log(`Repeticoes por busca: ${repetitions}`)
  console.log('')
}

function printResult(result) {
  console.log(`Tag buscada: "${result.targetTag}"`)

  if (result.foundIndex !== -1) {
    console.log(`Resultado: tag encontrada na posicao ${result.foundIndex}.`)
  } else {
    console.log('Resultado: tag nao encontrada.')
  }

  console.log(
    `Tempo total (${result.repetitions} execucoes): ${result.totalTimeMs.toFixed(
      4,
    )} ms`,
  )
  console.log(
    `Tempo medio por execucao: ${result.averageTimeMs.toFixed(4)} ms`,
  )
  console.log('')
}

function main() {
  const DATASET_SIZE = 30000
  const REPETITIONS = 250
  const searchableTags = buildLargeTagList(initialTags, DATASET_SIZE)
  const existingTag = 'hash'
  const missingTag = 'tag-nao-existe'

  printHeader(searchableTags.length, REPETITIONS)

  const existingResult = measureSearchTime(
    sequentialSearch,
    searchableTags,
    existingTag,
    REPETITIONS,
  )

  const missingResult = measureSearchTime(
    sequentialSearch,
    searchableTags,
    missingTag,
    REPETITIONS,
  )

  // A exibicao fica separada da logica da busca e da medicao do tempo.
  printResult(existingResult)
  printResult(missingResult)

  console.log('Complexidade da busca sequencial:')
  console.log('- Melhor caso: O(1)')
  console.log('- Pior caso: O(n)')
  console.log('- Caso medio: O(n)')
}

main()
