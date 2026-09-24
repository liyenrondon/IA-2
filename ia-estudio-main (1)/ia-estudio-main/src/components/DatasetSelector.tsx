import { DatasetType } from '../types';
import { Moon, Disc, CircleDot, Layers, Orbit, Sparkles, Smile, PenTool, RefreshCw } from 'lucide-react';

interface DatasetSelectorProps {
  currentDataset: DatasetType;
  onSelectDataset: (type: DatasetType) => void;
  onRegenerate: () => void;
  onClearCustom?: () => void;
  pointCount: number;
  onPointCountChange: (count: number) => void;
}

export default function DatasetSelector({
  currentDataset,
  onSelectDataset,
  onRegenerate,
  onClearCustom,
  pointCount,
  onPointCountChange,
}: DatasetSelectorProps) {
  const datasets: {
    type: DatasetType;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'moons',
      label: 'Dos Lunas',
      description: 'Lunas entrelazadas (no lineales)',
      icon: <Moon className="w-4 h-4 text-cyan-400" />,
    },
    {
      type: 'circles',
      label: 'Anillos Concéntricos',
      description: 'Círculo dentro de otro círculo',
      icon: <Disc className="w-4 h-4 text-rose-400" />,
    },
    {
      type: 'blobs',
      label: 'Nubes Gaussianas',
      description: '3 cúmulos esféricos simétricos',
      icon: <CircleDot className="w-4 h-4 text-emerald-400" />,
    },
    {
      type: 'varied_density',
      label: 'Densidad Mixta',
      description: 'Una nube densa y otra dispersa',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
    },
    {
      type: 'anisotropic',
      label: 'Elipses Diagonales',
      description: 'Cúmulos estirados en diagonal',
      icon: <Orbit className="w-4 h-4 text-purple-400" />,
    },
    {
      type: 'outliers',
      label: 'Con Ruido / Outliers',
      description: 'Cúmulos con datos atípicos',
      icon: <Sparkles className="w-4 h-4 text-sky-400" />,
    },
    {
      type: 'smiley',
      label: 'Carita Feliz',
      description: 'Ojos, sonrisa curva y rostro',
      icon: <Smile className="w-4 h-4 text-pink-400" />,
    },
    {
      type: 'custom',
      label: 'Dibujar a Mano',
      description: 'Haz clic en el lienzo para crear puntos',
      icon: <PenTool className="w-4 h-4 text-yellow-400" />,
    },
  ];

  return (
    <div id="dataset-selector-card" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Conjuntos de Datos Didácticos
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            (Geometrías que retan a los algoritmos)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Puntos:</label>
          <select
            id="point-count-select"
            value={pointCount}
            onChange={(e) => onPointCountChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
          >
            <option value={120}>120 puntos (Rápido)</option>
            <option value={180}>180 puntos (Equilibrado)</option>
            <option value={260}>260 puntos (Detallado)</option>
          </select>

          <button
            id="btn-regenerate-dataset"
            onClick={onRegenerate}
            title="Generar nueva semilla aleatoria"
            className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerar</span>
          </button>

          {currentDataset === 'custom' && onClearCustom && (
            <button
              id="btn-clear-custom"
              onClick={onClearCustom}
              className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1 rounded-lg transition-colors"
            >
              Limpiar Lienzo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {datasets.map((ds) => {
          const isSelected = currentDataset === ds.type;
          return (
            <button
              key={ds.type}
              id={`dataset-btn-${ds.type}`}
              onClick={() => onSelectDataset(ds.type)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800">
                {ds.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{ds.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{ds.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
