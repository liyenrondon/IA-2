import { BookOpen, Compass, Zap, HelpCircle } from 'lucide-react';

export default function TheoryGuide() {
  return (
    <div id="theory-guide-container" className="space-y-6">
      {/* Intro Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Fundamentos de Aprendizaje No Supervisado (Clustering)
            </h2>
            <p className="text-xs text-slate-400">
              Aprende cómo las máquinas descubren patrones ocultos en datos sin etiquetas previas.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          En el <strong>Aprendizaje No Supervisado</strong> no disponemos de respuestas correctas ni etiquetas objetivo (a diferencia de la clasificación o regresión). El algoritmo recibe únicamente las coordenadas de los datos y debe responder por sí mismo: <em>«¿Qué estructura, agrupaciones o densidades naturales existen aquí?»</em>.
        </p>
      </div>

      {/* Grid of 2 Core Algorithms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* K-Means Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-400">1. Algoritmo K-Means</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">
                Particional
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Es el algoritmo de agrupamiento más popular del mundo. Modela los cúmulos como nubes esféricas representadas por un punto central llamado <strong>Centroide (μ)</strong>.
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200">Ciclo de 3 Pasos (Expectation-Maximization):</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Inicializar:</strong> Colocar K centroides en el espacio.</li>
                <li><strong className="text-slate-200">Asignar:</strong> Cada punto se asocia al centroide más cercano (distancia Euclidiana).</li>
                <li><strong className="text-slate-200">Actualizar:</strong> Mover cada centroide a la posición promedio (media) de sus puntos.</li>
              </ol>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">Hiperparámetro Clave:</div>
              <p className="text-slate-400">
                <strong className="text-sky-300">K:</strong> El número exacto de grupos que obligas al algoritmo a encontrar. Si K=3, siempre creará 3 grupos, aunque los datos naturalmente sean 2 o 5.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs">
              <strong>Gran Limitación:</strong> Solo puede trazar límites lineales (polígonos de Voronoi). Es ciego ante lunas, anillos o serpentinas.
            </div>
          </div>
        </div>

        {/* DBSCAN Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-400">2. Algoritmo DBSCAN</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                Basado en Densidad
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <em>Density-Based Spatial Clustering of Applications with Noise</em>. No busca centros; busca regiones continuas donde los puntos estén muy apiñados, separadas por zonas vacías.
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200">Los 3 Tipos de Puntos:</div>
              <ul className="space-y-1 text-slate-400">
                <li>
                  <strong className="text-emerald-400">🌟 Núcleo (Core):</strong> Tiene al menos <em>MinPts</em> vecinos dentro de su radio <em>ε</em>.
                </li>
                <li>
                  <strong className="text-cyan-400">⭕ Frontera (Border):</strong> Vecino de un núcleo, pero tiene menos de <em>MinPts</em> vecinos.
                </li>
                <li>
                  <strong className="text-slate-400">✕ Ruido (Noise):</strong> No tiene ningún núcleo cerca. Queda etiquetado como -1 (outlier).
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">Hiperparámetros Clave:</div>
              <p className="text-slate-400">
                <strong className="text-emerald-300">ε (Epsilon):</strong> El radio del radar de búsqueda.<br />
                <strong className="text-emerald-300">MinPts:</strong> La multitud mínima exigida para considerarse cúmulo.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs">
              <strong>Gran Ventaja:</strong> Descubre formas geométricas complejas sin obligarte a adivinar K y aísla la basura o datos erróneos.
            </div>
          </div>
        </div>
      </div>

      {/* Practical Intuition Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Compass className="w-4 h-4" />
          <span>Guía Rápida: ¿Cómo elegir hiperparámetros en el mundo real?</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-sky-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Para K-Means:</span>
            </div>
            <p className="text-slate-400">
              • <strong>Método del Codo:</strong> Grafica la inercia (WCSS) frente a distintos valores de K. Elige el punto de inflexión donde la ganancia empieza a ser mínima.<br />
              • <strong>Coeficiente de Silueta:</strong> Mide qué tan cerca está cada punto de su propio cúmulo comparado con el cúmulo vecino más cercano (-1 a +1).
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Para DBSCAN:</span>
            </div>
            <p className="text-slate-400">
              • <strong>Regla para MinPts:</strong> Como regla general, usa <em>MinPts ≥ 2 × dimensiones</em> (en datos 2D usa MinPts ≥ 4; si hay mucho ruido usa valores mayores).<br />
              • <strong>Regla para ε:</strong> Calcula la distancia al k-ésimo vecino más cercano para todos los puntos, ordénala de menor a mayor y busca el codo en la gráfica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
