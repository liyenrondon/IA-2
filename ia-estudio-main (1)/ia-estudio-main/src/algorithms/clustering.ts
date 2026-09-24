import { Point, ClusteredPoint, Centroid, KMeansParams, DBSCANParams } from '../types';

export const CLUSTER_COLORS = [
  '#38bdf8', // Vibrant Sky
  '#f43f5e', // Coral Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#8b5cf6', // Indigo
  '#84cc16', // Lime
  '#fb923c', // Orange
];

export const NOISE_COLOR = '#64748b'; // Slate gray for noise in DBSCAN

export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ==========================================
// K-MEANS ALGORITHM
// ==========================================

export function initCentroids(
  points: Point[],
  k: number,
  method: 'kmeans++' | 'random' | 'manual'
): Centroid[] {
  if (points.length === 0) return [];
  const centroids: Centroid[] = [];

  if (method === 'random') {
    const shuffled = [...points].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(k, shuffled.length); i++) {
      centroids.push({
        id: i,
        x: shuffled[i].x,
        y: shuffled[i].y,
        color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      });
    }
  } else {
    // KMeans++ initialization
    const firstIdx = Math.floor(Math.random() * points.length);
    centroids.push({
      id: 0,
      x: points[firstIdx].x,
      y: points[firstIdx].y,
      color: CLUSTER_COLORS[0],
    });

    while (centroids.length < k && centroids.length < points.length) {
      const distancesSq: number[] = [];
      let totalDistSq = 0;

      for (const pt of points) {
        let minDist = Infinity;
        for (const c of centroids) {
          const d = distance(pt, c);
          if (d < minDist) minDist = d;
        }
        const dSq = minDist * minDist;
        distancesSq.push(dSq);
        totalDistSq += dSq;
      }

      // Pick next centroid with probability proportional to dSq
      let randVal = Math.random() * totalDistSq;
      let nextIdx = 0;
      for (let i = 0; i < distancesSq.length; i++) {
        randVal -= distancesSq[i];
        if (randVal <= 0) {
          nextIdx = i;
          break;
        }
      }

      const nextPt = points[nextIdx];
      const newId = centroids.length;
      centroids.push({
        id: newId,
        x: nextPt.x,
        y: nextPt.y,
        color: CLUSTER_COLORS[newId % CLUSTER_COLORS.length],
      });
    }
  }

  return centroids;
}

export function kMeansAssign(
  points: Point[],
  centroids: Centroid[]
): { clusteredPoints: ClusteredPoint[]; inertia: number } {
  let inertia = 0;
  const clusteredPoints: ClusteredPoint[] = points.map((pt) => {
    if (centroids.length === 0) {
      return { ...pt, cluster: -1 };
    }

    let minD = Infinity;
    let closestId = 0;

    centroids.forEach((c) => {
      const d = distance(pt, c);
      if (d < minD) {
        minD = d;
        closestId = c.id;
      }
    });

    inertia += minD * minD;
    return {
      ...pt,
      cluster: closestId,
      distanceToCentroid: minD,
    };
  });

  return { clusteredPoints, inertia };
}

export function kMeansUpdateCentroids(
  clusteredPoints: ClusteredPoint[],
  currentCentroids: Centroid[]
): { updatedCentroids: Centroid[]; hasChanged: boolean; maxShift: number } {
  let hasChanged = false;
  let maxShift = 0;

  const updatedCentroids: Centroid[] = currentCentroids.map((c) => {
    const pts = clusteredPoints.filter((p) => p.cluster === c.id);
    if (pts.length === 0) {
      // Empty cluster keeps old position
      return { ...c, prevX: c.x, prevY: c.y };
    }

    const sumX = pts.reduce((acc, p) => acc + p.x, 0);
    const sumY = pts.reduce((acc, p) => acc + p.y, 0);
    const newX = sumX / pts.length;
    const newY = sumY / pts.length;

    const shift = distance({ x: newX, y: newY }, c);
    if (shift > maxShift) maxShift = shift;
    if (shift > 0.3) hasChanged = true;

    return {
      ...c,
      prevX: c.x,
      prevY: c.y,
      x: newX,
      y: newY,
    };
  });

  return { updatedCentroids, hasChanged, maxShift };
}

