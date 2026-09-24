import { ActivationType, FashionClassInfo } from '../types/mlp';
import { FASHION_CLASSES } from '../data/fashionMnistData';

interface NeuronDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  neuronData: {
    layerType: 'hidden' | 'output';
    layerIndex: number;
    neuronIndex: number;
    z: number;
    a: number;
    bias: number;
    weights: number[];
    activationType: ActivationType;
    classInfo?: FashionClassInfo;
  } | null;
  inputValues: number[];
}

export function NeuronDetailModal({
  isOpen,
  onClose,
  neuronData,
  inputValues
}: NeuronDetailModalProps) {
  if (!isOpen || !neuronData) return null;

  const {
    layerType,
    layerIndex,
    neuronIndex,
    z,
    a,
    bias,
    weights,
    activationType,
    classInfo
  } = neuronData;

  // Find top positive and negative contributing inputs
  const contributions = weights.map((w, idx) => ({
    inputIndex: idx,
    weight: w,
    inputValue: inputValues[idx] || 0,
    contribution: w * (inputValues[idx] || 0)
  }));

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topContributions = contributions.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              {layerType === 'output' ? classInfo?.icon || '🎯' : 'N'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {layerType === 'output'
                  ? `Neurona de Salida: ${classInfo?.name || `Clase ${neuronIndex}`}`
                  : `Neurona Oculta #${neuronIndex + 1} (Capa ${layerIndex})`}
              </h3>
              <p className="text-xs text-slate-400">
                Desglose matemático del cálculo interno en esta neurona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Formula summary card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-2">
            <div className="text-slate-400">1. Combinación Lineal Ponderada (Suma + Sesgo):</div>
            <div className="text-indigo-300 font-medium pl-2">
              z = ∑ (w_i · x_i) + b
            </div>
            <div className="text-slate-500 pl-2">
              z = ({z - bias >= 0 ? '+' : ''}{(z - bias).toFixed(4)}) + ({bias >= 0 ? '+' : ''}{bias.toFixed(4)}) = <span className="text-amber-400 font-semibold">{z.toFixed(4)}</span>
            </div>

            <div className="text-slate-400 pt-2 border-t border-slate-800/60">
              2. Función de Activación no lineal:
            </div>
            {layerType === 'output' ? (
              <div className="text-emerald-300 font-medium pl-2">
                a = Softmax(z) = e^(z) / ∑ e^(z_j) = <span className="text-emerald-400 font-bold">{(a * 100).toFixed(2)}%</span>
              </div>
            ) : (
              <div className="text-emerald-300 font-medium pl-2">
                a = {activationType.toUpperCase()}(z) = <span className="text-emerald-400 font-bold">{a.toFixed(4)}</span>
                {activationType === 'relu' && (
                  <span className="text-slate-400 ml-2">
                    {z <= 0 ? '(Inactiva por z ≤ 0)' : '(Activa positivamente)'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400 block">Suma Ponderada (z)</span>
              <span className="text-lg font-bold text-slate-200">{z.toFixed(3)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400 block">Sesgo (Bias b)</span>
              <span className="text-lg font-bold text-indigo-400">
                {bias >= 0 ? `+${bias.toFixed(3)}` : bias.toFixed(3)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400 block">Activación Final (a)</span>
              <span className="text-lg font-bold text-emerald-400">
                {layerType === 'output' ? `${(a * 100).toFixed(1)}%` : a.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Top Contributing Inputs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mayores Contribuciones de Entrada (w_i · x_i)
            </h4>
            <div className="space-y-1.5">
              {topContributions.map((c, i) => {
                const isPositive = c.contribution >= 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/50 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">Entrada #{c.inputIndex}</span>
                      <span className="text-slate-400">
                        (x = {c.inputValue.toFixed(2)}) × (w = {c.weight.toFixed(3)})
                      </span>
                    </div>
                    <span
                      className={`font-mono font-medium ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}{c.contribution.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Inspección
          </button>
        </div>
      </div>
    </div>
  );
}
