# Trabalho 2 - EDA2

## Visao geral
Aplicacao React + TypeScript para **gamificacao do aprendizado de algoritmos de busca**.

A interface simula uma arena em que 4 algoritmos disputam cada rodada de busca por tags. O usuario escolhe um palpite de vencedor, executa a rodada e recebe feedback com base nos resultados medidos.

## Algoritmos implementados
Os algoritmos usados nas batalhas estao em `src/utils/algorithms.ts`:

1. **Busca Sequencial**
2. **Busca Binaria**
3. **Busca Hash Dinamico**
4. **Busca Hash Estatico**

## Algoritmos de ordenação visualizados
A aplicação também contém um visualizador de algoritmos de ordenação em `src/components/SortingVisualizer.tsx`:

1. **Bubble Sort**
2. **Insertion Sort**
3. **Merge Sort**
4. **Quick Sort**
5. **Heap Sort**

Cada algoritmo mostra o processo de ordenação com animações, contagem de comparações e trocas, e tempo de execução.

Resumo de complexidade dos algoritmos de busca:

| Algoritmo | Melhor | Medio | Pior | Observacao |
|---|---:|---:|---:|---|
| Busca Sequencial | O(1) | O(n) | O(n) | Nao exige lista ordenada |
| Busca Binaria | O(1) | O(log n) | O(log n) | Exige lista ordenada |
| Hash Dinamico | O(1) | O(1) | O(n) | Redimensiona ao passar fator de carga |
| Hash Estatico | O(1) | O(1) | O(n) | Capacidade fixa, com fallback sequencial |

Resumo de complexidade dos algoritmos de ordenação:

| Algoritmo | Melhor | Medio | Pior | Espaco | Estavel |
|---|---:|---:|---:|---:|---:|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Sim |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Sim |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Sim |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | Não |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | Não |

## Como funciona a batalha
A cada rodada:

1. O usuario define uma tag para busca (manual ou aleatoria).
2. Escolhe qual algoritmo acredita que sera o vencedor.
3. O sistema executa todos os algoritmos no mesmo cenario.
4. O vencedor da rodada e definido por:
   - menor tempo mediano;
   - desempate por menor tempo medio;
   - novo desempate por menor numero de acessos.

Se persistir empate, a rodada e registrada como empate e nenhum algoritmo pontua.

## Mecânicas de gamificacao na interface
- Pontos do jogador por acerto de palpite.
- Streak de rodadas consecutivas.
- Ranking dos algoritmos por pontos/vitorias.
- Exibicao da ultima rodada com metricas detalhadas.
- Cadastro local de tags para novos testes.

## Scripts disponiveis
No diretorio deste projeto:

```bash
npm install
```

Executar frontend em desenvolvimento:

```bash
npm run dev
```

Gerar build:

```bash
npm run build
```

Rodar lint:

```bash
npm run lint
```

Executar benchmark CLI da busca sequencial:

```bash
npm run busca:sequencial
```

## Estrutura principal
- `src/App.tsx`: fluxo gamificado da interface (rodadas, ranking, feedback).
- `src/utils/algorithms.ts`: implementacao dos 4 algoritmos.
- `src/utils/benchmark.ts`: execucao padronizada e regra de desempate.
- `src/tagData.ts`: base de tags do sistema.
- `cli/index.js`: benchmark de busca sequencial no terminal.
- `cli/search/sequentialSearch.js`: implementacao da busca sequencial da CLI.

## Limitacoes atuais
- Persistencia das tags criadas e pontuacao ainda nao foi implementada.
- A CLI atual cobre apenas busca sequencial.
- Ainda nao ha exportacao automatica de resultados para arquivo.

## Evolucoes sugeridas
- Adicionar modo CLI comparativo com os 4 algoritmos.
- Persistir historico de batalhas e pontuacao por usuario.
- Criar cenarios didaticos fixos para analise reprodutivel.
