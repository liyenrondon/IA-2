import { Challenge } from '../types';

export const CHALLENGES: Challenge[] = [
  {
    id: 'moons',
    title: 'Misión 1: El Rescate de las Lunas',
    level: 'Fácil',
    dataset: 'moons',
    algorithm: 'dbscan',
    initialParams: {
      dbscan: { eps: 80, minPts: 4 },
      kmeans: { k: 2, initMethod: 'kmeans++', maxIter: 20 },
    },
    description:
      'Dos naves espaciales dejaron estelas en forma de lunas entrelazadas. K-Means intenta dividirlas con una línea recta y falla. ¡Configura DBSCAN para que siga la curvatura y descubra exactamente 2 cúmulos!',
    goalDescription: 'Obtener exactamente 2 cúmulos con DBSCAN y menos de 10 puntos de ruido.',
    hint: 'Si ε es demasiado grande, ambas lunas se fusionarán en 1 solo cúmulo. Si ε es muy pequeño, las lunas se romperán o se considerarán ruido. Prueba con ε entre 32 y 48, y MinPts entre 4 y 7.',
    validate: (algo, _kParams, dParams, points) => {
      const clusters = new Set(points.filter((p) => p.cluster >= 0).map((p) => p.cluster));
      const noiseCount = points.filter((p) => p.cluster === -1).length;
      const count = clusters.size;

      if (count === 2 && noiseCount <= 12) {
        return {
          passed: true,
          message: '¡Excelente! DBSCAN conectó las lunas por densidad continua sin cruzarlas.',
          progress: 100,
        };
      }
      if (count === 1) {
        return {
          passed: false,
          message: 'Demasiado conectado: Ambas lunas se unieron en 1 solo cúmulo. Reduce el radio ε.',
          progress: 50,
        };
      }
      if (count > 2) {
        return {
          passed: false,
          message: `Se detectaron ${count} fragmentos. Aumenta un poco ε o reduce MinPts para conectar los puntos.`,
          progress: 60,
        };
      }
      return {
        passed: false,
        message: 'Ajusta los parámetros para que la densidad descubra las dos trayectorias.',
        progress: 25,
      };
    },
  },
  {
    id: 'circles',
    title: 'Misión 2: Los Anillos de Saturno',
    level: 'Intermedio',
    dataset: 'circles',
    algorithm: 'dbscan',
    initialParams: {
      dbscan: { eps: 20, minPts: 5 },
      kmeans: { k: 2, initMethod: 'kmeans++', maxIter: 20 },
    },
    description:
      'Observa cómo K-Means es geométricamente incapaz de separar un círculo interior de uno exterior concéntrico porque sus fronteras de decisión son hiperplanos lineales (Voronoi). ¡Usa DBSCAN para resolver la concentricidad!',
    goalDescription: 'Separar el anillo interno del externo en exactamente 2 cúmulos limpios.',
    hint: 'El espacio vacío entre el anillo interior y el exterior actúa como una barrera de densidad nula. Asegúrate de que el radio ε sea menor que la distancia entre ambos anillos (prueba ε entre 28 y 42).',
    validate: (_algo, _kParams, _dParams, points) => {
      const clusters = new Set(points.filter((p) => p.cluster >= 0).map((p) => p.cluster));
      const noiseCount = points.filter((p) => p.cluster === -1).length;
      const count = clusters.size;

      if (count === 2 && noiseCount <= 15) {
        return {
          passed: true,
          message: '¡Brillante! Has demostrado la superioridad de DBSCAN en topologías concéntricas.',
          progress: 100,
        };
      }
      if (count === 1) {
        return {
          passed: false,
          message: '¡El radio ε cruzó el abismo entre anillos! Reduce ε para no conectar ambos anillos.',
          progress: 45,
        };
      }
      return {
        passed: false,
        message: `Detectados ${count} cúmulos y ${noiseCount} puntos de ruido. Afina el radio ε.`,
        progress: 30,
      };
    },
  },
  {
    id: 'outliers',
    title: 'Misión 3: Filtro de Ruido Galáctico',
    level: 'Intermedio',
    dataset: 'outliers',
    algorithm: 'dbscan',
    initialParams: {
      dbscan: { eps: 55, minPts: 3 },
      kmeans: { k: 2, initMethod: 'kmeans++', maxIter: 20 },
    },
    description:
      'En este sensor hay 2 cúmulos densos de estrellas y muchas partículas de ruido aleatorias. En K-Means, cada mota de polvo atrae al centroide y distorsiona el resultado. ¡Ajusta DBSCAN para aislar el ruido (-1)!',
    goalDescription: 'Detectar exactamente 2 cúmulos principales y clasificar al menos 18 puntos como Ruido.',
    hint: 'Si MinPts es muy bajo o ε muy grande, las partículas aisladas se convertirán en falsos núcleos. Aumenta MinPts a 5 o 6 y mantén ε moderado (alrededor de 32-42).',
    validate: (_algo, _kParams, _dParams, points) => {
      const clusters = new Set(points.filter((p) => p.cluster >= 0).map((p) => p.cluster));
      const noiseCount = points.filter((p) => p.cluster === -1).length;
      const count = clusters.size;

      if (count === 2 && noiseCount >= 18 && noiseCount <= 38) {
        return {
          passed: true,
          message: '¡Perfecto! Los dos cúmulos están identificados y los puntos errantes marcados como ruido.',
          progress: 100,
        };
      }
      if (noiseCount < 18) {
        return {
          passed: false,
          message: `Solo detectaste ${noiseCount} puntos de ruido. Aumenta MinPts o reduce ε para no absorber polvo disperso.`,
          progress: Math.min(80, Math.round((noiseCount / 18) * 80)),
        };
      }
      return {
        passed: false,
        message: `Se detectaron ${count} cúmulos y ${noiseCount} de ruido. Mantén el objetivo en 2 cúmulos.`,
        progress: 40,
      };
    },
  },
  {
    id: 'blobs',
    title: 'Misión 4: El Veredicto del Codo',
    level: 'Fácil',
    dataset: 'blobs',
    algorithm: 'kmeans',
    initialParams: {
      kmeans: { k: 1, initMethod: 'kmeans++', maxIter: 25 },
      dbscan: { eps: 35, minPts: 5 },
    },
    description:
      'Aquí tenemos cúmulos esféricos gaussianos bien formados. K-Means es el rey de la eficiencia en este terreno. Sin embargo, ¿cuál es el K óptimo? Inspecciona la dispersión y encuentra el K exacto.',
    goalDescription: 'Configura K-Means con K=3 y observa la convergencia de los centroides.',
    hint: 'Cuenta visualmente los centros de gravedad de las 3 nubes. Selecciona K=3 y pulsa "Convergencia Rápida" o "Paso a paso".',
    validate: (algo, kParams, _dParams, _points) => {
      if (kParams.k === 3) {
        return {
          passed: true,
          message: '¡Correcto! Con K=3, cada centroide se asienta en el promedio exacto de cada nube gaussiana.',
          progress: 100,
        };
      }
      return {
        passed: false,
        message: `Tienes K=${kParams.k}. Observa cuántos grupos naturales de puntos hay en el lienzo.`,
        progress: Math.max(20, 100 - Math.abs(kParams.k - 3) * 30),
      };
    },
  },
  {
    id: 'varied_density',
    title: 'Misión 5: El Talón de Aquiles de DBSCAN',
    level: 'Avanzado',
    dataset: 'varied_density',
    algorithm: 'dbscan',
    initialParams: {
      dbscan: { eps: 30, minPts: 5 },
      kmeans: { k: 2, initMethod: 'kmeans++', maxIter: 20 },
    },
    description:
      '¡Cuidado con la trampa! Una nube es súper densa y compacta, mientras que la otra es muy dispersa. DBSCAN usa un radio ε fijo y global para todo el espacio. ¡Descubre por qué le cuesta tanto equilibrar ambas densidades!',
    goalDescription: 'Experimenta cambiando ε y comprueba si puedes capturar ambos cúmulos sin perder la nube dispersa.',
    hint: 'Si pones un ε adecuado para la nube densa (pequeño), la nube dispersa se convertirá en puro ruido. Si aumentas ε para la nube dispersa, la nube densa puede atraer puntos lejanos o saturarse. ¡Esto motiva algoritmos como OPTICS o HDBSCAN!',
    validate: (_algo, _kParams, _dParams, points) => {
      const clusters = new Set(points.filter((p) => p.cluster >= 0).map((p) => p.cluster));
      const noiseCount = points.filter((p) => p.cluster === -1).length;
      const count = clusters.size;

      // Passing condition when user finds a tight parameter or experiences the trade-off
      if (count === 2 && noiseCount < 30) {
        return {
          passed: true,
          message: '¡Excelente calibración! Has encontrado el estrecho punto dulce de ε global para densidades dispares.',
          progress: 100,
        };
      }
      return {
        passed: false,
        message: `Actualmente hay ${count} cúmulos y ${noiseCount} puntos de ruido. Nota cómo una de las dos nubes sufre con este ε.`,
        progress: 60,
      };
    },
  },
];
