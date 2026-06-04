export function sequentialSearch(tags, targetTag) {
  // Percorre a lista do primeiro ao ultimo elemento procurando a tag informada.
  for (let index = 0; index < tags.length; index += 1) {
    if (tags[index] === targetTag) {
      return index
    }
  }

  // Retorna -1 quando a tag nao existe na lista.
  return -1
}