export function runFullKMeans(
  points: Point[],
  params: KMeansParams,
  existingCentroids?: Centroid[]
): {
  clusteredPoints: ClusteredPoint[];
  centroids: Centroid[];
  inertia: number;
  iterations: number;
} {
  let centroids =
    existingCentroids && existingCentroids.length === params.k
      ? existingCentroids
      : initCentroids(points, params.k, params.initMethod);

  let clusteredPoints: ClusteredPoint[] = [];
  let inertia = 0;
  let iterations = 0;

  for (let iter = 0; iter < params.maxIter; iter++) {
    iterations++;
    const assignResult = kMeansAssign(points, centroids);
    clusteredPoints = assignResult.clusteredPoints;
    inertia = assignResult.inertia;

    const updateResult = kMeansUpdateCentroids(clusteredPoints, centroids);
    centroids = updateResult.updatedCentroids;

    if (!updateResult.hasChanged) break;
  }

  return { clusteredPoints, centroids, inertia, iterations };
}

export function calculateElbowCurve(
  points: Point[],
  maxK = 8
): { k: number; inertia: number }[] {
  const result: { k: number; inertia: number }[] = [];
  for (let k = 1; k <= maxK; k++) {
    const res = runFullKMeans(points, { k, initMethod: 'kmeans++', maxIter: 25 });
    result.push({ k, inertia: Math.round(res.inertia) });
  }
  return result;
}

// ==========================================
// DBSCAN ALGORITHM
// ==========================================

export interface DBSCANResult {
  clusteredPoints: ClusteredPoint[];
  clusterCount: number;
  coreCount: number;
  borderCount: number;
  noiseCount: number;
}

export function runFullDBSCAN(points: Point[], params: DBSCANParams): DBSCANResult {
  const n = points.length;
  const labels: number[] = new Array(n).fill(-2); // -2 = unvisited, -1 = noise, >=0 = cluster
  const isCore: boolean[] = new Array(n).fill(false);
  const isBorder: boolean[] = new Array(n).fill(false);

  // 1. Precalculate neighbor sets for each point
  const neighbors: number[][] = [];
  for (let i = 0; i < n; i++) {
    const nbrs: number[] = [];
    for (let j = 0; j < n; j++) {
      if (distance(points[i], points[j]) <= params.eps) {
        nbrs.push(j);
      }
    }
    neighbors.push(nbrs);
    if (nbrs.length >= params.minPts) {
      isCore[i] = true;
    }
  }

  // 2. Expand clusters
  let currentCluster = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue; // already visited

    if (!isCore[i]) {
      labels[i] = -1; // tentatively mark as noise
      continue;
    }

    // Found a new core point: expand cluster
    labels[i] = currentCluster;
    const queue: number[] = [...neighbors[i]];

    let head = 0;
    while (head < queue.length) {
      const neighborIdx = queue[head++];

      if (labels[neighborIdx] === -1) {
        // Was noise, now border point of this cluster
        labels[neighborIdx] = currentCluster;
        isBorder[neighborIdx] = true;
      }

      if (labels[neighborIdx] !== -2) continue; // already assigned to a cluster

      labels[neighborIdx] = currentCluster;

      if (isCore[neighborIdx]) {
        // Core point: push its neighbors to expansion queue
        for (const nextNeighbor of neighbors[neighborIdx]) {
          if (!queue.includes(nextNeighbor)) {
            queue.push(nextNeighbor);
          }
        }
      } else {
        // Has a core point neighbor but not enough neighbors itself -> Border
        isBorder[neighborIdx] = true;
      }
    }

    currentCluster++;
  }

  // 3. Construct clustered points
  let coreCount = 0;
  let borderCount = 0;
  let noiseCount = 0;

  const clusteredPoints: ClusteredPoint[] = points.map((pt, idx) => {
    const cluster = labels[idx];
    const core = isCore[idx];
    const border = isBorder[idx] && cluster >= 0;
    const noise = cluster === -1;

    if (core) coreCount++;
    if (border) borderCount++;
    if (noise) noiseCount++;

    return {
      ...pt,
      cluster,
      isCore: core,
      isBorder: border,
      isNoise: noise,
    };
  });

  return {
    clusteredPoints,
    clusterCount: currentCluster,
    coreCount,
    borderCount,
    noiseCount,
  };
}
