import { useEffect, useRef, useState, useCallback } from 'react';
import { ClusteredPoint, Centroid, AlgorithmType } from '../types';
import { CLUSTER_COLORS, NOISE_COLOR } from '../algorithms/clustering';

interface ClusterCanvasProps {
  id: string;
  points: ClusteredPoint[];
  centroids?: Centroid[];
  algorithm: AlgorithmType;
  eps?: number;
  minPts?: number;
  onAddPoint?: (x: number, y: number) => void;
  showVoronoi?: boolean;
  showEpsHover?: boolean;
  showCentroidLines?: boolean;
  interactiveDrawing?: boolean;
}

export default function ClusterCanvas({
  id,
  points,
  centroids = [],
  algorithm,
  eps = 40,
  minPts = 4,
  onAddPoint,
  showVoronoi = false,
  showEpsHover = true,
  showCentroidLines = false,
  interactiveDrawing = false,
}: ClusterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ClusteredPoint | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Redraw logic
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Clear background
    ctx.fillStyle = '#090d16'; // Deep sleek slate
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Optional: Draw K-Means Voronoi decision boundary approximation
    if (showVoronoi && algorithm === 'kmeans' && centroids.length > 1) {
      const step = 8;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          let minD = Infinity;
          let closestColor = CLUSTER_COLORS[0];
          for (const c of centroids) {
            const dx = x - c.x;
            const dy = y - c.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < minD) {
              minD = dSq;
              closestColor = c.color;
            }
          }
          ctx.fillStyle = closestColor + '0f'; // Very faint 6% opacity
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // Centroid connector lines (if enabled in K-Means)
    if (showCentroidLines && algorithm === 'kmeans' && centroids.length > 0) {
      ctx.lineWidth = 0.75;
      points.forEach((pt) => {
        if (pt.cluster >= 0) {
          const c = centroids.find((centroid) => centroid.id === pt.cluster);
          if (c) {
            ctx.strokeStyle = c.color + '33'; // 20% opacity line
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
          }
        }
      });
    }

    // DBSCAN: Hover Epsilon Circle
    if (showEpsHover && (algorithm === 'dbscan' || algorithm === 'compare') && (hoveredPoint || cursorPos)) {
      const targetX = hoveredPoint ? hoveredPoint.x : cursorPos?.x ?? 0;
      const targetY = hoveredPoint ? hoveredPoint.y : cursorPos?.y ?? 0;

      // Draw epsilon circular neighborhood
      ctx.beginPath();
      ctx.arc(targetX, targetY, eps, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Count neighbors inside this radius
      let neighborsInEps = 0;
      points.forEach((p) => {
        const dx = p.x - targetX;
        const dy = p.y - targetY;
        if (dx * dx + dy * dy <= eps * eps) {
          neighborsInEps++;
          // Highlight neighbors
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.stroke();
        }
      });

      // Label radius and neighbor count
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(
        `ε = ${Math.round(eps)}px | Vecinos: ${neighborsInEps} (MinPts: ${minPts})`,
        Math.min(targetX + 12, width - 180),
        Math.max(targetY - 12, 20)
      );
    }

    // Draw Points
    points.forEach((p) => {
      let color = NOISE_COLOR;
      if (p.cluster >= 0) {
        color = CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length];
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);

      if (p.isNoise) {
        // Noise in DBSCAN: Dark filled with border and 'x'
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#64748b';
        ctx.stroke();

        // Draw tiny x
        ctx.beginPath();
        ctx.moveTo(p.x - 2.5, p.y - 2.5);
        ctx.lineTo(p.x + 2.5, p.y + 2.5);
        ctx.moveTo(p.x + 2.5, p.y - 2.5);
        ctx.lineTo(p.x - 2.5, p.y + 2.5);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (p.isBorder) {
        // Border point in DBSCAN: hollow colored ring
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.stroke();
        // Inner dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      } else if (p.isCore) {
        // Core point in DBSCAN: solid vibrant center with faint outer aura
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color + '22';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        // Standard clustered point (e.g. in K-Means or generic cluster)
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();
      }
    });

    // Draw K-Means Centroids
    if (algorithm === 'kmeans' || algorithm === 'compare') {
      centroids.forEach((c) => {
        // Centroid movement trajectory arrow
        if (c.prevX !== undefined && c.prevY !== undefined) {
          ctx.beginPath();
          ctx.moveTo(c.prevX, c.prevY);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = c.color + '88';
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Glowing outer ring
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16, 0, 2 * Math.PI);
        ctx.fillStyle = c.color + '26';
        ctx.fill();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = c.color;
        ctx.stroke();

        // Target Crosshair
        ctx.beginPath();
        ctx.moveTo(c.x - 12, c.y);
        ctx.lineTo(c.x + 12, c.y);
        ctx.moveTo(c.x, c.y - 12);
        ctx.lineTo(c.x, c.y + 12);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Centroid Label Badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(c.x + 14, c.y - 18, 36, 18, 4);
        ctx.fill();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`C${c.id + 1}`, c.x + 20, c.y - 5);
      });
    }

    ctx.restore();
  }, [
    points,
    centroids,
    algorithm,
    eps,
    minPts,
    showVoronoi,
    showEpsHover,
    showCentroidLines,
    hoveredPoint,
    cursorPos,
  ]);

  // Resize canvas when container size changes
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height || 380);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      render();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [render]);

  // Redraw when points or params change
  useEffect(() => {
    render();
  }, [render]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    // Check if hovering near a point
    const found = points.find((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return dx * dx + dy * dy < 64; // within 8px
    });
    setHoveredPoint(found || null);
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactiveDrawing && !onAddPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onAddPoint?.(x, y);
  };

  return (
    <div
      ref={containerRef}
      id={`${id}-container`}
      className="relative w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group select-none"
    >
      <canvas
        id={id}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`w-full h-full block ${
          interactiveDrawing ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />

      {/* Canvas Header Tag & Info */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span
          id={`${id}-badge`}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 text-slate-200 tracking-wide"
        >
          {algorithm === 'kmeans'
            ? 'K-Means (Centroides)'
            : algorithm === 'dbscan'
            ? 'DBSCAN (Densidad)'
            : 'Simulador Visual'}
        </span>
        <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-900/70 border border-slate-800 text-slate-400">
          {points.length} puntos
        </span>
      </div>

      {/* Interactive Helper Overlay */}
      {interactiveDrawing && (
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Haz clic en el lienzo para agregar puntos personalizados
        </div>
      )}

      {/* Point Tooltip Info */}
      {hoveredPoint && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-200 shadow-lg pointer-events-none backdrop-blur-sm">
          <div>
            Punto #{hoveredPoint.id}: ({Math.round(hoveredPoint.x)},{' '}
            {Math.round(hoveredPoint.y)})
          </div>
          <div className="mt-0.5 text-slate-400">
            {hoveredPoint.cluster === -1
              ? 'Estado: Ruido (Outlier)'
              : `Cúmulo: ${hoveredPoint.cluster + 1}`}
            {hoveredPoint.isCore && ' • Núcleo (Core)'}
            {hoveredPoint.isBorder && ' • Frontera (Border)'}
          </div>
        </div>
      )}
    </div>
  );
}
