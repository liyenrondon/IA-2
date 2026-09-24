import { DBSCANParams } from '../types';
import { Sparkles, Info } from 'lucide-react';

interface DBSCANControlsProps {
  params: DBSCANParams;
  onParamsChange: (params: DBSCANParams) => void;
  clusterCount: number;
  coreCount: number;
  borderCount: number;
  noiseCount: number;
  totalPoints: number;
  showEpsHover: boolean;
  onToggleEpsHover: () => void;
}

export default function DBSCANControls({
  params,
  onParamsChange,
  clusterCount,
  coreCount,
  borderCount,
  noiseCount,
  totalPoints,
  showEpsHover,
  onToggleEpsHover,
}: DBSCANControlsProps) {
  return (
    <div id="dbscan-controls-panel" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4">
      {/* Header & Concept */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-400">Algoritmo DBSCAN</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded">
              Basado en Densidad Espacial
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Agrupa regiones densas conectadas y filtra automáticamente el ruido sin obligar a definir K.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-950/90 border border-emerald-800 text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>K Auto-Descubierto: {clusterCount} cúmulos</span>
        </div>
      </div>

      {/* Hiperparámetros de DBSCAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Epsilon Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="dbscan-eps-slider" className="font-semibold text-slate-300 flex items-center gap-1">
              <span>Radio de Vecindad (ε - Epsilon):</span>
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-dashed border-emerald-400 bg-emerald-500/20"
                style={{
                  transform: `scale(${Math.min(1.6, Math.max(0.4, params.eps / 40))})`,
                }}
                title="Representación visual de la escala del radio"
              />
              <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                ε = {params.eps} px
              </span>
            </div>
          </div>
          <input
            id="dbscan-eps-slider"
            type="range"
            min={12}
            max={85}
            step={1}
            value={params.eps}
            onChange={(e) =>
              onParamsChange({
                ...params,
                eps: Number(e.target.value),
              })
            }
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>12px (Muy estricto, mucho ruido)</span>
            <span>45px (Equilibrado)</span>
            <span>85px (Fusiona cúmulos)</span>
          </div>
        </div>

        {/* MinPts Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="dbscan-minpts-slider" className="font-semibold text-slate-300">
              Mínimo de Puntos (MinPts):
            </label>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              MinPts = {params.minPts}
            </span>
          </div>
          <input
            id="dbscan-minpts-slider"
            type="range"
            min={2}
            max={12}
            step={1}
            value={params.minPts}
            onChange={(e) =>
              onParamsChange({
                ...params,
                minPts: Number(e.target.value),
              })
            }
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>2 (Cúmulos muy permisivos)</span>
            <span>MinPts ≥ 2 × dim = 4 (Heurística)</span>
            <span>12 (Alta densidad exigida)</span>
          </div>
        </div>
      </div>

      {/* Taxonomía Didáctica de DBSCAN (Puntos Núcleo, Frontera, Ruido) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Núcleos */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30" />
            <span className="text-[11px] font-bold text-slate-200">Puntos Núcleo</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">{coreCount}</div>
          <div className="text-[10px] text-slate-400">≥ {params.minPts} vecinos en radio ε</div>
        </div>

        {/* Fronteras */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-transparent" />
            <span className="text-[11px] font-bold text-slate-200">Puntos Frontera</span>
          </div>
          <div className="text-lg font-bold font-mono text-cyan-400">{borderCount}</div>
          <div className="text-[10px] text-slate-400">Vecino de núcleo, pero &lt; {params.minPts}</div>
        </div>

        {/* Ruido */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-slate-400">✕</span>
            <span className="text-[11px] font-bold text-slate-200">Ruido (Outliers)</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-400">{noiseCount}</div>
          <div className="text-[10px] text-slate-400">
            {totalPoints > 0 ? Math.round((noiseCount / totalPoints) * 100) : 0}% de los datos
          </div>
        </div>
      </div>

      {/* Regla nemotécnica & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
          <input
            id="dbscan-toggle-epshover"
            type="checkbox"
            checked={showEpsHover}
            onChange={onToggleEpsHover}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
          />
          <span>Mostrar Círculo ε al pasar el cursor</span>
        </label>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Pasa el mouse sobre el lienzo para ver los vecinos en el radio ε en tiempo real.
          </span>
        </div>
      </div>
    </div>
  );
}
