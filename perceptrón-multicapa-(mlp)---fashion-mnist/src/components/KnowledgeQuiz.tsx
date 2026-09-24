import { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: '¿Por qué es fundamental incluir al menos una capa oculta con activación no lineal para clasificar prendas de Fashion MNIST?',
    options: [
      'Para que la red consuma menos memoria en el navegador.',
      'Porque las clases de ropa no son linealmente separables en el espacio original de píxeles.',
      'Porque sin capas ocultas la red no podría usar números flotantes.',
      'Para evitar que las imágenes de 28x28 tengan ruido de fondo.'
    ],
    correctIndex: 1,
    explanation: '¡Exacto! El perceptrón simple solo puede trazar hiperplanos lineales. Prendas como vestidos y camisetas comparten píxeles centrales y solo pueden separarse mediante combinaciones no lineales de características espaciales.'
  },
  {
    id: 2,
    question: 'En la capa de salida para las 10 clases mutuamente excluyentes de Fashion MNIST, ¿qué combinación estándar se utiliza?',
    options: [
      'Activación ReLU con Error Cuadrático Medio (MSE).',
      'Activación Sigmoide con Pérdida Hinge.',
      'Activación Softmax con Entropía Cruzada Categórica (Cross-Entropy).',
      'Activación Lineal sin función de pérdida.'
    ],
    correctIndex: 2,
    explanation: '¡Correcto! Softmax transforma los 10 logits en una distribución de probabilidades que suma 1.0 (100%), y la Entropía Cruzada penaliza drásticamente las predicciones erróneas seguras.'
  },
  {
    id: 3,
    question: 'Si todas las neuronas de un MLP tuvieran funciones de activación lineales (f(x) = x), ¿qué ocurriría?',
    options: [
      'La red colapsaría matemáticamente en un simple modelo lineal de una sola capa.',
      'La red aprendería infinitas curvas no lineales complejas.',
      'La función de pérdida se volvería siempre cero.',
      'La retropropagación no necesitaría calcular derivadas.'
    ],
    correctIndex: 0,
    explanation: '¡Excelente! La composición de transformaciones lineales W₂·(W₁·X) es equivalente a una única matriz W_eq·X. Sin no-linealidad, agregar 100 capas ocultas equivale matemáticamente a una sola capa.'
  },
  {
    id: 4,
    question: '¿Cuál es la principal ventaja de la función ReLU (max(0, z)) frente a la Sigmoide en capas ocultas?',
    options: [
      'Su derivada es 1 para valores positivos, previniendo el desvanecimiento del gradiente (vanishing gradient).',
      'Produce números negativos que estabilizan la memoria RAM.',
      'Acota la salida estrictamente entre 0 y 1.',
      'Hace innecesario el uso de sesgos (biases).'
    ],
    correctIndex: 0,
    explanation: '¡Muy bien! La sigmoide tiene una derivada máxima de 0.25, por lo que al multiplicarse en backpropagation se extingue. ReLU mantiene un gradiente de 1.0 para z > 0, permitiendo que el error fluya intacto.'
  },
  {
    id: 5,
    question: '¿Qué principio del cálculo matemático hace posible que el error fluya hacia atrás desde la salida a los pesos de entrada?',
    options: [
      'El Teorema de Pitágoras.',
      'La Regla de la Cadena para derivadas compuestas.',
      'La Transformada Rápida de Fourier.',
      'La ley de los grandes números.'
    ],
    correctIndex: 1,
    explanation: '¡Correcto! Backpropagation es la aplicación sistemática y eficiente de la Regla de la Cadena multivariable para calcular ∂L/∂w_ij en tiempo lineal O(W).'
  },
  {
    id: 6,
    question: 'Si al iniciar el entrenamiento la curva de pérdida (Loss) oscila caóticamente o explota hacia el infinito, ¿qué deberías ajustar?',
    options: [
      'Aumentar la resolución de la imagen a 4K.',
      'Reducir la tasa de aprendizaje (Learning Rate α).',
      'Eliminar todas las conexiones sinápticas.',
      'Cambiar el fondo de la imagen de negro a blanco.'
    ],
    correctIndex: 1,
    explanation: '¡Exacto! Una tasa de aprendizaje demasiado alta provoca que los pasos en el descenso del gradiente sobrepasen el mínimo local o global, rebotando caóticamente y divergiendo.'
  }
];

export function KnowledgeQuiz() {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const isComplete = answeredCount === QUIZ_QUESTIONS.length;

  const score = Object.entries(userAnswers).reduce((acc, [qId, ansIdx]) => {
    const q = QUIZ_QUESTIONS.find(item => item.id === Number(qId));
    return acc + (q && q.correctIndex === ansIdx ? 1 : 0);
  }, 0);

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Evaluación y Reto Pedagógico
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Pon a Prueba tu Comprensión del Perceptrón Multicapa
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Responde las 6 preguntas conceptuales sobre arquitectura, no-linealidad, funciones de pérdida y retropropagación aplicadas a Fashion MNIST.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {showResults ? (
              <button
                onClick={resetQuiz}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Reiniciar Cuestionario
              </button>
            ) : (
              <button
                onClick={() => setShowResults(true)}
                disabled={!isComplete}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Comprobar Respuestas ({answeredCount}/{QUIZ_QUESTIONS.length})
              </button>
            )}
          </div>
        </div>

        {/* Results Banner if submitted */}
        {showResults && (
          <div className="mt-5 p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-indigo-400 block">
                Resultado de la Evaluación
              </span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                Has obtenido <span className="text-emerald-400">{score}</span> de <span className="text-slate-200">{QUIZ_QUESTIONS.length}</span> aciertos ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%)
              </div>
            </div>
            <div className="text-3xl">
              {score === QUIZ_QUESTIONS.length ? '🏆' : score >= 4 ? '🎉' : '📚'}
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {QUIZ_QUESTIONS.map((q, qIndex) => {
          const selectedOption = userAnswers[q.id];
          const isCorrect = selectedOption === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-6 bg-slate-900 border rounded-2xl transition-all ${
                showResults
                  ? isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-rose-500/50 bg-rose-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
                    0{qIndex + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {q.question}
                  </h3>
                </div>
                {showResults && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isCorrect ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                  }`}>
                    {isCorrect ? 'Correcto' : 'Incorrecto'}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80';

                  if (showResults) {
                    if (optIdx === q.correctIndex) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-500';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-indigo-950 border-indigo-500 text-white font-medium ring-1 ring-indigo-500';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      {showResults && optIdx === q.correctIndex && (
                        <span className="text-emerald-400 font-bold ml-2">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation card after submit */}
              {showResults && (
                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                    Explicación didáctica:
                  </span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
