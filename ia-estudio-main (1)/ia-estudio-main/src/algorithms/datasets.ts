import { Point, DatasetType } from '../types';

export function generateDataset(
  type: DatasetType,
  width = 540,
  height = 400,
  pointCount = 180
): Point[] {
  const points: Point[] = [];
  const cx = width / 2;
  const cy = height / 2;
  let idCounter = 0;

  // Gaussian random helper (Box-Muller)
  const randn = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  switch (type) {
    case 'moons': {
      const n = Math.floor(pointCount / 2);
      const r = Math.min(width, height) * 0.32;
      // Upper moon
      for (let i = 0; i < n; i++) {
        const theta = Math.PI * (i / (n - 1));
        const noiseX = randn() * 10;
        const noiseY = randn() * 10;
        const x = cx - r * 0.4 + r * Math.cos(theta) + noiseX;
        const y = cy + r * 0.2 - r * Math.sin(theta) + noiseY;
        points.push({ id: idCounter++, x, y, originalCluster: 0 });
      }
      // Lower moon
      for (let i = 0; i < n; i++) {
        const theta = Math.PI * (i / (n - 1));
        const noiseX = randn() * 10;
        const noiseY = randn() * 10;
        const x = cx + r * 0.4 - r * Math.cos(theta) + noiseX;
        const y = cy - r * 0.2 + r * Math.sin(theta) + noiseY;
        points.push({ id: idCounter++, x, y, originalCluster: 1 });
      }
      break;
    }

    case 'circles': {
      const nInner = Math.floor(pointCount * 0.38);
      const nOuter = pointCount - nInner;
      const rInner = Math.min(width, height) * 0.16;
      const rOuter = Math.min(width, height) * 0.36;

      // Inner circle
      for (let i = 0; i < nInner; i++) {
        const theta = (2 * Math.PI * i) / nInner;
        const currentR = rInner + randn() * 8;
        points.push({
          id: idCounter++,
          x: cx + currentR * Math.cos(theta),
          y: cy + currentR * Math.sin(theta),
          originalCluster: 0,
        });
      }

      // Outer circle
      for (let i = 0; i < nOuter; i++) {
        const theta = (2 * Math.PI * i) / nOuter;
        const currentR = rOuter + randn() * 11;
        points.push({
          id: idCounter++,
          x: cx + currentR * Math.cos(theta),
          y: cy + currentR * Math.sin(theta),
          originalCluster: 1,
        });
      }
      break;
    }

    case 'blobs': {
      const centers = [
        { x: cx - 110, y: cy - 70, std: 24, label: 0 },
        { x: cx + 110, y: cy - 60, std: 24, label: 1 },
        { x: cx, y: cy + 90, std: 26, label: 2 },
      ];
      const ptsPerCluster = Math.floor(pointCount / centers.length);
      centers.forEach((c) => {
        for (let i = 0; i < ptsPerCluster; i++) {
          points.push({
            id: idCounter++,
            x: Math.max(30, Math.min(width - 30, c.x + randn() * c.std)),
            y: Math.max(30, Math.min(height - 30, c.y + randn() * c.std)),
            originalCluster: c.label,
          });
        }
      });
      break;
    }

    case 'varied_density': {
      // One very dense small cluster
      const nDense = Math.floor(pointCount * 0.55);
      const denseCenter = { x: cx - 100, y: cy };
      for (let i = 0; i < nDense; i++) {
        points.push({
          id: idCounter++,
          x: denseCenter.x + randn() * 18,
          y: denseCenter.y + randn() * 18,
          originalCluster: 0,
        });
      }

      // One large sparse cluster
      const nSparse = pointCount - nDense;
      const sparseCenter = { x: cx + 100, y: cy };
      for (let i = 0; i < nSparse; i++) {
        points.push({
          id: idCounter++,
          x: sparseCenter.x + randn() * 55,
          y: sparseCenter.y + randn() * 55,
          originalCluster: 1,
        });
      }
      break;
    }

    case 'anisotropic': {
      // Elongated diagonal clusters
      const n = Math.floor(pointCount / 3);
      const offsets = [
        { ox: -120, oy: -70, angle: Math.PI / 4, length: 110, width: 20, label: 0 },
        { ox: 0, oy: 10, angle: -Math.PI / 6, length: 130, width: 22, label: 1 },
        { ox: 130, oy: 80, angle: Math.PI / 3, length: 100, width: 20, label: 2 },
      ];

      offsets.forEach((off) => {
        for (let i = 0; i < n; i++) {
          const along = (Math.random() - 0.5) * off.length;
          const perp = randn() * off.width;
          const rotX = along * Math.cos(off.angle) - perp * Math.sin(off.angle);
          const rotY = along * Math.sin(off.angle) + perp * Math.cos(off.angle);
          points.push({
            id: idCounter++,
            x: cx + off.ox + rotX,
            y: cy + off.oy + rotY,
            originalCluster: off.label,
          });
        }
      });
      break;
    }

    case 'outliers': {
      // 2 clusters + 25 sparse noise points
      const nCluster = Math.floor((pointCount - 25) / 2);
      const centers = [
        { x: cx - 90, y: cy - 50, std: 25, label: 0 },
        { x: cx + 90, y: cy + 40, std: 25, label: 1 },
      ];
      centers.forEach((c) => {
        for (let i = 0; i < nCluster; i++) {
          points.push({
            id: idCounter++,
            x: c.x + randn() * c.std,
            y: c.y + randn() * c.std,
            originalCluster: c.label,
          });
        }
      });
      // Outliers uniformly distributed
      for (let i = 0; i < 25; i++) {
        points.push({
          id: idCounter++,
          x: 40 + Math.random() * (width - 80),
          y: 40 + Math.random() * (height - 80),
          originalCluster: -1, // Noise
        });
      }
      break;
    }

    case 'smiley': {
      // Eyes
      const eyeL = { x: cx - 65, y: cy - 55 };
      const eyeR = { x: cx + 65, y: cy - 55 };
      for (let i = 0; i < 16; i++) {
        points.push({
          id: idCounter++,
          x: eyeL.x + randn() * 9,
          y: eyeL.y + randn() * 9,
          originalCluster: 0,
        });
        points.push({
          id: idCounter++,
          x: eyeR.x + randn() * 9,
          y: eyeR.y + randn() * 9,
          originalCluster: 1,
        });
      }
      // Smile curve
      const smileCount = Math.floor(pointCount * 0.45);
      const rSmile = 110;
      for (let i = 0; i < smileCount; i++) {
        const theta = Math.PI * 0.2 + (Math.PI * 0.6 * i) / (smileCount - 1);
        points.push({
          id: idCounter++,
          x: cx + rSmile * Math.cos(theta) + randn() * 7,
          y: cy - 20 + rSmile * Math.sin(theta) + randn() * 7,
          originalCluster: 2,
        });
      }
      // Outer head ring (partial or full)
      const headCount = pointCount - points.length;
      const rHead = 170;
      for (let i = 0; i < headCount; i++) {
        const theta = (2 * Math.PI * i) / headCount;
        points.push({
          id: idCounter++,
          x: cx + rHead * Math.cos(theta) + randn() * 8,
          y: cy + rHead * Math.sin(theta) + randn() * 8,
          originalCluster: 3,
        });
      }
      break;
    }

    case 'custom':
    default:
      // Return a basic initial set if empty
      return generateDataset('blobs', width, height, pointCount);
  }

  return points;
}
