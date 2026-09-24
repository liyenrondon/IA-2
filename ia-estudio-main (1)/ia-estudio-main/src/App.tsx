import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DatasetType,
  KMeansParams,
  DBSCANParams,
  Centroid,
  ClusteredPoint,
  Point,
  Challenge,
} from './types';
import { generateDataset } from './algorithms/datasets';
import {
  initCentroids,
  kMeansAssign,
  kMeansUpdateCentroids,
  runFullKMeans,
  calculateElbowCurve,
  runFullDBSCAN,
} from './algorithms/clustering';
import { CHALLENGES } from './algorithms/challenges';
import ClusterCanvas from './components/ClusterCanvas';
import DatasetSelector from './components/DatasetSelector';
import KMeansControls from './components/KMeansControls';
import DBSCANControls from './components/DBSCANControls';
import CompareView from './components/CompareView';
import ChallengesView from './components/ChallengesView';
import TheoryGuide from './components/TheoryGuide';
import ElbowModal from './components/ElbowModal';
import AITutorDrawer from './components/AITutorDrawer';
import {
  FlaskConical,
  Scale,
  Trophy,
  BookOpen,
  Bot,
  Layers,
  Sparkles,
  MousePointerClick,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'lab' | 'compare' | 'challenges' | 'theory'>('lab');
  const [labAlgorithm, setLabAlgorithm] = useState<'kmeans' | 'dbscan'>('kmeans');

  // Modals & Drawers
  const [showElbowModal, setShowElbowModal] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);

  // Dataset State
  const [datasetType, setDatasetType] = useState<DatasetType>('moons');
  const [pointCount, setPointCount] = useState<number>(180);
  const [rawPoints, setRawPoints] = useState<Point[]>(() =>
    generateDataset('moons', 540, 400, 180)
  );

  // K-Means Hyperparameters & State
  const [kParams, setKParams] = useState<KMeansParams>({
    k: 2,
    initMethod: 'kmeans++',
    maxIter: 30,
  });
  const [kCentroids, setKCentroids] = useState<Centroid[]>([]);
  const [kPoints, setKPoints] = useState<ClusteredPoint[]>([]);
  const [kInertia, setKInertia] = useState<number>(0);
  const [kStepPhase, setKStepPhase] = useState<'init' | 'assign' | 'update' | 'converged'>('init');
  const [kIteration, setKIteration] = useState<number>(0);
  const [isKPlaying, setIsKPlaying] = useState<boolean>(false);
  const [showVoronoi, setShowVoronoi] = useState<boolean>(true);
  const [showCentroidLines, setShowCentroidLines] = useState<boolean>(false);

  // DBSCAN Hyperparameters & State
  const [dParams, setDParams] = useState<DBSCANParams>({
    eps: 40,
    minPts: 5,
  });
  const [showEpsHover, setShowEpsHover] = useState<boolean>(true);

  // Active Challenge State
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(CHALLENGES[0]);

  // Regenerate dataset
  const handleRegenerateDataset = useCallback(() => {
    const pts = generateDataset(datasetType, 540, 400, pointCount);
    setRawPoints(pts);
  }, [datasetType, pointCount]);

  // Handle dataset type change
  const handleSelectDataset = (type: DatasetType) => {
    setDatasetType(type);
    if (type === 'custom') {
      setRawPoints([]);
    } else {
      const pts = generateDataset(type, 540, 400, pointCount);
      setRawPoints(pts);
    }
  };

  // Add custom point via canvas click
  const handleAddCustomPoint = (x: number, y: number) => {
    const newPt: Point = {
      id: rawPoints.length,
      x,
      y,
      originalCluster: 0,
    };
    setRawPoints((prev) => [...prev, newPt]);
  };

  const handleClearCustom = () => {
    setRawPoints([]);
  };

  // Synchronize K-Means initialization when points or K changes
  const resetKMeans = useCallback(
    (points: Point[], currentKParams: KMeansParams) => {
      setIsKPlaying(false);
      if (points.length === 0) {
        setKCentroids([]);
        setKPoints([]);
        setKInertia(0);
        setKIteration(0);
        setKStepPhase('init');
        return;
      }
      const initialCentroids = initCentroids(points, currentKParams.k, currentKParams.initMethod);
      setKCentroids(initialCentroids);
      const initialAssign = kMeansAssign(points, initialCentroids);
      setKPoints(initialAssign.clusteredPoints);
      setKInertia(initialAssign.inertia);
      setKIteration(0);
      setKStepPhase('init');
    },
    []
  );

  // Whenever rawPoints or K changes, re-init K-Means
  useEffect(() => {
    resetKMeans(rawPoints, kParams);
  }, [rawPoints, kParams.k, kParams.initMethod, resetKMeans]);

  // Step-by-step K-Means execution
  const handleNextKMeansStep = useCallback(() => {
    if (rawPoints.length === 0 || kCentroids.length === 0) return;

    if (kStepPhase === 'init' || kStepPhase === 'update') {
      // Step 1: Assign points to nearest centroid
      const assignRes = kMeansAssign(rawPoints, kCentroids);
      setKPoints(assignRes.clusteredPoints);
      setKInertia(assignRes.inertia);
      setKStepPhase('assign');
    } else if (kStepPhase === 'assign') {
      // Step 2: Update centroids to mean
      const updateRes = kMeansUpdateCentroids(kPoints, kCentroids);
      setKCentroids(updateRes.updatedCentroids);
      setKIteration((prev) => prev + 1);

      if (!updateRes.hasChanged) {
        setKStepPhase('converged');
        setIsKPlaying(false);
      } else {
        setKStepPhase('update');
      }
    }
  }, [rawPoints, kCentroids, kPoints, kStepPhase]);

  // K-Means Auto-Play Timer
  useEffect(() => {
    if (!isKPlaying) return;
    const interval = setInterval(() => {
      handleNextKMeansStep();
    }, 600);
    return () => clearInterval(interval);
  }, [isKPlaying, handleNextKMeansStep]);

  // K-Means Run to full convergence
  const handleRunKMeansToConvergence = () => {
    setIsKPlaying(false);
    const result = runFullKMeans(rawPoints, kParams, kCentroids);
    setKCentroids(result.centroids);
    setKPoints(result.clusteredPoints);
    setKInertia(result.inertia);
    setKIteration((prev) => prev + result.iterations);
    setKStepPhase('converged');
  };

  // DBSCAN Live Output (Reactive recalculation)
  const dbscanResult = useMemo(() => {
    if (rawPoints.length === 0) {
      return {
        clusteredPoints: [],
        clusterCount: 0,
        coreCount: 0,
        borderCount: 0,
        noiseCount: 0,
      };
    }
    return runFullDBSCAN(rawPoints, dParams);
  }, [rawPoints, dParams]);

  // Elbow Curve Data for modal
  const elbowData = useMemo(() => {
    if (rawPoints.length === 0) return [];
    return calculateElbowCurve(rawPoints, 8);
  }, [rawPoints]);

  // Challenge Preset handler
  const handleApplyChallengePreset = (
    newK?: KMeansParams,
    newD?: DBSCANParams
  ) => {
    if (newK) setKParams(newK);
    if (newD) setDParams(newD);
  };

  // When switching challenge, set its dataset
  const handleSelectChallenge = (ch: Challenge) => {
    setActiveChallenge(ch);
    setDatasetType(ch.dataset);
    const pts = generateDataset(ch.dataset, 540, 400, pointCount);
    setRawPoints(pts);
    if (ch.algorithm === 'kmeans') {
      setLabAlgorithm('kmeans');
    } else {
      setLabAlgorithm('dbscan');
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header id="main-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  ClusterLab
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  K-Means vs DBSCAN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Laboratorio lúdico de Aprendizaje No Supervisado e Hiperparámetros
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <nav id="nav-tabs" className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="tab-lab"
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'lab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Laboratorio</span>
            </button>

            <button
              id="tab-compare"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cara a Cara</span>
            </button>

            <button
              id="tab-challenges"
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'challenges'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Retos</span>
            </button>

            <button
              id="tab-theory"
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'theory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guía</span>
            </button>
          </nav>

          {/* AI Tutor Trigger Button */}
          <button
            id="btn-open-ai-tutor"
            onClick={() => setShowAITutor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-700/60 text-xs font-semibold text-indigo-200 shadow-sm transition-all"
          >
            <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="hidden sm:inline">Profesor IA</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Dataset Selector (Visible in Lab, Compare, and Challenges) */}
        {activeTab !== 'theory' && (
          <DatasetSelector
            currentDataset={datasetType}
            onSelectDataset={handleSelectDataset}
            onRegenerate={handleRegenerateDataset}
            onClearCustom={handleClearCustom}
            pointCount={pointCount}
            onPointCountChange={(newCount) => {
              setPointCount(newCount);
              setRawPoints(generateDataset(datasetType, 540, 400, newCount));
            }}
          />
        )}

        {/* TAB 1: LABORATORIO (SIMULADOR PRINCIPAL) */}
        {activeTab === 'lab' && (
          <div className="space-y-6">
            {/* Algorithm Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
                  Algoritmo en Vista:
                </span>
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    id="btn-select-kmeans"
                    onClick={() => setLabAlgorithm('kmeans')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                      labAlgorithm === 'kmeans'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>K-Means (Centroides)</span>
                  </button>

                  <button
                    id="btn-select-dbscan"
                    onClick={() => setLabAlgorithm('dbscan')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                      labAlgorithm === 'dbscan'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>DBSCAN (Densidad)</span>
                  </button>
                </div>
              </div>

              {datasetType === 'custom' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-lg">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>Modo dibujo activo: Haz clic en el lienzo</span>
                </div>
              )}
            </div>

            {/* Canvas & Controls Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Canvas */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <ClusterCanvas
                  id="canvas-main-lab"
                  points={labAlgorithm === 'kmeans' ? kPoints : dbscanResult.clusteredPoints}
                  centroids={labAlgorithm === 'kmeans' ? kCentroids : []}
                  algorithm={labAlgorithm}
                  eps={dParams.eps}
                  minPts={dParams.minPts}
                  onAddPoint={handleAddCustomPoint}
                  showVoronoi={showVoronoi}
                  showEpsHover={showEpsHover}
                  showCentroidLines={showCentroidLines}
                  interactiveDrawing={datasetType === 'custom'}
                />

                {/* Quick Hint Footer */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-amber-400 text-sm">💡</span>
                  <div>
                    {labAlgorithm === 'kmeans' ? (
                      <span>
                        <strong>Consejo K-Means:</strong> Observa cómo los centroides convergen
                        hacia el centro de gravedad. Para ver cómo cambia la inercia según K, abre el{' '}
                        <button
                          onClick={() => setShowElbowModal(true)}
                          className="text-sky-400 hover:underline font-semibold"
                        >
                          Método del Codo
                        </button>
                        .
                      </span>
                    ) : (
                      <span>
                        <strong>Consejo DBSCAN:</strong> Si ves demasiado ruido (✕), prueba
                        aumentar el radio ε o reducir MinPts. Si las formas se fusionan en un solo
                        cúmulo, reduce ε.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Algorithmic Controls */}
              <div className="lg:col-span-5">
                {labAlgorithm === 'kmeans' ? (
                  <KMeansControls
                    params={kParams}
                    onParamsChange={setKParams}
                    centroids={kCentroids}
                    stepPhase={kStepPhase}
                    isConverged={kStepPhase === 'converged'}
                    iterationCount={kIteration}
                    inertia={kInertia}
                    isPlaying={isKPlaying}
                    onPlayPause={() => setIsKPlaying(!isKPlaying)}
                    onNextStep={handleNextKMeansStep}
                    onRunToConvergence={handleRunKMeansToConvergence}
                    onResetCentroids={() => resetKMeans(rawPoints, kParams)}
                    showVoronoi={showVoronoi}
                    onToggleVoronoi={() => setShowVoronoi(!showVoronoi)}
                    showLines={showCentroidLines}
                    onToggleLines={() => setShowCentroidLines(!showCentroidLines)}
                    onOpenElbowModal={() => setShowElbowModal(true)}
                  />
                ) : (
                  <DBSCANControls
                    params={dParams}
                    onParamsChange={setDParams}
                    clusterCount={dbscanResult.clusterCount}
                    coreCount={dbscanResult.coreCount}
                    borderCount={dbscanResult.borderCount}
                    noiseCount={dbscanResult.noiseCount}
                    totalPoints={rawPoints.length}
                    showEpsHover={showEpsHover}
                    onToggleEpsHover={() => setShowEpsHover(!showEpsHover)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARA A CARA (COMPARATIVA LADO A LADO) */}
        {activeTab === 'compare' && (
          <CompareView
            kPoints={kPoints}
            kCentroids={kCentroids}
            dPoints={dbscanResult.clusteredPoints}
            kParams={kParams}
            onKParamsChange={setKParams}
            dParams={dParams}
            onDParamsChange={setDParams}
            datasetType={datasetType}
            dClusterCount={dbscanResult.clusterCount}
            dNoiseCount={dbscanResult.noiseCount}
            kInertia={kInertia}
          />
        )}

        {/* TAB 3: RETOS LÚDICOS (GAMIFIED MISSIONS) */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <ChallengesView
              currentChallenge={activeChallenge}
              onSelectChallenge={handleSelectChallenge}
              kParams={kParams}
              dParams={dParams}
              currentPoints={
                activeChallenge.algorithm === 'kmeans'
                  ? kPoints
                  : dbscanResult.clusteredPoints
              }
              currentCentroids={activeChallenge.algorithm === 'kmeans' ? kCentroids : []}
              onApplyPresetParams={handleApplyChallengePreset}
            />

            {/* Canvas & Controls for the active challenge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ClusterCanvas
                  id="canvas-challenge"
                  points={
                    activeChallenge.algorithm === 'kmeans'
                      ? kPoints
                      : dbscanResult.clusteredPoints
                  }
                  centroids={activeChallenge.algorithm === 'kmeans' ? kCentroids : []}
                  algorithm={activeChallenge.algorithm}
                  eps={dParams.eps}
                  minPts={dParams.minPts}
                  showVoronoi={showVoronoi}
                  showEpsHover={showEpsHover}
                />
              </div>

              <div className="lg:col-span-5">
                {activeChallenge.algorithm === 'kmeans' ? (
                  <KMeansControls
                    params={kParams}
                    onParamsChange={setKParams}
                    centroids={kCentroids}
                    stepPhase={kStepPhase}
                    isConverged={kStepPhase === 'converged'}
                    iterationCount={kIteration}
                    inertia={kInertia}
                    isPlaying={isKPlaying}
                    onPlayPause={() => setIsKPlaying(!isKPlaying)}
                    onNextStep={handleNextKMeansStep}
                    onRunToConvergence={handleRunKMeansToConvergence}
                    onResetCentroids={() => resetKMeans(rawPoints, kParams)}
                    showVoronoi={showVoronoi}
                    onToggleVoronoi={() => setShowVoronoi(!showVoronoi)}
                    showLines={showCentroidLines}
                    onToggleLines={() => setShowCentroidLines(!showCentroidLines)}
                    onOpenElbowModal={() => setShowElbowModal(true)}
                  />
                ) : (
                  <DBSCANControls
                    params={dParams}
                    onParamsChange={setDParams}
                    clusterCount={dbscanResult.clusterCount}
                    coreCount={dbscanResult.coreCount}
                    borderCount={dbscanResult.borderCount}
                    noiseCount={dbscanResult.noiseCount}
                    totalPoints={rawPoints.length}
                    showEpsHover={showEpsHover}
                    onToggleEpsHover={() => setShowEpsHover(!showEpsHover)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GUÍA TEÓRICA Y DIDÁCTICA */}
        {activeTab === 'theory' && <TheoryGuide />}
      </main>

      {/* Elbow Method Modal */}
      <ElbowModal
        isOpen={showElbowModal}
        onClose={() => setShowElbowModal(false)}
        elbowData={elbowData}
        currentK={kParams.k}
        onSelectK={(newK) => setKParams((prev) => ({ ...prev, k: newK }))}
      />

      {/* AI Tutor Assistant Drawer */}
      <AITutorDrawer
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        algorithm={activeTab === 'compare' ? 'compare' : labAlgorithm}
        datasetName={datasetType}
        kParams={kParams}
        dParams={dParams}
        metrics={
          labAlgorithm === 'kmeans'
            ? {
                inertia: Math.round(kInertia),
                k: kParams.k,
                iterations: kIteration,
              }
            : {
                clustersFound: dbscanResult.clusterCount,
                corePoints: dbscanResult.coreCount,
                borderPoints: dbscanResult.borderCount,
                noiseCount: dbscanResult.noiseCount,
                eps: dParams.eps,
                minPts: dParams.minPts,
              }
        }
      />
    </div>
  );
}
