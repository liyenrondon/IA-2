import { useState } from 'react';
import { Challenge, ClusteredPoint, Centroid, KMeansParams, DBSCANParams } from '../types';
import { CHALLENGES } from '../algorithms/challenges';
import confetti from 'canvas-confetti';
import { Trophy, HelpCircle, CheckCircle2, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface ChallengesViewProps {
  currentChallenge: Challenge;
  onSelectChallenge: (challenge: Challenge) => void;
  kParams: KMeansParams;
  dParams: DBSCANParams;
  currentPoints: ClusteredPoint[];
  currentCentroids?: Centroid[];
  onApplyPresetParams: (kParams?: KMeansParams, dParams?: DBSCANParams) => void;
}

export default function ChallengesView({
  currentChallenge,
  onSelectChallenge,
  kParams,
  dParams,
  currentPoints,
  currentCentroids,
  onApplyPresetParams,
}: ChallengesViewProps) {
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ passed: boolean; message: string; progress: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleValidate = () => {
    const result = currentChallenge.validate(
      currentChallenge.algorithm,
      kParams,
      dParams,
      currentPoints,
      currentCentroids
    );

    setFeedback(result);

    if (result.passed) {
      setCompletedChallenges((prev) => new Set([...prev, currentChallenge.id]));
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSelect = (ch: Challenge) => {
    onSelectChallenge(ch);
    setFeedback(null);
    setShowHint(false);
    if (ch.initialParams.kmeans || ch.initialParams.dbscan) {
      onApplyPresetParams(ch.initialParams.kmeans, ch.initialParams.dbscan);
    }
  };

  return (
    <div id="challenges-view-container" className="flex flex-col gap-4">
      {/* Challenges Nav Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {CHALLENGES.map((ch, idx) => {
          const isSelected = ch.id === currentChallenge.id;
          const isDone = completedChallenges.has(ch.id);

          return (
            <button
              key={ch.id}
              id={`challenge-card-${ch.id}`}
              onClick={() => handleSelect(ch)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400">
                  Misión {idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {ch.level}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold truncate text-slate-200">{ch.title.split(': ')[1] || ch.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Challenge Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">{currentChallenge.title}</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                Algoritmo:{' '}
                {currentChallenge.algorithm === 'kmeans' ? 'K-Means' : 'DBSCAN'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{currentChallenge.description}</p>
          </div>

          <button
            id="btn-validate-challenge"
            onClick={handleValidate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Comprobar Misión</span>
          </button>
        </div>

        {/* Goal Objective */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">Objetivo:</div>
              <div className="text-xs text-slate-300">{currentChallenge.goalDescription}</div>
            </div>
          </div>

          <button
            id="btn-toggle-hint"
            onClick={() => setShowHint(!showHint)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'Ocultar Pista' : 'Ver Pista'}</span>
          </button>
        </div>

        {/* Hint accordion */}
        {showHint && (
          <div className="bg-indigo-950/40 border border-indigo-800/60 p-3 rounded-lg text-xs text-indigo-200 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <p>{currentChallenge.hint}</p>
          </div>
        )}

        {/* Validation Result Box */}
        {feedback && (
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
              feedback.passed
                ? 'bg-emerald-950/50 border-emerald-600/80 text-emerald-200'
                : 'bg-amber-950/50 border-amber-600/80 text-amber-200'
            }`}
          >
            {feedback.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold text-xs">
                {feedback.passed ? '¡Misión Cumplida!' : 'Casi lo logras...'}
              </div>
              <div className="text-xs mt-0.5 leading-relaxed">{feedback.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
