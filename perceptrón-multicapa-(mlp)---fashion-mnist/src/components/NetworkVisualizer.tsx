import { useState, useMemo } from 'react';
import { MultilayerPerceptron } from '../ml/engine';
import { FashionSample, FashionClassId, ForwardResult } from '../types/mlp';
import { FASHION_CLASSES } from '../data/fashionMnistData';
import { NeuronDetailModal } from './NeuronDetailModal';

interface NetworkVisualizerProps {
  mlp: MultilayerPerceptron;
  samples: FashionSample[];
  selectedSample: FashionSample;
  onSelectSample: (sample: FashionSample) => void;
  onUpdateSamplePixels?: (pixels: number[]) => void;
}

export function NetworkVisualizer({
  mlp,
  samples,
  selectedSample,
  onSelectSample
}: NetworkVisualizerProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [showSynapses, setShowSynapses] = useState<'strong' | 'all' | 'none'>('strong');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Modal inspection state
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    layerType: 'hidden' | 'output';
    layerIndex: number;
    neuronIndex: number;
    z: number;
    a: number;
    bias: number;
    weights: number[];
  }>({
    isOpen: false,
    layerType: 'hidden',
    layerIndex: 1,
    neuronIndex: 0,
    z: 0,
    a: 0,
    bias: 0,
    weights: []
  });

  // Calculate forward pass with optional added noise
  const effectivePixels = useMemo(() => {
    if (noiseLevel === 0) return selectedSample.pixels;
    return selectedSample.pixels.map(p => {
      const n = (Math.random() - 0.5) * (noiseLevel / 50);
      return Math.max(0, Math.min(1, p + n));
    });
  }, [selectedSample, noiseLevel]);

  const forwardResult: ForwardResult = useMemo(() => {
    return mlp.forward(effectivePixels, selectedSample.label);
  }, [mlp, effectivePixels, selectedSample.label]);

  const preparedInputs = useMemo(() => {
    return mlp.prepareInput(effectivePixels);
  }, [mlp, effectivePixels]);

  // Filtered samples for quick carousel
  const filteredSamples = useMemo(() => {
    if (selectedCategory === 'all') return samples;
    return samples.filter(s => s.label === selectedCategory);
  }, [samples, selectedCategory]);

  // Step-by-step animation handler
  const handleRunAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveStep(1); // 1: Input

    setTimeout(() => {
      setActiveStep(2); // 2: Hidden
      setTimeout(() => {
        setActiveStep(3); // 3: Softmax output
        setTimeout(() => {
          setActiveStep(null);
          setIsAnimating(false);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const hiddenLayerState = forwardResult.layers[0] || { z: [], a: [] };
  const outputLayerState = forwardResult.layers[forwardResult.layers.length - 1] || { z: [], a: [] };
  const hiddenWeights = mlp.layers[0]?.weights || [];
  const hiddenBiases = mlp.layers[0]?.biases || [];
  const outputWeights = mlp.layers[mlp.layers.length - 1]?.weights || [];
  const outputBiases = mlp.layers[mlp.layers.length - 1]?.biases || [];

  // Representation of input nodes to display in SVG
  const displayInputNodesCount = 12;
  const sampleIndices = useMemo(() => {
    const step = Math.floor(preparedInputs.length / displayInputNodesCount);
    return Array.from({ length: displayInputNodesCount }, (_, i) => i * step);
  }, [preparedInputs.length]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Concept Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
              Etapa 1 · Propagación hacia adelante (Forward Pass)
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Flujo de Información del Perceptrón Multicapa
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Cada imagen de Fashion MNIST se aplana a un vector de entrada. La red calcula la combinación lineal de los píxeles con los pesos sinápticos (<span className="text-indigo-300 font-mono">z = W·X + b</span>), aplica la función no lineal (<span className="text-emerald-300 font-mono">a = ReLU(z)</span>), y normaliza las probabilidades con <span className="text-amber-300 font-mono">Softmax</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAnimation}
              disabled={isAnimating}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer ${
                isAnimating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              <span>{isAnimating ? '⏳' : '▶'}</span>
              <span>{isAnimating ? 'Animando Forward Pass...' : 'Animar Forward Pass'}</span>
            </button>
          </div>
        </div>

        {/* Sample Selection Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-300">
              Seleccionar prenda de prueba ({filteredSamples.length} disponibles):
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Todas
              </button>
              {FASHION_CLASSES.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedCategory(cls.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cls.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{cls.icon}</span>
                  <span className="hidden md:inline">{cls.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Thumbnails Carousel */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {filteredSamples.slice(0, 10).map(s => {
              const isSelected = s.id === selectedSample.id;
              const classInfo = FASHION_CLASSES[s.label];
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSample(s)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Miniature 28x28 preview */}
                  <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 mb-1 flex items-center justify-center">
                    <MiniCanvas pixels={s.pixels} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200 truncate w-full">
                    {classInfo.icon} {classInfo.name.split('/')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Clase {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive Neural Network Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Arquitectura del MLP: {mlp.layerSizes.join(' → ')}
            </h3>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              Función: <strong className="text-indigo-400">{mlp.activation.toUpperCase()}</strong> en ocultas, <strong className="text-amber-400">Softmax</strong> en salida
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Synapse line filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Conexiones:</span>
              <button
                onClick={() => setShowSynapses('strong')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${showSynapses === 'strong' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Dominantes
              </button>
              <button
                onClick={() => setShowSynapses('all')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${showSynapses === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setShowSynapses('none')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${showSynapses === 'none' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Ocultar
              </button>
            </div>

            {/* Noise Slider */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Ruido:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={noiseLevel}
                onChange={e => setNoiseLevel(Number(e.target.value))}
                className="w-16 accent-indigo-500 cursor-pointer"
              />
              <span className="text-slate-300 font-mono w-6">{noiseLevel}%</span>
            </div>
          </div>
        </div>

        {/* 3-Column Visual Layout (Input -> Hidden -> Output) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Input Image & Flatten Vector (3 cols) */}
          <div className={`lg:col-span-3 space-y-4 p-4 rounded-xl border transition-all ${
            activeStep === 1 ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                1. Capa de Entrada (X)
              </span>
              <span className="text-[11px] font-mono text-indigo-400">
                {mlp.inputResolution === 14 ? '196 entradas' : '784 píxeles'}
              </span>
            </div>

            {/* 28x28 Canvas Viewer */}
            <div className="flex flex-col items-center">
              <div className="relative group p-2 bg-black rounded-xl border border-slate-800 shadow-inner">
                <canvas
                  id="visualizer-input-canvas"
                  width={140}
                  height={140}
                  className="image-rendering-pixelated rounded cursor-crosshair"
                  ref={canvas => {
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const imgData = ctx.createImageData(28, 28);
                    for (let i = 0; i < 784; i++) {
                      const val = Math.floor((effectivePixels[i] || 0) * 255);
                      imgData.data[i * 4] = val;
                      imgData.data[i * 4 + 1] = val;
                      imgData.data[i * 4 + 2] = val;
                      imgData.data[i * 4 + 3] = 255;
                    }
                    // Draw to offscreen and scale
                    const temp = document.createElement('canvas');
                    temp.width = 28;
                    temp.height = 28;
                    temp.getContext('2d')?.putImageData(imgData, 0, 0);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(temp, 0, 0, 140, 140);
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">
                {FASHION_CLASSES[selectedSample.label].icon} {FASHION_CLASSES[selectedSample.label].name}
              </span>
              <span className="text-[10px] text-slate-500">
                Matriz 28 × 28 (Escala de grises: [0.0, 1.0])
              </span>
            </div>

            {/* Flatten concept explanation */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Aplanamiento (Flatten):</div>
              <p>
                La matriz bidimensional se serializa en un único vector columna:
              </p>
              <div className="font-mono text-indigo-300 text-[10px] bg-slate-950 p-1.5 rounded">
                X = [x₀, x₁, x₂, ..., x_{mlp.inputResolution === 14 ? '195' : '783'}]ᵀ
              </div>
            </div>

            {/* Representative input vector values */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">
                Muestra de valores de entrada (xᵢ):
              </span>
              <div className="grid grid-cols-4 gap-1">
                {sampleIndices.slice(0, 8).map(idx => {
                  const val = preparedInputs[idx] || 0;
                  return (
                    <div
                      key={idx}
                      className="p-1 text-center bg-slate-900 border border-slate-800 rounded font-mono text-[10px]"
                    >
                      <div className="text-slate-500">x_{idx}</div>
                      <div className={`font-semibold ${val > 0.1 ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {val.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Interactive SVG Network Graph (5 cols) */}
          <div className={`lg:col-span-5 p-4 rounded-xl border transition-all ${
            activeStep === 2 ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                2. Capas y Sinapsis (Grafo Computacional)
              </span>
              <span className="text-[11px] text-slate-400">
                Haz clic en una neurona para inspeccionarla
              </span>
            </div>

            {/* SVG Graph */}
            <div className="w-full h-[430px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden relative">
              <svg className="w-full h-full" viewBox="0 0 400 420">
                {/* SVG Definitions for glows and gradients */}
                <defs>
                  <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-indigo" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Synaptic Lines (Connecting Hidden Layer to Output Layer) */}
                {showSynapses !== 'none' && (
                  <g className="synapse-lines">
                    {hiddenLayerState.a.slice(0, 16).map((hAct, hIdx) => {
                      const hY = 30 + (hIdx * (360 / 16));
                      const hX = 140;

                      return outputLayerState.a.map((oAct, oIdx) => {
                        const oY = 25 + (oIdx * (370 / 10));
                        const oX = 330;

                        const weight = outputWeights[oIdx]?.[hIdx] ?? 0;
                        const isStrong = Math.abs(weight) > 0.35;

                        if (showSynapses === 'strong' && !isStrong) return null;

                        const strokeColor = weight >= 0 ? '#6366f1' : '#f43f5e';
                        const strokeOpacity = Math.min(0.65, Math.max(0.08, Math.abs(weight) * 0.7));
                        const strokeWidth = Math.max(0.6, Math.min(2.5, Math.abs(weight) * 1.5));

                        return (
                          <line
                            key={`syn-${hIdx}-${oIdx}`}
                            x1={hX}
                            y1={hY}
                            x2={oX}
                            y2={oY}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeOpacity={strokeOpacity}
                          />
                        );
                      });
                    })}
                  </g>
                )}

                {/* Input Nodes Column in SVG */}
                <g className="input-nodes">
                  <text x="35" y="18" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
                    Entrada
                  </text>
                  {sampleIndices.map((idx, i) => {
                    const y = 30 + (i * (360 / displayInputNodesCount));
                    const val = preparedInputs[idx] || 0;
                    return (
                      <g key={`in-node-${i}`} className="cursor-pointer">
                        <circle
                          cx="35"
                          cy={y}
                          r={val > 0.1 ? 6 : 4}
                          fill={val > 0.1 ? '#818cf8' : '#334155'}
                          stroke="#1e293b"
                          strokeWidth="1.5"
                        />
                        <text
                          x="18"
                          y={y + 3}
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          x{i + 1}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Hidden Layer Nodes in SVG */}
                <g className="hidden-nodes">
                  <text x="140" y="18" fill="#818cf8" fontSize="10" fontWeight="600" textAnchor="middle">
                    Oculta ({hiddenLayerState.a.length})
                  </text>
                  {hiddenLayerState.a.slice(0, 16).map((act, i) => {
                    const y = 30 + (i * (360 / 16));
                    const isActive = act > 0.05;
                    const r = isActive ? 8 : 6;
                    const fillColor = isActive ? '#10b981' : '#1e293b';

                    return (
                      <g
                        key={`hid-node-${i}`}
                        className="cursor-pointer group"
                        onClick={() => {
                          setModalData({
                            isOpen: true,
                            layerType: 'hidden',
                            layerIndex: 1,
                            neuronIndex: i,
                            z: hiddenLayerState.z[i] || 0,
                            a: act,
                            bias: hiddenBiases[i] || 0,
                            weights: hiddenWeights[i] || []
                          });
                        }}
                      >
                        <circle
                          cx="140"
                          cy={y}
                          r={r}
                          fill={fillColor}
                          stroke={isActive ? '#34d399' : '#475569'}
                          strokeWidth={isActive ? 2 : 1}
                          filter={isActive ? 'url(#glow-emerald)' : undefined}
                          className="transition-all hover:scale-125"
                        />
                        <text
                          x="140"
                          y={y + 3}
                          fill="#ffffff"
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {i + 1}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Output Layer Nodes in SVG */}
                <g className="output-nodes">
                  <text x="330" y="18" fill="#fbbf24" fontSize="10" fontWeight="600" textAnchor="middle">
                    Salida (10)
                  </text>
                  {outputLayerState.a.map((prob, i) => {
                    const y = 25 + (i * (370 / 10));
                    const isWinner = i === forwardResult.predictedClass;
                    const isTarget = i === selectedSample.label;
                    const r = isWinner ? 10 : 7;

                    let strokeColor = '#475569';
                    let fillColor = '#1e293b';
                    if (isWinner) {
                      fillColor = isTarget ? '#10b981' : '#f59e0b';
                      strokeColor = '#ffffff';
                    }

                    return (
                      <g
                        key={`out-node-${i}`}
                        className="cursor-pointer group"
                        onClick={() => {
                          setModalData({
                            isOpen: true,
                            layerType: 'output',
                            layerIndex: 2,
                            neuronIndex: i,
                            z: outputLayerState.z[i] || 0,
                            a: prob,
                            bias: outputBiases[i] || 0,
                            weights: outputWeights[i] || []
                          });
                        }}
                      >
                        <circle
                          cx="330"
                          cy={y}
                          r={r}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isWinner ? 2.5 : 1}
                          filter={isWinner ? 'url(#glow-emerald)' : undefined}
                        />
                        <text
                          x="350"
                          y={y + 3}
                          fill={isWinner ? '#ffffff' : '#94a3b8'}
                          fontSize="9"
                          fontWeight={isWinner ? 'bold' : 'normal'}
                        >
                          {FASHION_CLASSES[i as FashionClassId].icon} {(prob * 100).toFixed(0)}%
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Graph Legend overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Activa (&gt; 0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  Inactiva (0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-indigo-500" />
                  Peso (+)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-rose-500" />
                  Peso (-)
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Softmax Probabilities & Diagnosis (4 cols) */}
          <div className={`lg:col-span-4 space-y-4 p-4 rounded-xl border transition-all ${
            activeStep === 3 ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                3. Distribución Softmax P(Y|X)
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                ∑ P = 100%
              </span>
            </div>

            {/* Prediction verdict card */}
            {(() => {
              const isCorrect = forwardResult.predictedClass === selectedSample.label;
              const predictedInfo = FASHION_CLASSES[forwardResult.predictedClass];
              const trueInfo = FASHION_CLASSES[selectedSample.label];
              const confidence = ((forwardResult.outputProbabilities[forwardResult.predictedClass] || 0) * 100).toFixed(1);

              return (
                <div className={`p-3.5 rounded-xl border ${
                  isCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {isCorrect ? '✓ Predicción Correcta' : '⚠️ Predicción Incorrecta'}
                    </span>
                    <span className="text-xs font-bold font-mono">
                      Confianza: {confidence}%
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <span>Predijo: {predictedInfo.icon} {predictedInfo.name}</span>
                  </div>
                  {!isCorrect && (
                    <div className="text-xs text-slate-400 mt-1">
                      Etiqueta real esperada: <strong className="text-emerald-400">{trueInfo.icon} {trueInfo.name}</strong>
                    </div>
                  )}
                  {forwardResult.loss !== undefined && (
                    <div className="text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex justify-between">
                      <span>Pérdida (Cross-Entropy):</span>
                      <span className="font-semibold text-slate-200">{forwardResult.loss.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Probabilities ranking list */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {FASHION_CLASSES.map(cls => {
                const prob = forwardResult.outputProbabilities[cls.id] || 0;
                const percent = (prob * 100).toFixed(1);
                const isWinner = cls.id === forwardResult.predictedClass;
                const isReal = cls.id === selectedSample.label;

                return (
                  <div
                    key={cls.id}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      isWinner
                        ? 'bg-slate-900 border-indigo-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{cls.icon}</span>
                        <span className={`font-medium ${isWinner ? 'text-white' : 'text-slate-300'}`}>
                          {cls.name}
                        </span>
                        {isReal && (
                          <span className="text-[10px] text-emerald-400 font-medium ml-1">
                            (Etiqueta Real)
                          </span>
                        )}
                      </div>
                      <span className={`font-mono text-[11px] font-semibold ${isWinner ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isWinner
                            ? isReal
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                            : 'bg-indigo-600/70'
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, Number(percent)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Neuron Detail Inspection Modal */}
      <NeuronDetailModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        neuronData={{
          ...modalData,
          activationType: mlp.activation,
          classInfo: modalData.layerType === 'output' ? FASHION_CLASSES[modalData.neuronIndex as FashionClassId] : undefined
        }}
        inputValues={modalData.layerType === 'hidden' ? preparedInputs : hiddenLayerState.a}
      />
    </div>
  );
}

// Mini preview canvas component for thumbnails
function MiniCanvas({ pixels }: { pixels: number[] }) {
  return (
    <canvas
      width={28}
      height={28}
      className="w-full h-full image-rendering-pixelated"
      ref={canvas => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imgData = ctx.createImageData(28, 28);
        for (let i = 0; i < 784; i++) {
          const val = Math.floor((pixels[i] || 0) * 255);
          imgData.data[i * 4] = val;
          imgData.data[i * 4 + 1] = val;
          imgData.data[i * 4 + 2] = val;
          imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
      }}
    />
  );
}
