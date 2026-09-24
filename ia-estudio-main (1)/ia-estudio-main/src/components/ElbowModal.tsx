import { X, TrendingDown, Check } from 'lucide-react';

interface ElbowModalProps {
  isOpen: boolean;
  onClose: () => void;
  elbowData: { k: number; inertia: number }[];
  currentK: number;
  onSelectK: (k: number) => void;
}

export default function ElbowModal({
  isOpen,
  onClose,
  elbowData,
  currentK,
  onSelectK,
}: ElbowModalProps) {
  if (!isOpen) return null;

  const maxInertia = Math.max(...elbowData.map((d) => d.inertia), 1);
  const minInertia = Math.min(...elbowData.map((d) => d.inertia), 0);
  const range = maxInertia - minInertia || 1;

  // SVG chart dimensions
  const svgWidth = 480;
  const svgHeight = 220;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const pointsSvg = elbowData.map((d) => {
    const x = padLeft + ((d.k - 1) / (elbowData.length - 1 || 1)) * plotW;
    const y = padTop + plotH - ((d.inertia - minInertia) / range) * plotH;
    return { ...d, svgX: x, svgY: y };
  });

  const pathD = pointsSvg.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.svgX} ${pt.svgY}` : `${acc} L ${pt.svgX} ${pt.svgY}`;
  }, '');

  return (
    <div
      id="elbow-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="elbow-modal-content"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative flex flex-col gap-4 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">El Método del Codo (Elbow Method)</h3>
              <p className="text-xs text-slate-400">
                Determina el hiperparámetro K óptimo evaluando la caída de la inercia (WCSS).
              </p>
            </div>
          </div>
          <button
            id="btn-close-elbow-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SVG Curve */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex justify-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-lg h-auto overflow-visible">
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
              const y = padTop + plotH * (1 - frac);
              const val = Math.round(minInertia + frac * range);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="rgba(51, 65, 85, 0.3)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {val > 1000 ? `${Math.round(val / 1000)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Incline line */}
            <path
              d={pathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data points */}
            {pointsSvg.map((pt) => {
              const isSelected = pt.k === currentK;
              return (
                <g
                  key={pt.k}
                  className="cursor-pointer group"
                  onClick={() => {
                    onSelectK(pt.k);
                    onClose();
                  }}
                >
                  {/* Outer circle when selected */}
                  {isSelected && (
                    <circle
                      cx={pt.svgX}
                      cy={pt.svgY}
                      r="12"
                      fill="rgba(56, 189, 248, 0.2)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={pt.svgX}
                    cy={pt.svgY}
                    r={isSelected ? '6' : '4.5'}
                    fill={isSelected ? '#ffffff' : '#38bdf8'}
                    stroke="#0284c7"
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-125"
                  />
                  {/* K Label at Bottom */}
                  <text
                    x={pt.svgX}
                    y={svgHeight - 14}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${
                      isSelected ? 'fill-sky-400 font-bold' : 'fill-slate-400'
                    }`}
                  >
                    K={pt.k}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Label */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 2}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-semibold"
            >
              Número de Cúmulos (K)
            </text>
          </svg>
        </div>

        {/* Intuition Box */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>¿Dónde está el "Codo"?</span>
          </div>
          <p>
            Al aumentar K, la inercia (error al cuadrado) siempre disminuye. El punto óptimo es aquel
            donde la curva se dobla abruptamente (como un codo de un brazo). Añadir más cúmulos después
            del codo solo aporta mejoras marginales y genera sobreajuste (overfitting).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {elbowData.map((d) => (
              <button
                key={d.k}
                id={`elbow-select-k-${d.k}`}
                onClick={() => {
                  onSelectK(d.k);
                  onClose();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1 transition-all ${
                  d.k === currentK
                    ? 'bg-sky-500 text-white border-sky-400 shadow'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>K={d.k}</span>
                {d.k === currentK && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
