import { useState, useMemo } from 'react';
import { ActivationType } from '../types/mlp';
import { relu, dRelu, sigmoid, dSigmoid, tanh, dTanh, leakyRelu, dLeakyRelu, softmax } from '../ml/engine';

export function ConceptLab() {
  const [activeTopic, setActiveTopic] = useState<'xor' | 'activation' | 'softmax' | 'backprop'>('xor');

  // Activation interactive tester states
  const [inputVal, setInputVal] = useState(1.5);
  const [selectedAct, setSelectedAct] = useState<ActivationType>('relu');

  // Softmax temperature tester state
  const [rawLogits, setRawLogits] = useState<number[]>([2.4, 0.8, -0.5, 4.1, 1.2]);
  const [temperature, setTemperature] = useState<number>(1.0);

  // Compute activation and derivative for current inputVal
  const actVal = useMemo(() => {
    switch (selectedAct) {
      case 'relu': return relu(inputVal);
      case 'sigmoid': return sigmoid(inputVal);
      case 'tanh': return tanh(inputVal);
      case 'leaky_relu': return leakyRelu(inputVal);
    }
  }, [inputVal, selectedAct]);

  const actDeriv = useMemo(() => {
    switch (selectedAct) {
      case 'relu': return dRelu(inputVal);
      case 'sigmoid': return dSigmoid(sigmoid(inputVal));
      case 'tanh': return dTanh(tanh(inputVal));
      case 'leaky_relu': return dLeakyRelu(inputVal);
    }
  }, [inputVal, selectedAct]);

  // Scaled Softmax with temperature
  const tempSoftmaxProbs = useMemo(() => {
    const scaled = rawLogits.map(z => z / Math.max(0.1, temperature));
    return softmax(scaled);
  }, [rawLogits, temperature]);

  const topics = [
    { id: 'xor', title: '01. ¿Por qué Capas Ocultas? (Límite del Perceptrón Simple)', icon: '🧩' },
    { id: 'activation', title: '02. Funciones de Activación & Gradiente Desvanecido', icon: '📈' },
    { id: 'softmax', title: '03. Softmax & Entropía Cruzada Categórica', icon: '🎯' },
    { id: 'backprop', title: '04. Regla de la Cadena & Retropropagación (Backprop)', icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
          Laboratorio Teórico-Práctico
        </span>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Conceptos Fundamentales del Perceptrón Multicapa (MLP)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Explora interactivamente la matemática y las intuiciones que sustentan el aprendizaje profundo: fronteras no lineales, derivadas de activación, probabilidades de Softmax y el flujo inverso de gradientes.
        </p>

        {/* Topic Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
          {topics.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTopic === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TOPIC 1: Por qué capas ocultas (XOR & Separabilidad) */}
      {activeTopic === 'xor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              El Límite del Perceptrón Simple y la Revolución del MLP
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              En 1969, Marvin Minsky y Seymour Papert publicaron su célebre libro <em>"Perceptrons"</em>, demostrando matemáticamente que un perceptrón de una sola capa solo puede trazar <strong>fronteras de decisión lineales</strong> (una recta en 2D, un plano en 3D, o un hiperplano en dimensiones superiores).
            </p>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-indigo-400 block">
                ¿Qué ocurre en el Dataset Fashion MNIST?
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Una <strong>Camiseta</strong> y un <strong>Vestido</strong> comparten la presencia de tela en la zona pectoral superior, pero se diferencian en la parte inferior (la falda ensanchada) y en las mangas.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ninguna combinación lineal simple de píxeles independientes puede distinguir estas clases sin combinar características espaciales. La <strong>capa oculta</strong> proyecta el espacio de 784 píxeles a un nuevo espacio dimensional donde las clases complejas de ropa se vuelven linealmente separables.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-slate-400">Teorema de Aproximación Universal (Hornik, 1989):</div>
              <p className="text-slate-300 text-[11px] font-sans">
                Un Perceptrón Multicapa con una sola capa oculta y un número suficiente de neuronas con activación no lineal puede aproximar cualquier función continua con cualquier grado de precisión arbitrario.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-100">
              Demostración Gráfica: Problema XOR
            </h4>
            <p className="text-xs text-slate-400">
              Las clases en cruz (XOR) no se pueden separar con una sola línea recta:
            </p>

            {/* SVG Visualizing 2D non-linear separation */}
            <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center relative">
              <svg viewBox="0 0 240 200" className="w-full h-full">
                {/* Axes */}
                <line x1="30" y1="170" x2="210" y2="170" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="170" x2="30" y2="20" stroke="#475569" strokeWidth="1.5" />
                <text x="215" y="174" fill="#94a3b8" fontSize="10">x₁</text>
                <text x="26" y="15" fill="#94a3b8" fontSize="10">x₂</text>

                {/* Attempted Linear Boundary line (FAILS) */}
                <line x1="30" y1="40" x2="200" y2="170" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
                <text x="140" y="70" fill="#f43f5e" fontSize="9" fontWeight="bold">
                  Línea lineal (Falla)
                </text>

                {/* Non-linear MLP Boundary (SUCCEEDS) */}
                <path
                  d="M 60,170 Q 120,70 170,170"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                <text x="80" y="105" fill="#10b981" fontSize="9" fontWeight="bold">
                  Frontera MLP (No lineal)
                </text>

                {/* Class A points (0,0) and (1,1) */}
                <circle cx="60" cy="140" r="7" fill="#6366f1" />
                <circle cx="170" cy="50" r="7" fill="#6366f1" />

                {/* Class B points (0,1) and (1,0) */}
                <rect x="53" y="43" width="14" height="14" rx="3" fill="#f59e0b" />
                <rect x="163" y="133" width="14" height="14" rx="3" fill="#f59e0b" />
              </svg>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-indigo-500" /> Clase A (Camisetas / Tops)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-amber-500" /> Clase B (Pantalones)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 2: Funciones de Activación & Gradiente Desvanecido */}
      {activeTopic === 'activation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Comparador de Funciones de Activación
            </h3>
            <p className="text-xs text-slate-300">
              Sin funciones de activación no lineales, múltiples capas lineales colapsarían en una sola transformación lineal (<span className="text-indigo-400 font-mono">W₂·W₁·X = W_eq·X</span>).
            </p>

            {/* Function switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['relu', 'leaky_relu', 'tanh', 'sigmoid'] as ActivationType[]).map(act => (
                <button
                  key={act}
                  onClick={() => setSelectedAct(act)}
                  className={`py-1.5 text-xs font-medium rounded-lg uppercase cursor-pointer transition-colors ${
                    selectedAct === act
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {act.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Input Slider */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Valor de entrada antes de activación (z):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  z = {inputVal >= 0 ? `+${inputVal.toFixed(2)}` : inputVal.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.1"
                value={inputVal}
                onChange={e => setInputVal(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              {/* Output values */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Activación a = f(z)</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {actVal.toFixed(4)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Derivada f'(z)</span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {actDeriv.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Function Mathematical Definition */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400">Definición Matemática:</div>
              {selectedAct === 'relu' && (
                <>
                  <div className="text-emerald-400">f(z) = max(0, z)</div>
                  <div className="text-amber-400">f'(z) = 1 si z &gt; 0, 0 si z ≤ 0</div>
                </>
              )}
              {selectedAct === 'sigmoid' && (
                <>
                  <div className="text-emerald-400">f(z) = 1 / (1 + e^(-z))</div>
                  <div className="text-amber-400">f'(z) = f(z) · (1 - f(z)) ≤ 0.25</div>
                </>
              )}
              {selectedAct === 'tanh' && (
                <>
                  <div className="text-emerald-400">f(z) = (e^z - e^(-z)) / (e^z + e^(-z))</div>
                  <div className="text-amber-400">f'(z) = 1 - f(z)²</div>
                </>
              )}
              {selectedAct === 'leaky_relu' && (
                <>
                  <div className="text-emerald-400">f(z) = z si z &gt; 0, 0.05·z si z ≤ 0</div>
                  <div className="text-amber-400">f'(z) = 1 si z &gt; 0, 0.05 si z ≤ 0</div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-100">
              ¿Por qué ReLU domina en Fashion MNIST? (Gradiente Desvanecido)
            </h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <strong className="text-rose-400 block font-sans">
                El problema de la Sigmoide (Vanishing Gradient):
              </strong>
              <p>
                La derivada máxima de la Sigmoide es de apenas <strong>0.25</strong>. En una red con varias capas, durante la retropropagación se multiplican estas derivadas:
              </p>
              <div className="font-mono text-slate-400 p-2 bg-slate-900 rounded text-[11px]">
                δ^[1] ∝ (0.25) × (0.25) × ... ≈ 0.0039
              </div>
              <p className="text-slate-400">
                El gradiente se vuelve infinitesimalmente pequeño, impidiendo que las primeras capas que procesan los píxeles aprendan patrones.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <strong className="text-emerald-400 block font-sans">
                La ventaja de ReLU:
              </strong>
              <p>
                La derivada de ReLU para cualquier valor positivo es exactamente <strong>1.0</strong>. El gradiente fluye sin atenuarse a través de tantas capas como sean necesarias, acelerando el entrenamiento hasta 6 veces.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 3: Softmax & Cross Entropy */}
      {activeTopic === 'softmax' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Softmax y Temperatura (T)
            </h3>
            <p className="text-xs text-slate-300">
              La capa de salida produce valores continuos no acotados (logits <span className="text-indigo-400 font-mono">z_i</span>). Softmax los convierte en una distribución de probabilidad válida donde cada valor está en <span className="font-mono text-emerald-400">[0, 1]</span> y su suma total es <span className="font-mono text-emerald-400">1.0 (100%)</span>.
            </p>

            {/* Temperature Slider */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Temperatura (T):</span>
                <span className="text-xs font-mono font-bold text-amber-400">T = {temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>T=0.1 (Argmax Duro)</span>
                <span>T=1.0 (Estándar)</span>
                <span>T=5.0 (Uniforme/Suave)</span>
              </div>
            </div>

            {/* Interactive Logits to Softmax display */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Logits de prueba (z) → Probabilidad Softmax:
              </span>
              {['👕 Camiseta', '👖 Pantalón', '👗 Vestido', '👟 Zapatilla', '👜 Bolso'].map((name, i) => {
                const prob = tempSoftmaxProbs[i] || 0;
                return (
                  <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">logit={rawLogits[i]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-indigo-400 w-12 text-right">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-100">
              Entropía Cruzada Categórica (Categorical Cross-Entropy)
            </h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-slate-400">Fórmula de Pérdida:</div>
              <div className="text-amber-400 text-sm">
                L = - ∑ y_k · log(p_k) = - log(p_real)
              </div>
              <p className="text-slate-400 text-[11px] font-sans pt-2 border-t border-slate-800">
                Donde <span className="font-mono text-slate-200">y_k</span> es 1 para la etiqueta real y 0 para las demás (one-hot). Por tanto, la pérdida es simplemente el logaritmo negativo de la probabilidad asignada a la clase correcta.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <strong className="text-indigo-400 block font-sans">
                ¿Por qué no usamos el Error Cuadrático Medio (MSE)?
              </strong>
              <p>
                Si una red predice con 99.9% de certeza que un <em>Vestido</em> es una <em>Zapatilla</em>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>MSE daría un error modesto: (1 - 0.001)² ≈ 0.998</li>
                <li>La Entropía Cruzada produce: -log(0.001) ≈ <strong>6.90</strong> (castigo exponencial masivo que genera gradientes gigantescos para corregir rápidamente el error).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 4: Backpropagation & Regla de la Cadena */}
      {activeTopic === 'backprop' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              La Regla de la Cadena y el Flujo Inverso de Gradientes
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Descubierto para redes neuronales por Rumelhart, Hinton y Williams en 1986, Backpropagation permite calcular la derivada parcial de la pérdida respecto a cada peso individual en tiempo lineal O(W).
            </p>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">1. Entrada</span>
                <div className="text-xs font-mono text-slate-200 font-bold mt-1">X (Píxeles)</div>
                <div className="text-[11px] text-slate-400 mt-2">Imagen 28×28 de Fashion MNIST</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-indigo-500/50">
                <span className="text-[10px] text-indigo-400 uppercase font-semibold">2. Capa Oculta</span>
                <div className="text-xs font-mono text-indigo-300 font-bold mt-1">z^[1] = W^[1]·X + b^[1]</div>
                <div className="text-xs font-mono text-emerald-400 mt-1">a^[1] = ReLU(z^[1])</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/50">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">3. Capa Salida</span>
                <div className="text-xs font-mono text-amber-300 font-bold mt-1">z^[2] = W^[2]·a^[1] + b^[2]</div>
                <div className="text-xs font-mono text-emerald-400 mt-1">ŷ = Softmax(z^[2])</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-rose-500/50">
                <span className="text-[10px] text-rose-400 uppercase font-semibold">4. Error / Pérdida</span>
                <div className="text-xs font-mono text-rose-300 font-bold mt-1">L = -∑ y · log(ŷ)</div>
                <div className="text-[11px] text-slate-400 mt-1">Gradiente inicial: δ^[2] = ŷ - y</div>
              </div>
            </div>

            {/* Reverse Arrow indication */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-center gap-3 text-xs text-rose-400 font-medium">
              <span>← Flujo del Gradiente (Retropropagación del Error hacia atrás) ←</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <strong className="text-slate-100 block">Derivadas Parciales de la Capa Oculta:</strong>
              <p className="text-slate-400">
                Aplicando la regla de la cadena:
              </p>
              <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-indigo-300">
                ∂L / ∂W^[1] = (∂L / ∂z^[1]) · (∂z^[1] / ∂W^[1]) = δ^[1] · Xᵀ
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <strong className="text-slate-100 block">Actualización con Descenso del Gradiente:</strong>
              <p className="text-slate-400">
                Ajustamos cada peso en el sentido del descenso más pronunciado:
              </p>
              <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-300">
                W^[1] ← W^[1] - α · (∂L / ∂W^[1])
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
