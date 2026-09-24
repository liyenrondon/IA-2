import { Play, Pause, RotateCcw, FastForward, StepForward, TrendingDown, Eye, CheckCircle2 } from 'lucide-react';
import { KMeansParams, Centroid } from '../types';

interface KMeansControlsProps {
  params: KMeansParams;
  onParamsChange: (params: KMeansParams) => void;
  centroids: Centroid[];
  stepPhase: string;
  isConverged: boolean;
  iterationCount: number;
  inertia: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNextStep: () => void;
  onRunToConvergence: () => void;
  onResetCentroids: () => void;
  showVoronoi: boolean;
  onToggleVoronoi: () => void;
  showLines: boolean;
  onToggleLines: () => void;
  onOpenElbowModal: () => void;
}

export default function KMeansControls({
  params,
  onParamsChange,
  stepPhase,
  isConverged,
  iterationCount,
  inertia,
  isPlaying,
  onPlayPause,
  onNextStep,
  onRunToConvergence,
  onResetCentroids,
  showVoronoi,
  onToggleVoronoi,
  showLines,
  onToggleLines,
  onOpenElbowModal,
}: KMeansControlsProps) {
  const getPhaseDescription = () => {
    switch (stepPhase) {
      case 'init':
        return 'Centroides inicializados. Listo para la primera asignación.';
      case 'assign':
        return 'Paso 1: Puntos asignados al centroide más cercano (Distancia Euclidiana).';
      case 'update':
        return 'Paso 2: Centroides desplazados a la posición promedio (Media) de sus puntos.';
      case 'converged':
        return '¡Convergencia alcanzada! Los centroides ya no se mueven.';
      default:
        return 'Listo para iterar.';
    }
  };

  return (
    <div id="kmeans-controls-panel" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4">
      {/* Header & Concept */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-sky-400">Algoritmo K-Means</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-950/80 border border-sky-800 text-sky-300 rounded">
              Basado en Centroides
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Minimiza la suma de distancias al cuadrado (WCSS/Inercia) mediante iteraciones de EM.
          </p>
        </div>

        <button
          id="btn-open-elbow"
          onClick={onOpenElbowModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-300 hover:text-indigo-200 transition-colors shadow-sm"
        >
          <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
          <span>Método del Codo</span>
        </button>
      </div>

      {/* Hiperparámetros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* K Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="kmeans-k-slider" className="font-semibold text-slate-300 flex items-center gap-1">
              <span>Hiperparámetro K (Número de Cúmulos):</span>
            </label>
            <span className="font-mono text-xs font-bold text-sky-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              K = {params.k}
            </span>
          </div>
          <input
            id="kmeans-k-slider"
            type="range"
            min={1}
            max={8}
            step={1}
            value={params.k}
            onChange={(e) =>
              onParamsChange({
                ...params,
                k: Number(e.target.value),
              })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 (Muy simple)</span>
            <span>4 (Típico)</span>
            <span>8 (Sobreajuste)</span>
          </div>
        </div>

        {/* Método de Inicialización */}
        <div className="space-y-1.5">
          <label htmlFor="kmeans-init-select" className="block text-xs font-semibold text-slate-300">
            Método de Inicialización:
          </label>
          <select
            id="kmeans-init-select"
            value={params.initMethod}
            onChange={(e) =>
              onParamsChange({
                ...params,
                initMethod: e.target.value as 'kmeans++' | 'random',
              })
            }
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-sky-500 font-medium"
          >
            <option value="kmeans++">K-Means++ (Espaciado Inteligente por Probabilidad)</option>
            <option value="random">Aleatorio (Uniforme - Puede caer en mínimos locales)</option>
          </select>
          <div className="text-[10px] text-slate-400">
            {params.initMethod === 'kmeans++'
              ? '✨ K-Means++ previene malos agrupamientos separando centroides iniciales.'
              : '⚠️ Aleatorio es sensible a la suerte inicial y puede tardar más en converger.'}
          </div>
        </div>
      </div>

      {/* Control de Ejecución Didáctica (Paso a Paso) */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Flujo Didáctico:</span>
            {isConverged ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Convergido
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-mono">Iterando #{iterationCount}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="kmeans-btn-step"
              onClick={onNextStep}
              disabled={isConverged}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white transition-colors"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Paso a Paso</span>
            </button>

            <button
              id="kmeans-btn-play"
              onClick={onPlayPause}
              disabled={isConverged && !isPlaying}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-white transition-colors ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausar' : 'Auto-Reproducir'}</span>
            </button>

            <button
              id="kmeans-btn-converge"
              onClick={onRunToConvergence}
              disabled={isConverged}
              title="Ejecutar todas las iteraciones hasta converger"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors border border-slate-700"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Convergencia Total</span>
            </button>

            <button
              id="kmeans-btn-reset"
              onClick={onResetCentroids}
              title="Reiniciar centroides a nuevas posiciones iniciales"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Phase Step Banner */}
        <div className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800/80 px-3 py-2 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span>{getPhaseDescription()}</span>
        </div>
      </div>

      {/* Métricas y Visualización */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        {/* Visual Toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              id="kmeans-toggle-voronoi"
              type="checkbox"
              checked={showVoronoi}
              onChange={onToggleVoronoi}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Fronteras Voronoi</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              id="kmeans-toggle-lines"
              type="checkbox"
              checked={showLines}
              onChange={onToggleLines}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Líneas a Centroides</span>
          </label>
        </div>

        {/* Metrics Badge */}
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            Iteraciones: <strong className="text-slate-200 font-mono">{iterationCount}</strong>
          </div>
          <div className="text-slate-400">
            Inercia (WCSS):{' '}
            <strong className="text-sky-300 font-mono">
              {Math.round(inertia).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
