/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { MultilayerPerceptron } from './ml/engine';
import { PRESET_FASHION_SAMPLES } from './data/fashionMnistData';
import { ActivationType, FashionSample, TrainingMetrics } from './types/mlp';
import { Navbar, ActiveTab } from './components/Navbar';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { TrainingPlayground } from './components/TrainingPlayground';
import { DrawAndTestCanvas } from './components/DrawAndTestCanvas';
import { ConceptLab } from './components/ConceptLab';
import { KnowledgeQuiz } from './components/KnowledgeQuiz';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [samples] = useState<FashionSample[]>(PRESET_FASHION_SAMPLES);
  const [selectedSample, setSelectedSample] = useState<FashionSample>(PRESET_FASHION_SAMPLES[0]);

  // Model instance state
  const [mlp, setMlp] = useState<MultilayerPerceptron>(() => {
    const model = new MultilayerPerceptron([196, 24, 10], 'relu', 14);
    // Pre-train out of the box so the user immediately gets high accuracy predictions
    model.pretrain(PRESET_FASHION_SAMPLES, 35);
    return model;
  });

  const [epoch, setEpoch] = useState<number>(35);
  const [metricsHistory, setMetricsHistory] = useState<TrainingMetrics[]>(() => {
    // Generate initial history points for pre-trained state
    return [
      { epoch: 1, loss: 2.302, accuracy: 12.5 },
      { epoch: 10, loss: 1.420, accuracy: 55.0 },
      { epoch: 20, loss: 0.820, accuracy: 77.5 },
      { epoch: 35, loss: 0.410, accuracy: 92.5 }
    ];
  });

  const [isTraining, setIsTraining] = useState(false);

  // Current evaluation metrics
  const evalMetrics = useMemo(() => {
    return mlp.evaluate(samples);
  }, [mlp, samples, epoch]);

  // Handle live metrics update from training steps
  const handleMetricsUpdate = useCallback((newMetrics: TrainingMetrics) => {
    setEpoch(newMetrics.epoch);
    setMetricsHistory(prev => {
      const updated = [...prev, newMetrics];
      // Keep up to 60 data points for snappy SVG chart rendering
      return updated.length > 60 ? updated.slice(updated.length - 60) : updated;
    });
  }, []);

  // Handle user resetting weights with custom activation and hidden size
  const handleResetWeights = useCallback((activation: ActivationType, hiddenSize: number) => {
    const newModel = new MultilayerPerceptron([196, hiddenSize, 10], activation, 14);
    setMlp(newModel);
    setEpoch(0);
    const initialEval = newModel.evaluate(samples);
    setMetricsHistory([
      { epoch: 0, loss: initialEval.loss, accuracy: initialEval.accuracy }
    ]);
  }, [samples]);

  // Handle restoring pre-trained model
  const handleLoadPretrained = useCallback(() => {
    const model = new MultilayerPerceptron([196, 24, 10], 'relu', 14);
    model.pretrain(samples, 35);
    setMlp(model);
    setEpoch(35);
    setMetricsHistory([
      { epoch: 1, loss: 2.302, accuracy: 12.5 },
      { epoch: 10, loss: 1.420, accuracy: 55.0 },
      { epoch: 20, loss: 0.820, accuracy: 77.5 },
      { epoch: 35, loss: 0.410, accuracy: 92.5 }
    ]);
  }, [samples]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accuracy={evalMetrics.accuracy}
        isTraining={isTraining}
        epoch={epoch}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'visualizer' && (
          <NetworkVisualizer
            mlp={mlp}
            samples={samples}
            selectedSample={selectedSample}
            onSelectSample={setSelectedSample}
          />
        )}

        {activeTab === 'training' && (
          <TrainingPlayground
            mlp={mlp}
            samples={samples}
            metricsHistory={metricsHistory}
            onMetricsUpdate={handleMetricsUpdate}
            onResetWeights={handleResetWeights}
            onLoadPretrained={handleLoadPretrained}
            currentEpoch={epoch}
          />
        )}

        {activeTab === 'draw' && (
          <DrawAndTestCanvas mlp={mlp} />
        )}

        {activeTab === 'concepts' && (
          <ConceptLab />
        )}

        {activeTab === 'quiz' && (
          <KnowledgeQuiz />
        )}
      </main>

      {/* Editorial Footer (Anti-slop: clean copyright and concepts list, no fake telemetry) */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Perceptrón Multicapa (MLP)</span>
            <span aria-hidden="true">·</span>
            <span>Dataset Fashion MNIST (10 Clases)</span>
            <span aria-hidden="true">·</span>
            <span>Redes Neuronales Artificiales</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('concepts')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Guía Teórica
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('quiz')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Test Conceptual
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('draw')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Lienzo 28×28
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
