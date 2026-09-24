import { FashionClassId, FashionClassInfo, FashionSample } from '../types/mlp';

export const FASHION_CLASSES: FashionClassInfo[] = [
  {
    id: 0,
    name: 'Camiseta / Top',
    nameEn: 'T-shirt / top',
    icon: '👕',
    description: 'Prenda superior ligera con mangas cortas o sin mangas y cuello redondo/en V.',
    features: ['Torso simétrico', 'Mangas cortas laterales', 'Corte recto inferior', 'Cuello amplio']
  },
  {
    id: 1,
    name: 'Pantalón',
    nameEn: 'Trouser',
    icon: '👖',
    description: 'Prenda inferior con cintura superior y dos perneras verticales largas separadas.',
    features: ['Dos columnas verticales', 'Separación central inferior', 'Cintura recta', 'Silueta estrecha y alargada']
  },
  {
    id: 2,
    name: 'Jersey / Suéter',
    nameEn: 'Pullover',
    icon: '🧥',
    description: 'Prenda superior de abrigo cerrada, de tejido grueso con mangas largas continuas.',
    features: ['Mangas largas completas', 'Grosor uniforme', 'Cuello cerrado', 'Bordes elásticos definidos']
  },
  {
    id: 3,
    name: 'Vestido',
    nameEn: 'Dress',
    icon: '👗',
    description: 'Prenda femenina completa que combina corpiño superior y falda ensanchada.',
    features: ['Silueta cónica ensanchada', 'Continuidad de arriba a abajo', 'Sin separación de perneras', 'Hombros o tirantes finos']
  },
  {
    id: 4,
    name: 'Abrigo',
    nameEn: 'Coat',
    icon: '🥼',
    description: 'Prenda exterior pesada de longitud media o larga con solapas o botones frontales.',
    features: ['Estructura rígida', 'Apertura vertical central tenue', 'Mayor longitud que un jersey', 'Mangas gruesas']
  },
  {
    id: 5,
    name: 'Sandalia',
    nameEn: 'Sandal',
    icon: '👡',
    description: 'Calzado ligero y abierto compuesto por una suela fina y tiras cruzadas de sujeción.',
    features: ['Suela horizontal delgada', 'Grandes áreas negras (abiertas)', 'Tiras delgadas diagonales', 'Silueta baja']
  },
  {
    id: 6,
    name: 'Camisa',
    nameEn: 'Shirt',
    icon: '👔',
    description: 'Prenda superior formal o casual con cuello camisero rígido y fila frontal de botones.',
    features: ['Puntas de cuello visibles', 'Línea de botones central', 'Mangas rectas', 'Bordes de hombros marcados']
  },
  {
    id: 7,
    name: 'Zapatilla',
    nameEn: 'Sneaker',
    icon: '👟',
    description: 'Calzado deportivo con suela de goma amortiguada y empeine curvado aerodinámico.',
    features: ['Suela gruesa curvada inferior', 'Perfil aerodinámico asimétrico', 'Puntera redondeada', 'Empeine con cordones']
  },
  {
    id: 8,
    name: 'Bolso',
    nameEn: 'Bag',
    icon: '👜',
    description: 'Accesorio contenedor con cuerpo geométrico (cuadrado/trapezoide) y asa superior.',
    features: ['Asa o tirador en arco superior', 'Cuerpo cuadrado o trapezoidal', 'Espacio vacío entre asa y cuerpo', 'Masa centrada']
  },
  {
    id: 9,
    name: 'Botín',
    nameEn: 'Ankle boot',
    icon: '👢',
    description: 'Calzado robusto que cubre el pie y asciende envolviendo el tobillo, a menudo con tacón.',
    features: ['Caña vertical que sube al tobillo', 'Tacón pronunciado posterior', 'Forma en "L" característica', 'Suela sólida']
  }
];

// Generates 28x28 grayscale image (784 pixels, values 0.0 to 1.0) for Fashion-MNIST patterns
function createEmpty28(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < 28; r++) {
    grid.push(new Array(28).fill(0));
  }
  return grid;
}

