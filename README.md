# Final_Arena

Numero da Lista: 1<br>
Conteudo da Disciplina: Algoritmos de Busca<br>
URL de apresentação do trabalho: https://youtu.be/AfJ6eRwazv4<br>

## Alunos
|Matricula | Aluno |
| -- | -- |
| 23/1027159 | Lucas Alves Oliveira dos Santos |
| 23/1035446 | Lucas Monteiro Freitas |

## Sobre
Este projeto apresenta uma aplicacao gamificada para estudar o comportamento de quatro algoritmos de busca em cenarios praticos.

O usuario digita uma tag, escolhe qual algoritmo acredita que sera o vencedor da rodada e inicia a batalha. Em seguida, todos os algoritmos sao executados e comparados por desempenho. O sistema mostra o vencedor e atualiza pontuacao, streak e ranking.

Algoritmos abordados:
- Busca Sequencial
- Busca Binaria
- Busca Hash Dinamico
- Busca Hash Estatico

Algoritmos de ordenação presentes no mesmo repositório:
- Bubble Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Heap Sort

O visualizador de ordenação está implementado em `trabalho1_EDA2/src/components/SortingVisualizer.tsx`, com animação das operações, contagem de comparações e trocas e medição de tempo.

## Screenshots

![Tela inicial](docs/screenshots/tela-inicial.PNG)
![Rodada de batalha](docs/screenshots/rodada-batalha.PNG)
![Placar e ranking](docs/screenshots/placar-ranking.PNG)
![Modo ordenação](docs/screenshots/modo-ordenacao.PNG)

## Instalacao
Linguagem: TypeScript e JavaScript<br>
Framework: React + Vite<br>

Pre-requisitos:
- Node.js 18+
- npm 9+

Comandos:

```bash
cd trabalho1_EDA2
npm install
```

## Uso
Para executar o frontend em desenvolvimento:

```bash
cd trabalho1_EDA2
npm run dev
```

Depois, abra a URL informada no terminal (padrao do Vite: `http://localhost:5173`).

Passo a passo de uso na interface:
1. Digite uma tag no campo de busca (ou use o botao de tag aleatoria).
2. Selecione o algoritmo do seu palpite.
3. Clique em "Iniciar rodada".
4. Analise o vencedor, os tempos e o placar.

Para executar o benchmark da busca sequencial via CLI:

```bash
cd trabalho1_EDA2
npm run busca:sequencial
```

## Outros
- Criterio de vitoria por rodada: menor tempo mediano; em empate, menor tempo medio; em novo empate, menor numero de acessos.
- O projeto possui cadastro local de tags para montar cenarios personalizados de teste.
- A CLI atual mede apenas busca sequencial; comparacao CLI dos 4 algoritmos pode ser adicionada como evolucao futura.
