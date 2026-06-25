import { useState, useEffect, useRef, useCallback } from 'react';

type SortingAlgorithmInfo = {
  id: string;
  name: string;
  description: string;
  complexity: { best: string; average: string; worst: string };
  space: string;
  stable: boolean;
};

const ALGORITHMS: SortingAlgorithmInfo[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    description:
      'Percorre repetidamente o vetor comparando pares adjacentes e trocando-os quando estão fora de ordem. A cada passada, o maior elemento "borbulha" até o final do vetor, reduzindo em uma posição a região ainda não ordenada. É simples de implementar, mas ineficiente em vetores grandes porque, no pior caso, executa cerca de n² comparações.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
    stable: true,
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    description:
      'Constrói o vetor ordenado um elemento por vez. Para cada novo elemento, desloca para a direita os elementos maiores já ordenados até encontrar a posição correta de inserção. Tem desempenho excelente em vetores pequenos ou quase ordenados (caso melhor O(n)), mas degrada para O(n²) quando o vetor está em ordem inversa.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
    stable: true,
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    description:
      'Aplica a estratégia dividir-para-conquistar: divide o vetor recursivamente ao meio até obter sub-vetores de tamanho 1, e depois intercala (merge) pares ordenados, reconstruindo o vetor completo. Garante O(n log n) em todos os cenários e é estável, mas exige O(n) de memória auxiliar para armazenar os sub-vetores durante a intercalação.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(n)',
    stable: true,
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    description:
      'Escolhe um pivô (aqui o último elemento da partição) e reorganiza o vetor de modo que valores menores fiquem à esquerda e maiores à direita. Em seguida, aplica recursivamente o mesmo processo a cada lado. Em média é O(n log n) e in-place, mas degrada para O(n²) quando o pivô é mal escolhido — por exemplo, em um vetor já ordenado com pivô na ponta.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    space: 'O(log n)',
    stable: false,
  },
  {
    id: 'heap',
    name: 'Heap Sort',
    description:
      'Reorganiza o vetor como um heap máximo — uma árvore binária implícita onde cada pai é maior que os filhos. Depois, retira repetidamente a raiz (o maior elemento), troca com o último da região não ordenada e reaplica a propriedade de heap no restante. Garante O(n log n) no pior caso e é in-place, mas não é estável.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(1)',
    stable: false,
  },
];

const MOCK_DATA_SIZE = 100;
const INSERTION_STEP_DELAY_MS = 12;
const SORT_STEP_DELAY_MS = 20;

type VisualizationPhase = 'idle' | 'inserting' | 'sorting';

