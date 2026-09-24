export type ActiveTab = 'visualizer' | 'training' | 'draw' | 'concepts' | 'quiz';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  accuracy: number;
  isTraining: boolean;
  epoch: number;
}

export function Navbar({
  activeTab,
  onTabChange,
  accuracy,
  isTraining,
  epoch
}: NavbarProps) {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'visualizer', label: 'Visualizador de Red', icon: '🧠' },
    { id: 'training', label: 'Entrenamiento & Backprop', icon: '⚡' },
    { id: 'draw', label: 'Lienzo & Test 28x28', icon: '✏️' },
    { id: 'concepts', label: 'Laboratorio Teórico', icon: '📖' },
    { id: 'quiz', label: 'Desafío Conceptual', icon: '🎯' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              MLP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-100 tracking-tight">
                  Perceptrón Multicapa
                </h1>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-xs text-indigo-400 font-medium">
                  Fashion MNIST
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Explorador interactivo de Redes Neuronales Artificiales
              </p>
            </div>
          </div>

          {/* Model Status Metrics (Anti-slop: clean text metadata) */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTraining ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {isTraining ? 'Entrenando...' : 'Modelo Listo'}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              Época: <span className="text-slate-200 font-semibold">{epoch}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              Precisión: <span className="text-emerald-400 font-semibold">{accuracy.toFixed(1)}%</span>
            </div>
          </div>

          {/* Tab Navigation (Segmented control) */}
          <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
