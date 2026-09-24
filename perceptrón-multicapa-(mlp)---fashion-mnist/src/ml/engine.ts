import {
  ActivationType,
  FashionClassId,
  FashionSample,
  ForwardResult,
  LayerState,
  TrainingMetrics
} from '../types/mlp';

// Math utilities
export function relu(x: number): number {
  return Math.max(0, x);
}

export function dRelu(x: number): number {
  return x > 0 ? 1 : 0;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-45, Math.min(45, x))));
}

export function dSigmoid(a: number): number {
  return a * (1 - a);
}

export function tanh(x: number): number {
  return Math.tanh(x);
}

export function dTanh(a: number): number {
  return 1 - a * a;
}

export function leakyRelu(x: number): number {
  return x > 0 ? x : 0.05 * x;
}

export function dLeakyRelu(x: number): number {
  return x > 0 ? 1 : 0.05;
}

export function applyActivation(x: number, type: ActivationType): number {
  switch (type) {
    case 'relu': return relu(x);
    case 'sigmoid': return sigmoid(x);
    case 'tanh': return tanh(x);
    case 'leaky_relu': return leakyRelu(x);
  }
}

export function applyActivationDerivative(z: number, a: number, type: ActivationType): number {
  switch (type) {
    case 'relu': return dRelu(z);
    case 'sigmoid': return dSigmoid(a);
    case 'tanh': return dTanh(a);
    case 'leaky_relu': return dLeakyRelu(z);
  }
}

export function softmax(z: number[]): number[] {
  const maxZ = Math.max(...z);
  const exps = z.map(val => Math.exp(val - maxZ));
  const sumExps = exps.reduce((acc, val) => acc + val, 0) || 1e-9;
  return exps.map(val => val / sumExps);
}

export function crossEntropyLoss(probs: number[], targetClass: FashionClassId): number {
  const p = Math.max(1e-12, Math.min(1.0, probs[targetClass]));
  return -Math.log(p);
}

// Downsample 28x28 (784) to 14x14 (196) for ultra-fast responsive interactive computations
export function downsample28to14(pixels784: number[]): number[] {
  const result: number[] = new Array(196);
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      const origR = r * 2;
      const origC = c * 2;
      const p1 = pixels784[origR * 28 + origC];
      const p2 = pixels784[origR * 28 + origC + 1];
      const p3 = pixels784[(origR + 1) * 28 + origC];
      const p4 = pixels784[(origR + 1) * 28 + origC + 1];
      result[r * 14 + c] = (p1 + p2 + p3 + p4) / 4;
    }
  }
  return result;
}

export interface LayerWeights {
  weights: number[][]; // [outputNodes][inputNodes]
  biases: number[];     // [outputNodes]
  vW?: number[][];     // velocity for momentum
  vB?: number[];
}

export class MultilayerPerceptron {
  public layerSizes: number[]; // [input, hidden1, (hidden2), output]
  public layers: LayerWeights[];
  public activation: ActivationType;
  public inputResolution: 14 | 28;

  constructor(
    layerSizes: number[] = [196, 24, 10],
    activation: ActivationType = 'relu',
    inputResolution: 14 | 28 = 14
  ) {
    this.layerSizes = [...layerSizes];
    this.activation = activation;
    this.inputResolution = inputResolution;
    this.layers = [];
    this.initWeights();
  }

  public initWeights(): void {
    this.layers = [];
    for (let l = 0; l < this.layerSizes.length - 1; l++) {
      const nIn = this.layerSizes[l];
      const nOut = this.layerSizes[l + 1];

      // He initialization for ReLU, Xavier for Sigmoid/Tanh
      const std = this.activation === 'relu' || this.activation === 'leaky_relu'
        ? Math.sqrt(2 / nIn)
        : Math.sqrt(2 / (nIn + nOut));

      const weights: number[][] = [];
      const vW: number[][] = [];
      for (let j = 0; j < nOut; j++) {
        const row: number[] = [];
        const vRow: number[] = [];
        for (let i = 0; i < nIn; i++) {
          // Box-Muller normal distribution
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.random();
          const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          row.push(randStdNormal * std);
          vRow.push(0);
        }
        weights.push(row);
        vW.push(vRow);
      }

      const biases: number[] = new Array(nOut).fill(0.01);
      const vB: number[] = new Array(nOut).fill(0);

      this.layers.push({ weights, biases, vW, vB });
    }
  }

