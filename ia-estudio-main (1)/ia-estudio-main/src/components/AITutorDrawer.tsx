import { useState } from 'react';
import { Bot, Send, Sparkles, X, Loader2, MessageSquare } from 'lucide-react';
import { AlgorithmType, DatasetType, KMeansParams, DBSCANParams } from '../types';

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  algorithm: AlgorithmType;
  datasetName: DatasetType;
  kParams: KMeansParams;
  dParams: DBSCANParams;
  metrics: Record<string, any>;
}

export default function AITutorDrawer({
  isOpen,
  onClose,
  algorithm,
  datasetName,
  kParams,
  dParams,
  metrics,
}: AITutorDrawerProps) {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: '¡Hola! Soy el Profesor Cluster 🤖. Estoy aquí para ayudarte a entender la intuición geométrica de K-Means y DBSCAN. Puedes pulsar el botón de abajo para que analice tu simulación actual o escribirme cualquier duda.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExplainCurrent = async () => {
    setLoading(true);
    const activeAlgo = algorithm === 'compare' ? 'kmeans' : algorithm;
    const currentParams = activeAlgo === 'kmeans' ? kParams : dParams;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: `¿Puedes explicarme el resultado de ${activeAlgo.toUpperCase()} sobre el conjunto de datos "${datasetName}"?`,
      },
    ]);

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: activeAlgo,
          datasetName,
          params: currentParams,
          metrics,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.explanation || 'No se pudo generar la explicación.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Hubo un error de conexión al consultar al tutor. Verifica tu conexión.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          context: {
            algorithm,
            datasetName,
            kParams,
            dParams,
            metrics,
          },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'No se recibió respuesta del tutor.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error de comunicación con el profesor IA.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="ai-tutor-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="ai-tutor-sidebar"
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Profesor Cluster IA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Gemini
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Tutor de Aprendizaje No Supervisado</p>
            </div>
          </div>

          <button
            id="btn-close-ai-tutor"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2">
          <button
            id="btn-explain-current-sim"
            onClick={handleExplainCurrent}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explicar mi simulación actual</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-2 bg-slate-800/40 rounded-xl max-w-[70%]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>El profesor está pensando...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
        >
          <input
            id="ai-tutor-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pregunta sobre K-Means, DBSCAN o hiperparámetros..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            id="ai-tutor-submit-btn"
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
