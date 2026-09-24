import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MultilayerPerceptron } from '../ml/engine';
import { FashionClassId, ForwardResult } from '../types/mlp';
import { FASHION_CLASSES } from '../data/fashionMnistData';

interface DrawAndTestCanvasProps {
  mlp: MultilayerPerceptron;
}

export function DrawAndTestCanvas({ mlp }: DrawAndTestCanvasProps) {
  const [pixels, setPixels] = useState<number[]>(() => new Array(784).fill(0));
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedFeatureNeuron, setSelectedFeatureNeuron] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Run forward pass on the drawn pixels
  const prediction: ForwardResult = useMemo(() => {
    return mlp.forward(pixels);
  }, [mlp, pixels]);

  // Redraw canvas whenever pixels state changes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create 28x28 image buffer
    const imgData = ctx.createImageData(28, 28);
    for (let i = 0; i < 784; i++) {
      const v = Math.floor(pixels[i] * 255);
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }

    // Scale up to 280x280 with crisp nearest-neighbor
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    tempCanvas.getContext('2d')?.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 280, 280);
    ctx.drawImage(tempCanvas, 0, 0, 280, 280);

    // Subtle 28x28 grid overlay for visual guidance
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 280; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 280);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(280, i);
      ctx.stroke();
    }
  }, [pixels]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle painting pixels
  const applyBrush = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = 28 / rect.width;
    const scaleY = 28 / rect.height;

    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    if (x < 0 || x >= 28 || y < 0 || y >= 28) return;

    setPixels(prev => {
      const next = [...prev];
      const targetVal = tool === 'pen' ? 0.95 : 0.0;
      const radius = brushSize - 1;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < 28 && py >= 0 && py < 28) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius + 0.3) {
              const idx = py * 28 + px;
              if (tool === 'pen') {
                const intensity = Math.max(0.4, 1.0 - dist * 0.25);
                next[idx] = Math.max(next[idx], targetVal * intensity);
              } else {
                next[idx] = 0;
              }
            }
          }
        }
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    applyBrush(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    applyBrush(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setPixels(new Array(784).fill(0));
  };

  // Quick drawing presets
  const loadPreset = (type: 'tshirt' | 'trouser' | 'dress' | 'sneaker' | 'bag') => {
    const p = new Array(784).fill(0);
    const setR = (r1: number, c1: number, r2: number, c2: number, val = 0.9) => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          if (r >= 0 && r < 28 && c >= 0 && c < 28) {
            p[r * 28 + c] = val;
          }
        }
      }
    };

    if (type === 'tshirt') {
      setR(6, 8, 24, 19, 0.9); // body
      setR(6, 4, 13, 8, 0.85); // left sleeve
      setR(6, 19, 13, 23, 0.85); // right sleeve
      setR(6, 12, 8, 15, 0); // neck cut
    } else if (type === 'trouser') {
      setR(5, 8, 8, 19, 0.9); // waist
      setR(9, 8, 25, 12, 0.85); // left leg
      setR(9, 15, 25, 19, 0.85); // right leg
    } else if (type === 'dress') {
      setR(5, 10, 11, 17, 0.85); // bodice
      for (let r = 12; r <= 25; r++) {
        const spread = Math.floor((r - 11) * 0.65);
        setR(r, Math.max(3, 10 - spread), r, Math.min(24, 17 + spread), 0.9);
      }
    } else if (type === 'sneaker') {
      setR(21, 3, 24, 24, 0.95); // thick sole
      setR(16, 4, 21, 14, 0.85); // upper
      setR(18, 14, 21, 23, 0.85); // toe
    } else if (type === 'bag') {
      for (let c = 10; c <= 17; c++) p[6 * 28 + c] = 0.9; // handle
      setR(7, 10, 11, 11, 0.85);
      setR(7, 16, 11, 17, 0.85);
      setR(12, 7, 24, 20, 0.9); // body
    }

    setPixels(p);
  };

  const hiddenSize = mlp.layers[0]?.weights.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
          Etapa 3 · Taller Libre de Clasificación
        </span>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Dibuja una Prenda y Prueba el Perceptrón Multicapa
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Utiliza el ratón o pantalla táctil sobre la cuadrícula 28×28. El MLP procesa los trazos en tiempo real. Observa cómo cambian las probabilidades al añadir mangas, alargar una silueta o dibujar un tacón.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 28x28 Canvas & Tools (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Lienzo de Entrada 28 × 28
            </h3>
            <span className="text-xs text-slate-400">
              Trazo blanco sobre fondo negro
            </span>
          </div>

          {/* Canvas Box */}
          <div className="flex flex-col items-center">
            <div className="relative p-2 bg-black rounded-2xl border-2 border-slate-700 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={applyBrush}
                onTouchMove={applyBrush}
                onTouchEnd={handleMouseUp}
                className="rounded-lg cursor-crosshair touch-none select-none block"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              Haz clic y arrastra para dibujar en la cuadrícula de 784 píxeles
            </span>
          </div>

          {/* Drawing Tools Bar */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              {/* Tool Mode */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTool('pen')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  ✏️ Lápiz
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  🧹 Borrador
                </button>
              </div>

              {/* Brush size */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 mr-1">Grosor:</span>
                {[1, 2, 3].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setBrushSize(sz)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono cursor-pointer transition-colors ${
                      brushSize === sz ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Clear button */}
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-900/40 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                Plantillas rápidas para editar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => loadPreset('tshirt')}
                  className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors cursor-pointer"
                >
                  👕 Camiseta
                </button>
                <button
                  onClick={() => loadPreset('trouser')}
                  className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors cursor-pointer"
                >
                  👖 Pantalón
                </button>
                <button
                  onClick={() => loadPreset('dress')}
                  className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors cursor-pointer"
                >
                  👗 Vestido
                </button>
                <button
                  onClick={() => loadPreset('sneaker')}
                  className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors cursor-pointer"
                >
                  👟 Zapatilla
                </button>
                <button
                  onClick={() => loadPreset('bag')}
                  className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors cursor-pointer"
                >
                  👜 Bolso
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Softmax Predictions & Feature Map Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Prediction Highlight Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Predicción en Tiempo Real del MLP
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {((prediction.outputProbabilities[prediction.predictedClass] || 0) * 100).toFixed(1)}% Confianza
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl">
                {FASHION_CLASSES[prediction.predictedClass].icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-100">
                    {FASHION_CLASSES[prediction.predictedClass].name}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    (Clase {prediction.predictedClass})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {FASHION_CLASSES[prediction.predictedClass].description}
                </p>
              </div>
            </div>

            {/* All 10 Classes Live Softmax Distribution */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-medium text-slate-300 block">
                Distribución de Probabilidades Softmax:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FASHION_CLASSES.map(cls => {
                  const prob = prediction.outputProbabilities[cls.id] || 0;
                  const percent = (prob * 100).toFixed(1);
                  const isWinner = cls.id === prediction.predictedClass;

                  return (
                    <div
                      key={cls.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isWinner
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/40 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span>{cls.icon}</span>
                          <span className={`font-medium ${isWinner ? 'text-white' : 'text-slate-300'}`}>
                            {cls.name}
                          </span>
                        </div>
                        <span className={`font-mono text-[11px] font-semibold ${isWinner ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${
                            isWinner ? 'bg-indigo-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.max(1, Math.min(100, Number(percent)))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feature Maps Visualizer (What does the hidden layer look for?) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Mapas de Características de las Neuronas Ocultas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualización espacial de los pesos sinápticos (<span className="text-indigo-300 font-mono">W^[1]</span>) aprendidos por cada neurona oculta.
                </p>
              </div>
            </div>

            {/* Gallery of first 12 hidden neuron receptive fields */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {Array.from({ length: Math.min(12, hiddenSize) }).map((_, idx) => {
                const isSelected = selectedFeatureNeuron === idx;
                const act = prediction.layers[0]?.a[idx] || 0;
                const featureMap = mlp.getNeuronFeatureMap(0, idx);
                const res = mlp.inputResolution;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFeatureNeuron(idx)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 mb-1 flex items-center justify-center">
                      <FeatureMapCanvas weights={featureMap} resolution={res} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300">
                      N#{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono ${act > 0.1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      act: {act.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <strong className="text-slate-200 block">¿Cómo interpretar estos mapas de calor?</strong>
              <p>
                Cada neurona oculta del Perceptrón Multicapa actúa como un <strong>filtro de patrones</strong>: las zonas brillantes indican pesos positivos (la neurona se activa fuertemente si hay píxeles en esa región), mientras que las zonas oscuras indican pesos negativos o inhibidores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to draw feature map weights as an image
function FeatureMapCanvas({ weights, resolution }: { weights: number[]; resolution: 14 | 28 }) {
  return (
    <canvas
      width={resolution}
      height={resolution}
      className="w-full h-full image-rendering-pixelated"
      ref={canvas => {
        if (!canvas || weights.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgData = ctx.createImageData(resolution, resolution);
        for (let i = 0; i < weights.length; i++) {
          const val = Math.floor(weights[i] * 255);
          // Heatmap: cool indigo-emerald tone
          imgData.data[i * 4] = Math.floor(val * 0.4);
          imgData.data[i * 4 + 1] = Math.floor(val * 0.7);
          imgData.data[i * 4 + 2] = val;
          imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
      }}
    />
  );
}
