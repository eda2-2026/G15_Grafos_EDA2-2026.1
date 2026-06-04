export const initialTags = [
  'python',
  'java',
  'c',
  'estrutura',
  'dados',
  'busca',
  'arvore',
  'hash',
  'pilha',
  'fila',
]

export function buildLargeTagList(baseTags, targetSize) {
  const result = [...baseTags]
  let counter = 0

  while (result.length < targetSize) {
    const candidate = `tag-${counter}`
    if (!result.includes(candidate)) {
      result.push(candidate)
    }
    counter += 1
  }

  return result
}