function flattenAndAddNoise(grid: number[][], noiseLevel = 0.04): number[] {
  const flat: number[] = [];
  for (let r = 0; r < 28; r++) {
    for (let c = 0; c < 28; c++) {
      let val = grid[r][c];
      if (val > 0.05) {
        // subtle noise texture typical of Fashion MNIST
        val += (Math.random() - 0.5) * noiseLevel;
        val = Math.max(0, Math.min(1, val));
      } else if (Math.random() < 0.015) {
        // faint background sensor noise
        val = Math.random() * 0.05;
      }
      flat.push(Math.round(val * 1000) / 1000);
    }
  }
  return flat;
}

// Generate realistic archetypal Fashion MNIST samples
export function generateFashionSamples(): FashionSample[] {
  const samples: FashionSample[] = [];

  // Helper to draw filled box/rect with anti-aliasing
  const drawRect = (grid: number[][], r1: number, c1: number, r2: number, c2: number, intensity = 0.85) => {
    for (let r = Math.max(0, r1); r <= Math.min(27, r2); r++) {
      for (let c = Math.max(0, c1); c <= Math.min(27, c2); c++) {
        grid[r][c] = Math.max(grid[r][c], intensity);
      }
    }
  };

  // 0: Camiseta / Top (T-shirt)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    const neckCut = 2 + (v % 2);
    // Torso
    drawRect(g, 6, 8, 24, 19, 0.88);
    // Sleeves
    drawRect(g, 6, 4, 13, 8, 0.82);
    drawRect(g, 6, 19, 13, 23, 0.82);
    // Neck cut
    for (let r = 6; r <= 6 + neckCut; r++) {
      for (let c = 12; c <= 15; c++) {
        g[r][c] = 0;
      }
    }
    // Bottom hem
    drawRect(g, 23, 8, 25, 19, 0.92);
    samples.push({
      id: `sample-0-${v}`,
      label: 0,
      name: `Camiseta #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 1: Pantalón (Trouser)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    const width = v % 2 === 0 ? 3 : 4;
    // Waist
    drawRect(g, 4, 8, 8, 19, 0.9);
    // Left leg
    drawRect(g, 8, 8, 25, 8 + width, 0.86);
    // Right leg
    drawRect(g, 8, 19 - width, 25, 19, 0.86);
    samples.push({
      id: `sample-1-${v}`,
      label: 1,
      name: `Pantalón #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 2: Jersey / Suéter (Pullover)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Torso
    drawRect(g, 6, 8, 24, 19, 0.9);
    // Long sleeves angled down
    for (let i = 0; i < 16; i++) {
      const r = 7 + i;
      const cLeft = Math.max(3, 7 - Math.floor(i * 0.25));
      const cRight = Math.min(24, 20 + Math.floor(i * 0.25));
      if (r < 24) {
        drawRect(g, r, cLeft - 2, r, cLeft + 1, 0.82);
        drawRect(g, r, cRight - 1, r, cRight + 2, 0.82);
      }
    }
    // Round crew neck
    for (let c = 12; c <= 15; c++) g[6][c] = 0;
    samples.push({
      id: `sample-2-${v}`,
      label: 2,
      name: `Jersey #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 3: Vestido (Dress)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Upper bodice
    drawRect(g, 4, 10, 11, 17, 0.85);
    // Flare skirt
    for (let r = 12; r <= 25; r++) {
      const spread = Math.floor((r - 11) * 0.65);
      const c1 = Math.max(4, 10 - spread);
      const c2 = Math.min(23, 17 + spread);
      drawRect(g, r, c1, r, c2, 0.9);
    }
    // Thin straps
    drawRect(g, 4, 11, 7, 12, 0.8);
    drawRect(g, 4, 15, 7, 16, 0.8);
    g[4][13] = 0; g[4][14] = 0; g[5][13] = 0; g[5][14] = 0;
    samples.push({
      id: `sample-3-${v}`,
      label: 3,
      name: `Vestido #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 4: Abrigo (Coat)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Torso longer than t-shirt
    drawRect(g, 5, 8, 26, 19, 0.88);
    // Thick sleeves
    drawRect(g, 6, 3, 22, 7, 0.85);
    drawRect(g, 6, 20, 22, 24, 0.85);
    // V-lapel collar
    drawRect(g, 5, 12, 10, 15, 0.2);
    // Central slit button line
    for (let r = 11; r <= 26; r++) {
      g[r][13] = 0.3;
      g[r][14] = 0.95;
    }
    samples.push({
      id: `sample-4-${v}`,
      label: 4,
      name: `Abrigo #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 5: Sandalia (Sandal)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Flat thin sole
    drawRect(g, 20, 4, 22, 24, 0.9);
    // Low heel
    drawRect(g, 22, 4, 24, 8, 0.95);
    // Thin front strap
    drawRect(g, 15, 18, 20, 20, 0.85);
    drawRect(g, 16, 16, 20, 18, 0.8);
    // Ankle / diagonal strap
    for (let k = 0; k < 7; k++) {
      const r = 14 + k;
      const c = 7 + k;
      if (r < 22 && c < 24) {
        g[r][c] = 0.85;
        g[r][c + 1] = 0.85;
      }
    }
    samples.push({
      id: `sample-5-${v}`,
      label: 5,
      name: `Sandalia #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 6: Camisa (Shirt)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Body
    drawRect(g, 6, 8, 24, 19, 0.85);
    // Sleeves
    drawRect(g, 7, 4, 18, 8, 0.8);
    drawRect(g, 7, 19, 18, 23, 0.8);
    // Pointy collar
    drawRect(g, 4, 11, 7, 13, 0.95);
    drawRect(g, 4, 14, 7, 16, 0.95);
    // Button line
    for (let r = 7; r <= 23; r += 3) {
      g[r][13] = 1.0;
      g[r][14] = 0.3;
    }
    samples.push({
      id: `sample-6-${v}`,
      label: 6,
      name: `Camisa #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 7: Zapatilla (Sneaker)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Thick curved athletic sole
    drawRect(g, 21, 3, 24, 24, 0.95);
    // Upper shoe profile
    drawRect(g, 16, 4, 21, 14, 0.85);
    // Toe curve taper
    drawRect(g, 18, 14, 21, 23, 0.85);
    drawRect(g, 19, 21, 21, 25, 0.7);
    // Tongue / laces
    drawRect(g, 12, 10, 16, 14, 0.75);
    g[13][11] = 0.95; g[14][12] = 0.95; g[15][13] = 0.95;
    samples.push({
      id: `sample-7-${v}`,
      label: 7,
      name: `Zapatilla #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 8: Bolso (Bag)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // Curved handle at top
    for (let c = 10; c <= 17; c++) {
      g[6][c] = 0.9;
      g[7][c] = 0.85;
    }
    drawRect(g, 7, 10, 12, 11, 0.85);
    drawRect(g, 7, 16, 12, 17, 0.85);
    // Trapeze/Rectangular main bag body
    drawRect(g, 12, 7, 24, 20, 0.9);
    // Clasp or pocket detail
    drawRect(g, 15, 12, 17, 15, 0.3);
    samples.push({
      id: `sample-8-${v}`,
      label: 8,
      name: `Bolso #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  // 9: Botín (Ankle boot)
  for (let v = 0; v < 4; v++) {
    const g = createEmpty28();
    // High vertical shaft around ankle
    drawRect(g, 7, 6, 18, 13, 0.9);
    // Foot part going right
    drawRect(g, 16, 6, 22, 23, 0.9);
    // Elevated heel block
    drawRect(g, 22, 6, 25, 10, 0.95);
    // Pointed or rounded toe sole
    drawRect(g, 21, 15, 23, 24, 0.85);
    samples.push({
      id: `sample-9-${v}`,
      label: 9,
      name: `Botín #${v + 1}`,
      pixels: flattenAndAddNoise(g)
    });
  }

  return samples;
}

export const PRESET_FASHION_SAMPLES = generateFashionSamples();