  // Pre-condition inputs: downsample if model expects 196
  public prepareInput(pixels: number[]): number[] {
    if (this.inputResolution === 14 && pixels.length === 784) {
      return downsample28to14(pixels);
    }
    return pixels;
  }

  public forward(inputRaw: number[], targetLabel?: FashionClassId): ForwardResult {
    const x = this.prepareInput(inputRaw);
    const layerStates: LayerState[] = [];

    let currentA = [...x];

    for (let l = 0; l < this.layers.length; l++) {
      const { weights, biases } = this.layers[l];
      const isOutputLayer = l === this.layers.length - 1;
      const nOut = weights.length;
      const nIn = currentA.length;

      const z: number[] = new Array(nOut);
      const a: number[] = new Array(nOut);

      for (let j = 0; j < nOut; j++) {
        let sum = biases[j];
        const wRow = weights[j];
        for (let i = 0; i < nIn; i++) {
          sum += wRow[i] * currentA[i];
        }
        z[j] = sum;
        if (isOutputLayer) {
          // For output layer, z will be processed by softmax later
          a[j] = sum;
        } else {
          a[j] = applyActivation(sum, this.activation);
        }
      }

      if (isOutputLayer) {
        const probs = softmax(z);
        for (let j = 0; j < nOut; j++) {
          a[j] = probs[j];
        }
      }

      layerStates.push({ z, a });
      currentA = a;
    }

    const outputProbabilities = layerStates[layerStates.length - 1].a;
    let maxIdx: FashionClassId = 0;
    let maxVal = -1;
    for (let i = 0; i < outputProbabilities.length; i++) {
      if (outputProbabilities[i] > maxVal) {
        maxVal = outputProbabilities[i];
        maxIdx = i as FashionClassId;
      }
    }

    const loss = targetLabel !== undefined ? crossEntropyLoss(outputProbabilities, targetLabel) : undefined;

    return {
      layers: layerStates,
      outputProbabilities,
      predictedClass: maxIdx,
      loss
    };
  }

