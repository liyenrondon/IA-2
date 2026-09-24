import { ClusteredPoint, Centroid, KMeansParams, DBSCANParams, DatasetType } from '../types';
import ClusterCanvas from './ClusterCanvas';
import { Check, X as XIcon, HelpCircle } from 'lucide-react';

interface CompareViewProps {
  kPoints: ClusteredPoint[];
  kCentroids: Centroid[];
  dPoints: ClusteredPoint[];
  kParams: KMeansParams;
  onKParamsChange: (params: KMeansParams) => void;
  dParams: DBSCANParams;
  onDParamsChange: (params: DBSCANParams) => void;
  datasetType: DatasetType;
  dClusterCount: number;
  dNoiseCount: number;
  kInertia: number;
}

export default function CompareView({
  kPoints,
  kCentroids,
  dPoints,
  kParams,
  onKParamsChange,
  dParams,
  onDParamsChange,
  datasetType,
  dClusterCount,
  dNoiseCount,
  kInertia,
}: CompareViewProps) {
  // Determine pedagogical commentary based on dataset
  const getDatasetVerdict = () => {
    switch (datasetType) {
      case 'moons':
        return {
          winner: 'DBSCAN gana rotundamente',
          reason:
            'K-Means solo puede trazar fronteras lineales perpendiculares entre centroides (Voronoi). Como las lunas son curvas no convexas entrelazadas, K-Means las parte por la mitad. DBSCAN conecta la densidad sin importar la curvatura.',
          kMeansStatus: 'Falla geométrica (parte las lunas)',
          dbscanStatus: 'Éxito rotundo (conecta la densidad continua)',
        };
      case 'circles':
        return {
          winner: 'DBSCAN triunfa (K-Means es matemáticamente incapaz)',
          reason:
            'Los círculos concéntricos comparten el mismo centro de gravedad. K-Means intenta poner centroides que inevitablemente capturan segmentos de ambos círculos. DBSCAN detecta la franja de densidad vacía entre ellos.',
          kMeansStatus: 'Incapaz de separar concentricidad',
          dbscanStatus: 'Separa anillo interior y exterior',
        };
      case 'outliers':
        return {
          winner: 'DBSCAN aísla el ruido; K-Means se contamina',
          reason:
            'En K-Means cada punto debe pertenecer a un cúmulo, por lo que los valores atípicos jalan y desvían los centroides. DBSCAN etiqueta el ruido como -1 sin perturbar los cúmulos densos.',
          kMeansStatus: 'Forzado a absorber anomalías',
          dbscanStatus: `Aisló exitosamente ${dNoiseCount} puntos de ruido`,
        };
      case 'varied_density':
        return {
          winner: 'K-Means ofrece mejor compromiso',
          reason:
            'DBSCAN utiliza un radio ε fijo para todo el dataset. Si calibras ε para la nube densa, la nube dispersa se pierde como ruido. Si calibras para la dispersa, la densa se satura. K-Means particiona ambas por distancia relativa.',
          kMeansStatus: 'Equilibra ambas regiones',
          dbscanStatus: 'Sufre por el radio ε global fijo',
        };
      case 'blobs':
      default:
        return {
          winner: 'K-Means es más simple y eficiente',
          reason:
            'Con nubes esféricas homogéneas, K-Means es extremadamente rápido, determinista con K-Means++ y fácil de interpretar. DBSCAN también funciona, pero requiere calibrar dos parámetros en vez de solo K.',
          kMeansStatus: 'Ideal y de mínima complejidad',
          dbscanStatus: 'Efectivo pero más costoso de configurar',
        };
    }
  };

  const verdict = getDatasetVerdict();

  return (
    <div id="compare-view-container" className="flex flex-col gap-6">
      {/* Diagnostic Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Diagnóstico en Vivo del Dataset
            </span>
            <span className="text-xs font-semibold text-slate-300">
              ({datasetType.toUpperCase()})
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
            {verdict.winner}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{verdict.reason}</p>
      </div>

      {/* Dual Canvases Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: K-Means */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="text-sm font-bold text-sky-400">K-Means</h3>
              <span className="text-xs text-slate-400 font-mono">
                (Inercia: {Math.round(kInertia).toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="compare-k-slider" className="text-slate-400">K:</label>
              <input
                id="compare-k-slider"
                type="range"
                min={1}
                max={6}
                value={kParams.k}
                onChange={(e) => onKParamsChange({ ...kParams, k: Number(e.target.value) })}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <span className="font-mono font-bold text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">
                {kParams.k}
              </span>
            </div>
          </div>

          <ClusterCanvas
            id="canvas-compare-kmeans"
            points={kPoints}
            centroids={kCentroids}
            algorithm="kmeans"
            showVoronoi={true}
            showCentroidLines={true}
          />

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Fronteras lineales Voronoi</span>
            <span className="text-slate-300 font-medium">{verdict.kMeansStatus}</span>
          </div>
        </div>

        {/* Right: DBSCAN */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400">DBSCAN</h3>
              <span className="text-xs text-slate-400 font-mono">
                ({dClusterCount} cúmulos | {dNoiseCount} ruido)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <label htmlFor="compare-eps-slider" className="text-slate-400">ε:</label>
                <input
                  id="compare-eps-slider"
                  type="range"
                  min={15}
                  max={75}
                  value={dParams.eps}
                  onChange={(e) => onDParamsChange({ ...dParams, eps: Number(e.target.value) })}
                  className="w-20 accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono text-emerald-300">{dParams.eps}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="compare-minpts-slider" className="text-slate-400">MinPts:</label>
                <input
                  id="compare-minpts-slider"
                  type="range"
                  min={2}
                  max={10}
                  value={dParams.minPts}
                  onChange={(e) => onDParamsChange({ ...dParams, minPts: Number(e.target.value) })}
                  className="w-16 accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono text-emerald-300">{dParams.minPts}</span>
              </div>
            </div>
          </div>

          <ClusterCanvas
            id="canvas-compare-dbscan"
            points={dPoints}
            algorithm="dbscan"
            eps={dParams.eps}
            minPts={dParams.minPts}
            showEpsHover={true}
          />

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Cúmulos por densidad continua</span>
            <span className="text-slate-300 font-medium">{verdict.dbscanStatus}</span>
          </div>
        </div>
      </div>

      {/* Structured Comparison Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Tabla Comparativa de Diferencias Fundamentales
            </h3>
          </div>
          <span className="text-xs text-slate-400">¿Cuál elegir en tu proyecto?</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Criterio</th>
                <th className="p-3.5 text-sky-300">K-Means</th>
                <th className="p-3.5 text-emerald-300">DBSCAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">Geometría del Cúmulo</td>
                <td className="p-3.5 text-slate-300">
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <XIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Solo esféricos / convexos e isotrópicos</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Cualquier forma arbitraria (lunas, anillos, cadenas)</span>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">¿Especificar K a priori?</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300 font-medium">
                    Sí, obligatorio
                  </span>{' '}
                  (Requiere método del codo o silueta)
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-medium">
                    No, automático
                  </span>{' '}
                  (Determinado por la densidad local)
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">Manejo de Datos Atípicos (Ruido)</td>
                <td className="p-3.5 text-slate-300">
                  Sensible: Todo punto se asigna obligatoriamente a un cúmulo, distorsionando centroides.
                </td>
                <td className="p-3.5 text-slate-300 font-medium text-emerald-300">
                  Robusto: Identifica y aísla puntos de ruido como etiqueta -1 sin afectar cúmulos.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">Hiperparámetros</td>
                <td className="p-3.5 font-mono text-slate-300">K (número), método de inicialización</td>
                <td className="p-3.5 font-mono text-slate-300">ε (radio de vecindad), MinPts (umbral núcleo)</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">Densidades Variables</td>
                <td className="p-3.5 text-slate-300">
                  Se adapta razonablemente dividiendo el espacio euclidiano.
                </td>
                <td className="p-3.5 text-rose-300">
                  Sufre si las densidades difieren mucho, debido al radio global ε fijo.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-semibold text-white">Complejidad Computacional</td>
                <td className="p-3.5 font-mono text-sky-300">
                  O(n · K · i) — Extremadamente rápido y escalable
                </td>
                <td className="p-3.5 font-mono text-emerald-300">
                  O(n log n) con árboles espaciales o O(n²) en el peor caso
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
