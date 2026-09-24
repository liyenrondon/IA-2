export interface Point {
  id: number;
  x: number;
  y: number;
  originalCluster?: number;
}

export interface ClusteredPoint extends Point {
  cluster: number; // -1 for noise, >= 0 for cluster id
  isCore?: boolean;
  isBorder?: boolean;
  isNoise?: boolean;
  distanceToCentroid?: number;
}

export interface Centroid {
  id: number;
  x: number;
  y: number;
  color: string;
  prevX?: number;
  prevY?: number;
}

export type DatasetType =
  | 'moons'
  | 'circles'
  | 'blobs'
  | 'varied_density'
  | 'anisotropic'
  | 'outliers'
  | 'smiley'
  | 'custom';

export type AlgorithmType = 'kmeans' | 'dbscan' | 'compare';

export interface KMeansParams {
  k: number;
  initMethod: 'kmeans++' | 'random' | 'manual';
  maxIter: number;
}

export interface DBSCANParams {
  eps: number; // neighborhood radius in canvas units
  minPts: number; // minimum points to be a core point
}

export interface KMeansStepState {
  step: number;
  phase: 'init' | 'assign' | 'update' | 'converged';
  centroids: Centroid[];
  points: ClusteredPoint[];
  inertia: number;
  hasChanged: boolean;
}

export interface DBSCANStepState {
  step: number;
  phase: 'idle' | 'finding_cores' | 'expanding' | 'done';
  points: ClusteredPoint[];
  currentPointIndex: number | null;
  currentClusterId: number;
  unvisitedIds: Set<number>;
  coreCount: number;
  borderCount: number;
  noiseCount: number;
  clusterCount: number;
}

export interface Challenge {
  id: string;
  title: string;
  level: 'Fácil' | 'Intermedio' | 'Avanzado';
  description: string;
  dataset: DatasetType;
  algorithm: 'kmeans' | 'dbscan';
  initialParams: {
    kmeans?: KMeansParams;
    dbscan?: DBSCANParams;
  };
  goalDescription: string;
  hint: string;
  validate: (
    algorithm: 'kmeans' | 'dbscan',
    kParams: KMeansParams,
    dParams: DBSCANParams,
    points: ClusteredPoint[],
    centroids?: Centroid[]
  ) => { passed: boolean; message: string; progress: number };
}
