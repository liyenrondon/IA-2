export type FashionClassId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface FashionClassInfo {
  id: FashionClassId;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  features: string[];
}

export interface FashionSample {
  id: string;
  label: FashionClassId;
  pixels: number[]; // 784 numbers (0 to 1) for 28x28, or downscaled 196 for 14x14
  name?: string;
}

export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu';

export interface MLPConfig {
  inputSize: number; // e.g., 784 (or downsampled 196 for fast training)
  hiddenSizes: number[]; // e.g. [32] or [16, 16]
  outputSize: number; // 10
  activation: ActivationType;
  learningRate: number;
  batchSize: number;
}

export interface LayerState {
  z: number[]; // pre-activation (weighted sum + bias)
  a: number[]; // post-activation
}

export interface ForwardResult {
  layers: LayerState[]; // index 0 is hidden1, index 1 is hidden2 (if any), last is output
  outputProbabilities: number[];
  predictedClass: FashionClassId;
  loss?: number;
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  validationLoss?: number;
  validationAccuracy?: number;
}

export interface ConfusionMatrixData {
  matrix: number[][]; // 10x10
  classes: string[];
}
