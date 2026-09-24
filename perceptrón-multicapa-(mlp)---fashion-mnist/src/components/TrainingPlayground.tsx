import { useState, useMemo, useEffect, useRef } from 'react';
import { MultilayerPerceptron } from '../ml/engine';
import { ActivationType, FashionSample, TrainingMetrics } from '../types/mlp';
import { FASHION_CLASSES } from '../data/fashionMnistData';

interface TrainingPlaygroundProps {
  mlp: MultilayerPerceptron;
  samples: FashionSample[];
  metricsHistory: TrainingMetrics[];
  onMetricsUpdate: (newMetrics: TrainingMetrics) => void;
  onResetWeights: (activation: ActivationType, hiddenSize: number) => void;
  onLoadPretrained: () => void;
  currentEpoch: number;
}

export function TrainingPlayground({
  mlp,
  samples,
  metricsHistory,
  onMetricsUpdate,
  onResetWeights,
  onLoadPretrained,
  currentEpoch
}: TrainingPlaygroundProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [learningRate, setLearningRate] = useState(0.06);
  const [selectedActivation, setSelectedActivation] = useState<ActivationType>(mlp.activation);
  const [hiddenNodes, setHiddenNodes] = useState(mlp.layerSizes[1] || 24);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Confusion matrix hover state
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{
    trueClass: number;
    predClass: number;
    count: number;
  } | null>(null);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Single step training function
  const stepTrain = () => {
    // Shuffle samples
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const result = mlp.trainBatch(shuffled, learningRate, 0.85);

    const newMetrics: TrainingMetrics = {
      epoch: currentEpoch + 1,
      loss: result.avgLoss,
      accuracy: result.accuracy
    };

    onMetricsUpdate(newMetrics);
  };

  // Continuous training animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const delay = speed === 'slow' ? 300 : speed === 'normal' ? 90 : 25;
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        stepTrain();
      }
    }, delay);

    return () => clearInterval(interval);
  }, [isPlaying, speed, learningRate, currentEpoch]);

  // Compute live 10x10 confusion matrix
  const confusionMatrix = useMemo(() => {
    const mat: number[][] = Array.from({ length: 10 }, () => new Array(10).fill(0));
    for (const sample of samples) {
      const pred = mlp.forward(sample.pixels);
      mat[sample.label][pred.predictedClass]++;
    }
    return mat;
  }, [mlp, samples, currentEpoch]);

  const bestAccuracy = useMemo(() => {
    if (metricsHistory.length === 0) return 0;
    return Math.max(...metricsHistory.map(m => m.accuracy));
  }, [metricsHistory]);

  const currentLoss = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].loss : 0;
  const currentAcc = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].accuracy : 0;

  // Handle hyperparameter changes requiring architecture reset
  const handleActivationChange = (act: ActivationType) => {
    setSelectedActivation(act);
    setIsPlaying(false);
    onResetWeights(act, hiddenNodes);
  };

  const handleHiddenNodesChange = (nodes: number) => {
    setHiddenNodes(nodes);
    setIsPlaying(false);
    onResetWeights(selectedActivation, nodes);
  };

  return (
    <div className="space-y-6">
      {/* Header and Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Etapa 2 · Descenso del Gradiente & Retropropagación
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Entrenamiento en Tiempo Real del MLP
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ajusta la tasa de aprendizaje (<span className="text-indigo-400 font-mono">η</span>), observa cómo la función de pérdida (Cross-Entropy) disminuye mientras la precisión aumenta, y comprueba cómo se actualizan los pesos para distinguir prendas complejas.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span>{isPlaying ? 'Pausar Entrenamiento' : 'Iniciar Entrenamiento'}</span>
            </button>

            <button
              onClick={stepTrain}
              disabled={isPlaying}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Entrena 1 época individual con backpropagation"
            >
              Paso individual (+1 Época)
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                onResetWeights(selectedActivation, hiddenNodes);
              }}
              className="px-3.5 py-2.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-xl border border-rose-900/40 transition-colors cursor-pointer"
              title="Reinicia pesos sinápticos a valores aleatorios (He/Xavier)"
            >
              Reiniciar Pesos
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                onLoadPretrained();
              }}
              className="px-3.5 py-2.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 rounded-xl border border-indigo-900/40 transition-colors cursor-pointer"
              title="Carga pesos pre-entrenados óptimos"
            >
              Cargar Pre-entrenado
            </button>
          </div>
        </div>

        {/* Hyperparameters Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Learning rate */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Tasa de Aprendizaje (α)
              </label>
              <span className="text-xs font-mono font-semibold text-indigo-400">
                {learningRate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.005"
                max="0.25"
                step="0.005"
                value={learningRate}
                onChange={e => setLearningRate(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Muy alto oscila; muy bajo converge lento.
            </span>
          </div>

          {/* Activation function */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Función en Capa Oculta
              </label>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(['relu', 'leaky_relu', 'tanh', 'sigmoid'] as ActivationType[]).map(act => (
                <button
                  key={act}
                  onClick={() => handleActivationChange(act)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-lg uppercase cursor-pointer transition-colors ${
                    selectedActivation === act
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  {act.replace('_', ' ')}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Reinicia los pesos al cambiar de función.
            </span>
          </div>

          {/* Hidden layer size */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Neuronas Ocultas
              </label>
              <span className="text-xs font-mono font-semibold text-indigo-400">
                {hiddenNodes} nodos
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[12, 16, 24, 32].map(n => (
                <button
                  key={n}
                  onClick={() => handleHiddenNodesChange(n)}
                  className={`py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    hiddenNodes === n
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Mayor capacidad de abstracción de prendas.
            </span>
          </div>

          {/* Training speed */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Velocidad de Simulación
              </label>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['slow', 'normal', 'fast'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    speed === s
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  {s === 'slow' ? 'Lenta' : s === 'normal' ? 'Normal' : 'Rápida'}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Ajusta el retardo entre épocas.
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row (Anti-slop cards with clear typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Épocas de Entrenamiento</span>
          <span className="text-2xl font-bold font-mono text-slate-100">{currentEpoch}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Iteraciones completas</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Pérdida Actual (Cross-Entropy)</span>
          <span className="text-2xl font-bold font-mono text-amber-400">
            {currentLoss > 0 ? currentLoss.toFixed(4) : '--'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Debe disminuir hacia 0</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Precisión Actual</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {currentAcc > 0 ? `${currentAcc.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Aciertos en el dataset</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Mejor Precisión Alcanzada</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">
            {bestAccuracy > 0 ? `${bestAccuracy.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Pico histórico</span>
        </div>
      </div>

      {/* Charts & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real-time Loss & Accuracy Curves (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Curvas de Convergencia (Loss & Accuracy)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400" /> Pérdida (Loss)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400" /> Precisión (%)
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800/80 p-3 relative flex items-center justify-center">
            {metricsHistory.length < 2 ? (
              <div className="text-center text-xs text-slate-500 space-y-1">
                <p>Presiona "Iniciar Entrenamiento" o "Paso individual" para ver la curva.</p>
                <p className="text-[11px] text-slate-600">Se generará la gráfica de convergencia en tiempo real.</p>
              </div>
            ) : (
              <MetricsChart history={metricsHistory} />
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <strong className="text-slate-200 block">¿Qué interpretar en estas curvas?</strong>
            <p>
              1. <strong>Pérdida (Loss)</strong>: Mide el error promedio con Entropía Cruzada Categórica. Al aplicar la regla de la cadena en Backprop, los pesos se mueven en dirección contraria al gradiente.
            </p>
            <p>
              2. <strong>Precisión (Accuracy)</strong>: Porcentaje de prendas clasificadas correctamente en la clase predicha con mayor probabilidad Softmax.
            </p>
          </div>
        </div>

        {/* Right: Live 10x10 Confusion Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Matriz de Confusión 10 × 10
            </h3>
            <span className="text-xs text-slate-400">
              Diagonal = Aciertos correctos
            </span>
          </div>

          {/* Confusion matrix grid */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-11 gap-1 text-[10px] font-mono text-center">
                {/* Header row: predicted labels */}
                <div className="text-slate-500 font-sans font-semibold p-1">Real \ Pred</div>
                {FASHION_CLASSES.map(c => (
                  <div key={`head-${c.id}`} className="text-slate-400 font-semibold p-1 truncate" title={c.name}>
                    {c.icon}
                  </div>
                ))}

                {/* Rows: True labels */}
                {confusionMatrix.map((row, trueIdx) => {
                  const trueClass = FASHION_CLASSES[trueIdx];
                  return (
                    <div key={`row-${trueIdx}`} className="contents">
                      <div className="flex items-center justify-start text-slate-400 p-1 font-sans truncate text-left" title={trueClass.name}>
                        <span className="mr-1">{trueClass.icon}</span>
                        <span className="hidden sm:inline">{trueClass.name.split('/')[0]}</span>
                      </div>

                      {row.map((count, predIdx) => {
                        const isDiagonal = trueIdx === predIdx;
                        const hasValue = count > 0;

                        let bgClass = 'bg-slate-950 text-slate-600';
                        if (hasValue) {
                          if (isDiagonal) {
                            bgClass = count >= 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-900/80 text-emerald-200';
                          } else {
                            bgClass = count >= 2 ? 'bg-rose-900/90 text-rose-200 font-bold' : 'bg-amber-950/60 text-amber-300';
                          }
                        }

                        return (
                          <div
                            key={`cell-${trueIdx}-${predIdx}`}
                            onMouseEnter={() => setSelectedMatrixCell({ trueClass: trueIdx, predClass: predIdx, count })}
                            onMouseLeave={() => setSelectedMatrixCell(null)}
                            className={`p-1.5 rounded flex items-center justify-center transition-colors cursor-pointer border border-slate-800/60 ${bgClass}`}
                            title={`Real: ${trueClass.name} → Predicho: ${FASHION_CLASSES[predIdx].name} (${count})`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Matrix Inspector tooltip card */}
          {selectedMatrixCell ? (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Detalle de la celda:</span>
              <div className="flex items-center justify-between">
                <div>
                  Etiqueta Real: <strong className="text-slate-200">{FASHION_CLASSES[selectedMatrixCell.trueClass].name}</strong>
                  <span className="mx-2 text-slate-600">→</span>
                  Predicho: <strong className={selectedMatrixCell.trueClass === selectedMatrixCell.predClass ? 'text-emerald-400' : 'text-rose-400'}>
                    {FASHION_CLASSES[selectedMatrixCell.predClass].name}
                  </strong>
                </div>
                <span className="font-mono font-bold text-slate-100">
                  {selectedMatrixCell.count} muestra{selectedMatrixCell.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Pasa el cursor sobre cualquier casilla para inspeccionar confusiones típicas (ej. Camisas vs Camisetas o Sandalias vs Zapatillas).
            </p>
          )}
        </div>
      </div>

      {/* Backpropagation Step-by-Step Mathematical Walkthrough */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          ¿Cómo calcula el MLP los gradientes en cada paso? (Regla de la Cadena)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-amber-400">Paso 1: Error en la Salida (δ^[salida])</span>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
              δ^[L] = ŷ - y
            </div>
            <p className="text-slate-400 text-[11px]">
              Al combinar la función <strong>Softmax</strong> con la pérdida de <strong>Entropía Cruzada</strong>, la derivada se simplifica elegantemente: es la probabilidad predicha menos el vector objetivo one-hot.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-indigo-400">Paso 2: Retropropagación a la Capa Oculta</span>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
              δ^[l] = (W^[l+1]ᵀ · δ^[l+1]) ⊙ f'(z^[l])
            </div>
            <p className="text-slate-400 text-[11px]">
              El error se propaga hacia atrás multiplicando por la matriz de pesos transpuesta. Luego se aplica el producto Hadamard (⊙) con la derivada de la activación (<span className="text-indigo-300 font-mono">f'</span>).
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-emerald-400">Paso 3: Actualización de Pesos y Sesgos</span>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
              W ← W - α · (δ · a_prevᵀ)
              b ← b - α · δ
            </div>
            <p className="text-slate-400 text-[11px]">
              Cada peso individual se actualiza restando una fracción de su gradiente proporcional a la tasa de aprendizaje (<span className="text-emerald-400 font-mono">α</span>), disminuyendo el error total.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Interactive SVG Chart for metrics
function MetricsChart({ history }: { history: TrainingMetrics[] }) {
  const maxEpoch = Math.max(1, history[history.length - 1].epoch);
  const maxLoss = Math.max(1.0, ...history.map(h => h.loss));

  const width = 500;
  const height = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Generate loss path
  const lossPoints = history.map((pt, i) => {
    const x = padL + (i / (history.length - 1)) * chartW;
    const y = padT + (1 - Math.min(1, pt.loss / maxLoss)) * chartH;
    return `${x},${y}`;
  }).join(' ');

  // Generate accuracy path (0 to 100%)
  const accPoints = history.map((pt, i) => {
    const x = padL + (i / (history.length - 1)) * chartW;
    const y = padT + (1 - pt.accuracy / 100) * chartH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* Grid lines */}
      <line x1={padL} y1={padT} x2={padL + chartW} y2={padT} stroke="#1e293b" strokeDasharray="3 3" />
      <line x1={padL} y1={padT + chartH / 2} x2={padL + chartW} y2={padT + chartH / 2} stroke="#1e293b" strokeDasharray="3 3" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" />

      {/* Axis labels */}
      <text x={padL - 6} y={padT + 4} fill="#fbbf24" fontSize="9" textAnchor="end" fontFamily="monospace">
        {maxLoss.toFixed(1)}
      </text>
      <text x={padL - 6} y={padT + chartH} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
        0
      </text>
      <text x={padL + chartW + 6} y={padT + 4} fill="#34d399" fontSize="9" textAnchor="start" fontFamily="monospace">
        100%
      </text>
      <text x={padL + chartW + 6} y={padT + chartH} fill="#34d399" fontSize="9" textAnchor="start" fontFamily="monospace">
        0%
      </text>

      {/* Curves */}
      <polyline
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.5"
        points={lossPoints}
      />
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2.5"
        points={accPoints}
      />

      {/* X Axis label */}
      <text x={padL + chartW / 2} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle">
        Épocas ({maxEpoch})
      </text>
    </svg>
  );
}
