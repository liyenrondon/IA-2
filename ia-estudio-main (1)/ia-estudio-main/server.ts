import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGemini: !!process.env.GEMINI_API_KEY,
  });
});

// Explain clustering results
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { algorithm, datasetName, params, metrics } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        explanation: `Modo sin conexión a API: Estás ejecutando ${algorithm.toUpperCase()} sobre el dataset "${datasetName}". ${
          algorithm === "kmeans"
            ? `Con K=${params.k}, K-Means minimiza la inercia particionando el espacio con límites Voronoi lineales. Funciona óptimamente con nubes esféricas homogéneas, pero sufre con geometrías complejas como lunas o anillos.`
            : `Con ε=${params.eps} y MinPts=${params.minPts}, DBSCAN rastrea la densidad local. Puede descubrir formas arbitrarias y filtrar ${metrics.noiseCount} puntos de ruido, aunque es sensible si las densidades difieren.`
        }`,
      });
    }

    const prompt = `Actúa como un profesor universitario experto y didáctico de Machine Learning. Explica de forma concisa, lúdica y muy clara en español el resultado obtenido en esta simulación de clustering no supervisado:
- Algoritmo: ${algorithm.toUpperCase()}
- Conjunto de datos: ${datasetName}
- Parámetros utilizados: ${JSON.stringify(params)}
- Métricas y resultados: ${JSON.stringify(metrics)}

En tu respuesta (máximo 3 párrafos cortos y amigables):
1. Explica intuitivamente por qué el algoritmo produjo este resultado con esos hiperparámetros.
2. Explica qué debilidad o fortaleza geométrica de ${algorithm.toUpperCase()} se evidencia aquí frente a su contraparte.
3. Da una sugerencia concreta de cómo ajustar los hiperparámetros para mejorar el agrupamiento en este dataset.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ explanation: response.text || "No se pudo generar la explicación." });
  } catch (err: any) {
    console.error("Error generating explanation:", err);
    res.status(500).json({
      error: "Error al generar la explicación con IA.",
      details: err.message,
    });
  }
});

// AI Tutor chat
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        answer:
          "El profesor IA requiere configurar GEMINI_API_KEY en los secretos. Mientras tanto, puedes explorar las lecciones interactivas, los controles de hiperparámetros y los desafíos integrados en la aplicación.",
      });
    }

    const systemInstruction =
      "Eres 'Profesor Cluster', un mentor de ciencia de datos simpático, didáctico y riguroso. Tu misión es enseñar de forma lúdica y visual los fundamentos del Aprendizaje No Supervisado, en especial K-Means y DBSCAN. Responde siempre en español, con metáforas visuales, ejemplos claros y formato Markdown limpio.";

    const prompt = `Contexto de la app: El usuario está usando el simulador de K-Means y DBSCAN. Contexto actual: ${JSON.stringify(
      context || {}
    )}. Pregunta del usuario: "${question}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ answer: response.text || "Sin respuesta." });
  } catch (err: any) {
    console.error("Error in AI tutor:", err);
    res.status(500).json({
      error: "Error consultando al profesor IA.",
      details: err.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClusterLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