export default function SortingVisualizer() {
  const [array, setArray] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [visualizationPhase, setVisualizationPhase] = useState<VisualizationPhase>('idle');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS[0].id);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('0.000');
  const [swapCount, setSwapCount] = useState(0);
  const [comparisonCount, setComparisonCount] = useState(0);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playBeep = useCallback((value: number, maxVal: number) => {
    if (!soundEnabled || !audioCtxRef.current) return;

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    oscillator.type = 'sine';

    const minFreq = 200;
    const maxFreq = 1000;
    oscillator.frequency.value = minFreq + (value / maxVal) * (maxFreq - minFreq);

    gainNode.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtxRef.current.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    oscillator.start();
    oscillator.stop(audioCtxRef.current.currentTime + 0.1);
  }, [soundEnabled]);

  const generateRandomArray = useCallback(() => {
    const newArr = [];
    for (let i = 0; i < MOCK_DATA_SIZE; i++) {
      newArr.push(Math.floor(Math.random() * 90) + 10);
    }
    setArray(newArr);
    setSwapCount(0);
    setComparisonCount(0);
    setElapsedTime('0.000');
  }, []);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const animateArrayInsertion = async (values: number[]) => {
    setArray([]);

    for (let index = 0; index < values.length; index += 1) {
      setArray(values.slice(0, index + 1));
      await sleep(INSERTION_STEP_DELAY_MS);
    }
  };

  const runBubbleSort = async (initialArray: number[]) => {
    let arr = [...initialArray];
    let swaps = 0;
    let comparisons = 0;
    const startTime = performance.now();

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        comparisons++;
        setComparisonCount(comparisons);

        if (arr[j] > arr[j + 1]) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;

          swaps++;
          setSwapCount(swaps);
          setArray([...arr]);
          playBeep(arr[j], 100);

          await sleep(SORT_STEP_DELAY_MS);
        }
      }
    }

    const endTime = performance.now();
    setElapsedTime((endTime - startTime).toFixed(3));
  };

  const runInsertionSort = async (initialArray: number[]) => {
    const arr = [...initialArray];
    let swaps = 0;
    let comparisons = 0;
    const startTime = performance.now();

    for (let i = 1; i < arr.length; i++) {
      const currentValue = arr[i];
      let j = i - 1;

      while (j >= 0) {
        comparisons++;
        setComparisonCount(comparisons);

        if (arr[j] <= currentValue) {
          break;
        }

        arr[j + 1] = arr[j];
        swaps++;
        setSwapCount(swaps);
        setArray([...arr]);
        playBeep(arr[j], 100);

        j--;
        await sleep(SORT_STEP_DELAY_MS);
      }

      arr[j + 1] = currentValue;
      setArray([...arr]);
      playBeep(currentValue, 100);
      await sleep(SORT_STEP_DELAY_MS);
    }

    const endTime = performance.now();
    setElapsedTime((endTime - startTime).toFixed(3));
  };

  const runMergeSort = async (initialArray: number[]) => {
    const arr = [...initialArray];
    let swaps = 0;
    let comparisons = 0;
    const startTime = performance.now();

    const merge = async (left: number, mid: number, right: number) => {
      const leftPart = arr.slice(left, mid + 1);
      const rightPart = arr.slice(mid + 1, right + 1);

      let i = 0;
      let j = 0;
      let k = left;

      while (i < leftPart.length && j < rightPart.length) {
        comparisons++;
        setComparisonCount(comparisons);

        if (leftPart[i] <= rightPart[j]) {
          arr[k] = leftPart[i];
          i++;
        } else {
          arr[k] = rightPart[j];
          j++;
        }

        swaps++;
        setSwapCount(swaps);
        setArray([...arr]);
        playBeep(arr[k], 100);
        await sleep(SORT_STEP_DELAY_MS);
        k++;
      }

      while (i < leftPart.length) {
        arr[k] = leftPart[i];
        swaps++;
        setSwapCount(swaps);
        setArray([...arr]);
        playBeep(arr[k], 100);
        await sleep(SORT_STEP_DELAY_MS);
        i++;
        k++;
      }

      while (j < rightPart.length) {
        arr[k] = rightPart[j];
        swaps++;
        setSwapCount(swaps);
        setArray([...arr]);
        playBeep(arr[k], 100);
        await sleep(SORT_STEP_DELAY_MS);
        j++;
        k++;
      }
    };

    const mergeSort = async (left: number, right: number): Promise<void> => {
      if (left >= right) {
        return;
      }

      const mid = Math.floor((left + right) / 2);
      await mergeSort(left, mid);
      await mergeSort(mid + 1, right);
      await merge(left, mid, right);
    };

    await mergeSort(0, arr.length - 1);

    const endTime = performance.now();
    setElapsedTime((endTime - startTime).toFixed(3));
  };

  const runQuickSort = async (initialArray: number[]) => {
    const arr = [...initialArray];
    let swaps = 0;
    let comparisons = 0;
    const startTime = performance.now();

    const swapValues = async (firstIndex: number, secondIndex: number) => {
      if (firstIndex === secondIndex) {
        return;
      }

      const temp = arr[firstIndex];
      arr[firstIndex] = arr[secondIndex];
      arr[secondIndex] = temp;
      swaps++;
      setSwapCount(swaps);
      setArray([...arr]);
      playBeep(arr[firstIndex], 100);
      await sleep(SORT_STEP_DELAY_MS);
    };

    const partition = async (low: number, high: number) => {
      const pivot = arr[high];
      let pivotIndex = low - 1;

      for (let j = low; j < high; j++) {
        comparisons++;
        setComparisonCount(comparisons);

        if (arr[j] < pivot) {
          pivotIndex++;
          await swapValues(pivotIndex, j);
        }
      }

      await swapValues(pivotIndex + 1, high);
      return pivotIndex + 1;
    };

    const quickSort = async (low: number, high: number): Promise<void> => {
      if (low >= high) {
        return;
      }

      const partitionIndex = await partition(low, high);
      await quickSort(low, partitionIndex - 1);
      await quickSort(partitionIndex + 1, high);
    };

    await quickSort(0, arr.length - 1);

    const endTime = performance.now();
    setElapsedTime((endTime - startTime).toFixed(3));
  };

  const runHeapSort = async (initialArray: number[]) => {
    const arr = [...initialArray];
    let swaps = 0;
    let comparisons = 0;
    const startTime = performance.now();

    const swapValues = async (firstIndex: number, secondIndex: number) => {
      if (firstIndex === secondIndex) {
        return;
      }

      const temp = arr[firstIndex];
      arr[firstIndex] = arr[secondIndex];
      arr[secondIndex] = temp;
      swaps++;
      setSwapCount(swaps);
      setArray([...arr]);
      playBeep(arr[firstIndex], 100);
      await sleep(SORT_STEP_DELAY_MS);
    };

    const heapify = async (heapSize: number, rootIndex: number): Promise<void> => {
      let largest = rootIndex;
      const left = 2 * rootIndex + 1;
      const right = 2 * rootIndex + 2;

      if (left < heapSize) {
        comparisons++;
        setComparisonCount(comparisons);
        if (arr[left] > arr[largest]) {
          largest = left;
        }
      }

      if (right < heapSize) {
        comparisons++;
        setComparisonCount(comparisons);
        if (arr[right] > arr[largest]) {
          largest = right;
        }
      }

      if (largest !== rootIndex) {
        await swapValues(rootIndex, largest);
        await heapify(heapSize, largest);
      }
    };

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      await heapify(arr.length, i);
    }

    for (let i = arr.length - 1; i > 0; i--) {
      await swapValues(0, i);
      await heapify(i, 0);
    }

    const endTime = performance.now();
    setElapsedTime((endTime - startTime).toFixed(3));
  };

  const handleSort = async () => {
    initAudio();
    if (isSorting) return;
    setIsSorting(true);
    setVisualizationPhase('inserting');
    setSwapCount(0);
    setComparisonCount(0);
    setElapsedTime('0.000');

    const sourceArray = [...array];

    try {
      await animateArrayInsertion(sourceArray);
      setVisualizationPhase('sorting');

      if (selectedAlgorithm === 'bubble') {
        await runBubbleSort(sourceArray);
      } else if (selectedAlgorithm === 'insertion') {
        await runInsertionSort(sourceArray);
      } else if (selectedAlgorithm === 'quick') {
        await runQuickSort(sourceArray);
      } else if (selectedAlgorithm === 'merge') {
        await runMergeSort(sourceArray);
      } else if (selectedAlgorithm === 'heap') {
        await runHeapSort(sourceArray);
      } else {
        // Mock provisório para outros algoritmos enquanto não são implementados
        let swaps = 0;
        const interval = setInterval(() => {
          setArray((prev) => {
            const nextArr = [...prev];
            const idx1 = Math.floor(Math.random() * prev.length);
            const idx2 = Math.floor(Math.random() * prev.length);
            const temp = nextArr[idx1];
            nextArr[idx1] = nextArr[idx2];
            nextArr[idx2] = temp;
            playBeep(nextArr[idx1], 100);
            return nextArr;
          });
          swaps++;
          setSwapCount(swaps);
          if (swaps >= 50) clearInterval(interval);
        }, 50);
        await sleep(2500); // Espera o tempo do mock terminar
      }
    } finally {
      setVisualizationPhase('idle');
      setIsSorting(false);
    }
  };

  return (
    <section className="mt-6 battle-card rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Modo Ordenação</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Gamificação de Algoritmos</h1>
          <p className="mt-2 text-slate-600">
            Acompanhe visualmente a performance de 5 algoritmos de ordenação no banco de dados.
            (Amostra visual de {MOCK_DATA_SIZE} elementos)
          </p>
        </div>

        <button
          onClick={() => {
            initAudio();
            setSoundEnabled(!soundEnabled);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${soundEnabled ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
            }`}
        >
          {soundEnabled ? ' Som Ativado' : ' Mudo'}
        </button>
      </div>

      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 items-center md:items-end bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Escolha um algoritmo para testar
          </label>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            disabled={isSorting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-50"
          >
            {ALGORITHMS.map(alg => (
              <option key={alg.id} value={alg.id}>{alg.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generateRandomArray}
          disabled={isSorting}
          className="w-full md:w-auto px-5 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-200 transition disabled:opacity-50"
        >
          Embaralhar
        </button>

        <button
          onClick={handleSort}
          disabled={isSorting}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition disabled:opacity-50"
        >
          {visualizationPhase === 'inserting'
            ? 'Inserindo valores...'
            : visualizationPhase === 'sorting'
              ? 'Ordenando...'
              : 'Iniciar Ordenação'}
        </button>
      </div>

      {/* Explicação do algoritmo selecionado */}
      {(() => {
        const info = ALGORITHMS.find((alg) => alg.id === selectedAlgorithm);
        if (!info) return null;
        return (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Como funciona: {info.name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  info.stable
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {info.stable ? 'Estável' : 'Não estável'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{info.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              Complexidade — melhor: <strong className="text-slate-700">{info.complexity.best}</strong> ·
              média: <strong className="text-slate-700">{info.complexity.average}</strong> ·
              pior: <strong className="text-slate-700">{info.complexity.worst}</strong> ·
              memória auxiliar: <strong className="text-slate-700">{info.space}</strong>
            </p>
          </div>
        );
      })()}

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sequência atual</p>
          <p className="text-xs text-slate-500">
            {visualizationPhase === 'inserting'
              ? 'Inserindo valores antes das trocas'
              : visualizationPhase === 'sorting'
                ? 'Executando as trocas do algoritmo'
                : 'Pronto para iniciar'}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {array.map((value, idx) => (
            <div
              key={`cell-${idx}`}
              className={`min-w-10 rounded-lg border px-2 py-1 text-center text-xs font-semibold transition ${
                visualizationPhase === 'inserting'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* Visualizador */}
      <div className="bg-slate-900 rounded-xl p-4 h-64 flex items-end justify-center gap-[2px] overflow-hidden">
        {array.map((value, idx) => (
          <div
            key={idx}
            className={`rounded-t-sm w-full transition-all duration-75 ${
              visualizationPhase === 'inserting' ? 'bg-amber-400' : 'bg-sky-500'
            }`}
            style={{ height: `${value}%` }}
          ></div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tempo de Execução</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{elapsedTime} <span className="text-sm font-normal text-slate-500">ms</span></p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comparações</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{comparisonCount}</p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trocas (Swaps)</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{swapCount}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