  // Train a batch using SGD with momentum
  public trainBatch(
    samples: FashionSample[],
    learningRate = 0.05,
    momentum = 0.85
  ): { avgLoss: number; accuracy: number } {
    if (samples.length === 0) return { avgLoss: 0, accuracy: 0 };

    let totalLoss = 0;
    let correctCount = 0;

    // Accumulators for gradients
    const gradW: number[][][] = this.layers.map(layer =>
      layer.weights.map(row => new Array(row.length).fill(0))
    );
    const gradB: number[][] = this.layers.map(layer =>
      new Array(layer.biases.length).fill(0)
    );

    const batchSize = samples.length;

    for (const sample of samples) {
      const x = this.prepareInput(sample.pixels);
      const fwd = this.forward(sample.pixels, sample.label);

      totalLoss += fwd.loss || 0;
      if (fwd.predictedClass === sample.label) {
        correctCount++;
      }

      // Backpropagation
      const numLayers = this.layers.length;
      // Array of activations including input layer at index -1
      const activations: number[][] = [x, ...fwd.layers.map(l => l.a)];
      const zs: number[][] = fwd.layers.map(l => l.z);

      // Output error delta: softmax + cross entropy simplifies to (prob - y_onehot)
      const outputLayerIdx = numLayers - 1;
      const probs = fwd.outputProbabilities;
      const deltaOut: number[] = new Array(10);
      for (let j = 0; j < 10; j++) {
        const y = sample.label === j ? 1 : 0;
        deltaOut[j] = probs[j] - y;
      }

      let currentDelta = deltaOut;

      for (let l = outputLayerIdx; l >= 0; l--) {
        const prevA = activations[l]; // activation of previous layer
        const nOut = currentDelta.length;
        const nIn = prevA.length;

        // Accumulate gradients
        for (let j = 0; j < nOut; j++) {
          const d_j = currentDelta[j];
          gradB[l][j] += d_j;
          const gRow = gradW[l][j];
          for (let i = 0; i < nIn; i++) {
            gRow[i] += d_j * prevA[i];
          }
        }

        // If not the first layer, compute delta for previous hidden layer
        if (l > 0) {
          const prevWeights = this.layers[l].weights; // [nOut][nIn]
          const prevZ = zs[l - 1];
          const prevAct = activations[l]; // a of layer l-1
          const nextDelta: number[] = new Array(nIn);

          for (let i = 0; i < nIn; i++) {
            let errorSum = 0;
            for (let j = 0; j < nOut; j++) {
              errorSum += prevWeights[j][i] * currentDelta[j];
            }
            const deriv = applyActivationDerivative(prevZ[i], prevAct[i], this.activation);
            nextDelta[i] = errorSum * deriv;
          }
          currentDelta = nextDelta;
        }
      }
    }

    // Apply parameter updates with momentum
    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      const gW = gradW[l];
      const gB = gradB[l];
      const vW = layer.vW!;
      const vB = layer.vB!;

      for (let j = 0; j < layer.biases.length; j++) {
        // Biases
        const db = gB[j] / batchSize;
        vB[j] = momentum * vB[j] + learningRate * db;
        layer.biases[j] -= vB[j];

        // Weights
        const wRow = layer.weights[j];
        const gwRow = gW[j];
        const vwRow = vW[j];
        for (let i = 0; i < wRow.length; i++) {
          const dw = gwRow[i] / batchSize;
          vwRow[i] = momentum * vwRow[i] + learningRate * dw;
          wRow[i] -= vwRow[i];
        }
      }
    }

    return {
      avgLoss: totalLoss / batchSize,
      accuracy: (correctCount / batchSize) * 100
    };
  }

  // Pre-train the network on samples to provide an accurate out-of-the-box model
  public pretrain(samples: FashionSample[], epochs = 35): void {
    const lr = 0.08;
    for (let e = 0; e < epochs; e++) {
      // Shuffle
      const shuffled = [...samples].sort(() => Math.random() - 0.5);
      this.trainBatch(shuffled, lr * Math.pow(0.97, e), 0.85);
    }
  }

  public evaluate(samples: FashionSample[]): { loss: number; accuracy: number } {
    if (samples.length === 0) return { loss: 0, accuracy: 0 };
    let totalLoss = 0;
    let correct = 0;

    for (const sample of samples) {
      const res = this.forward(sample.pixels, sample.label);
      totalLoss += res.loss || 0;
      if (res.predictedClass === sample.label) {
        correct++;
      }
    }

    return {
      loss: totalLoss / samples.length,
      accuracy: (correct / samples.length) * 100
    };
  }

  // Feature map: reconstruct what a hidden neuron "looks for" by its input weights
  public getNeuronFeatureMap(layerIndex: number, neuronIndex: number): number[] {
    if (layerIndex !== 0 || !this.layers[0]) return [];
    const weightsRow = this.layers[0].weights[neuronIndex];
    if (!weightsRow) return [];

    // Normalize weights to 0..1 for visualization
    let minW = Infinity;
    let maxW = -Infinity;
    for (const w of weightsRow) {
      if (w < minW) minW = w;
      if (w > maxW) maxW = w;
    }
    const range = maxW - minW || 1e-6;
    return weightsRow.map(w => (w - minW) / range);
  }
}
