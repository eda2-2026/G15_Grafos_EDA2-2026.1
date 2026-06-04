import type { SearchAlgorithm } from '../types/search'

type HashNode = {
  key: string
  firstIndex: number
}

type DynamicHashIndex = {
  buckets: HashNode[][]
  size: number
}

type StaticHashIndex = {
  buckets: HashNode[][]
}

const INITIAL_HASH_CAPACITY = 16
const MAX_LOAD_FACTOR = 0.75
const STATIC_HASH_CAPACITY = 2048

function createEmptyBuckets(capacity: number) {
  return Array.from({ length: capacity }, () => [] as HashNode[])
}

function hashKey(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return hash >>> 0
}

function insertHashNode(indexData: DynamicHashIndex, node: HashNode) {
  const bucketIndex = hashKey(node.key) % indexData.buckets.length
  const bucket = indexData.buckets[bucketIndex]

  for (let index = 0; index < bucket.length; index += 1) {
    if (bucket[index].key === node.key) {
      return false
    }
  }

  bucket.push(node)
  indexData.size += 1
  return true
}

function resizeHashIndex(indexData: DynamicHashIndex) {
  const previousBuckets = indexData.buckets
  indexData.buckets = createEmptyBuckets(previousBuckets.length * 2)
  indexData.size = 0

  for (let bucketIndex = 0; bucketIndex < previousBuckets.length; bucketIndex += 1) {
    const bucket = previousBuckets[bucketIndex]
    for (let nodeIndex = 0; nodeIndex < bucket.length; nodeIndex += 1) {
      insertHashNode(indexData, bucket[nodeIndex])
    }
  }
}

function buildDynamicHashIndex(list: string[]) {
  const hashIndex: DynamicHashIndex = {
    buckets: createEmptyBuckets(INITIAL_HASH_CAPACITY),
    size: 0,
  }

  for (let index = 0; index < list.length; index += 1) {
    const currentValue = list[index]
    const inserted = insertHashNode(hashIndex, { key: currentValue, firstIndex: index })

    if (
      inserted &&
      hashIndex.size / hashIndex.buckets.length > MAX_LOAD_FACTOR
    ) {
      resizeHashIndex(hashIndex)
    }
  }

  return hashIndex
}

function buildStaticHashIndex(list: string[]) {
  const hashIndex: StaticHashIndex = {
    buckets: createEmptyBuckets(STATIC_HASH_CAPACITY),
  }

  for (let index = 0; index < list.length; index += 1) {
    const currentValue = list[index]
    const bucket = hashIndex.buckets[hashKey(currentValue) % hashIndex.buckets.length]

    // Colisoes usam encadeamento simples no bucket para manter o acoplamento baixo.
    let alreadyIndexed = false
    for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
      if (bucket[bucketIndex].key === currentValue) {
        alreadyIndexed = true
        break
      }
    }

    if (!alreadyIndexed) {
      bucket.push({ key: currentValue, firstIndex: index })
    }
  }

  return hashIndex
}

const dynamicHashCache = new WeakMap<string[], DynamicHashIndex>()
const staticHashCache = new WeakMap<string[], StaticHashIndex>()

export const sequentialSearchAlgorithm: SearchAlgorithm = {
  id: 'sequential',
  name: 'Busca Sequencial',
  description:
    'Percorre a lista do índice 0 até o final, comparando cada elemento com o alvo. Não exige nenhuma pré-condição sobre a ordem. Simples de implementar, mas ineficiente em listas grandes porque, no pior caso, todos os n elementos são visitados.',
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  requiresSorted: false,
  search(list, target) {
    let accessCount = 0

    for (let index = 0; index < list.length; index += 1) {
      accessCount += 1
      if (list[index] === target) {
        return { index, accessCount }
      }
    }

    return { index: -1, accessCount }
  },
}

export const binarySearchAlgorithm: SearchAlgorithm = {
  id: 'binary',
  name: 'Busca Binaria',
  description:
    'Exige lista previamente ordenada. A cada passo, calcula o elemento do meio: se for o alvo, retorna; se for menor, descarta a metade esquerda; se for maior, descarta a metade direita. O espaço de busca é reduzido à metade a cada comparação, garantindo O(log n).',
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  requiresSorted: true,
  search(list, target) {
    let left = 0
    let right = list.length - 1
    let accessCount = 0

    while (left <= right) {
      const middle = Math.floor((left + right) / 2)
      accessCount += 1
      const comparison = list[middle].localeCompare(target)

      if (comparison === 0) {
        return { index: middle, accessCount }
      }

      if (comparison < 0) {
        left = middle + 1
      } else {
        right = middle - 1
      }
    }

    return { index: -1, accessCount }
  },
}

export const dynamicHashSearchAlgorithm: SearchAlgorithm = {
  id: 'dynamic-hash',
  name: 'Busca Hash Dinamico',
  description:
    'Constrói um índice hash antes de buscar. A função hash mapeia a chave diretamente para um bucket, tornando a busca O(1) na média. Quando o fator de carga supera 0,75, o número de buckets é dobrado e todos os nós são re-inseridos (rehashing). Colisões são tratadas por encadeamento (chaining).',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(n)',
  },
  requiresSorted: false,
  search(list, target) {
    let hashIndex = dynamicHashCache.get(list)
    if (!hashIndex) {
      hashIndex = buildDynamicHashIndex(list)
      dynamicHashCache.set(list, hashIndex)
    }

    let accessCount = 0

    const lookupBucket = hashIndex.buckets[hashKey(target) % hashIndex.buckets.length]
    for (let index = 0; index < lookupBucket.length; index += 1) {
      accessCount += 1
      if (lookupBucket[index].key === target) {
        return { index: lookupBucket[index].firstIndex, accessCount }
      }
    }

    return { index: -1, accessCount }
  },
}

export const staticHashSearchAlgorithm: SearchAlgorithm = {
  id: 'static-hash',
  name: 'Busca Hash Estatico',
  description:
    'Semelhante ao hash dinâmico, mas com capacidade fixa de 2048 buckets — sem redimensionamento. Colisões também são resolvidas por encadeamento. Se a chave não for confirmada no bucket (ex.: índice desatualizado), cai em busca sequencial como fallback. Boa para conjuntos de tamanho previsível.',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(n)',
  },
  requiresSorted: false,
  search(list, target) {
    let hashIndex = staticHashCache.get(list)
    if (!hashIndex) {
      // O enderecamento permanece fixo; a lista segue como fonte de verdade.
      hashIndex = buildStaticHashIndex(list)
      staticHashCache.set(list, hashIndex)
    }

    let accessCount = 0
    const lookupBucket = hashIndex.buckets[hashKey(target) % hashIndex.buckets.length]

    for (let index = 0; index < lookupBucket.length; index += 1) {
      accessCount += 1
      const candidate = lookupBucket[index]

      if (candidate.key === target && list[candidate.firstIndex] === target) {
        return { index: candidate.firstIndex, accessCount }
      }
    }

    const fallbackResult = sequentialSearchAlgorithm.search(list, target)
    return {
      index: fallbackResult.index,
      accessCount: accessCount + fallbackResult.accessCount,
    }
  },
}

export const BATTLE_ALGORITHMS: SearchAlgorithm[] = [
  sequentialSearchAlgorithm,
  binarySearchAlgorithm,
  dynamicHashSearchAlgorithm,
  staticHashSearchAlgorithm,
]
