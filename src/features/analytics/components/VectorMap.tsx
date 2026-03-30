import { useEffect, useMemo, useRef, useState } from 'react';
import { Move, ZoomIn, ZoomOut } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { AnalyticsVectorMap, AnalyticsVectorPoint } from '@/types';

const VIEWBOX = {
  width: 900,
  height: 540,
  padding: 36,
};

const PALETTE = [
  '#2563eb',
  '#f97316',
  '#10b981',
  '#0ea5e9',
  '#ef4444',
  '#eab308',
  '#14b8a6',
  '#f43f5e',
  '#64748b',
  '#22c55e',
];

type TooltipState = {
  point: AnalyticsVectorPoint;
  x: number;
  y: number;
} | null;

interface VectorMapProps {
  data?: AnalyticsVectorMap;
  isLoading?: boolean;
  onPointClick?: (point: AnalyticsVectorPoint) => void;
}

const formatLabelBy = (value: string) => value.replace(/_/g, ' ');
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const VectorMap = ({ data, isLoading, onPointClick }: VectorMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const hoveredPointRef = useRef<AnalyticsVectorPoint | null>(null);
  const tooltipPositionRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const points = useMemo(() => data?.points ?? [], [data?.points]);
  const labelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    points.forEach((point) => {
      const label = point.label || 'Unknown';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [points]);

  const labelColors = useMemo(() => {
    const map = new Map<string, string>();
    labelCounts.forEach(([label], index) => {
      map.set(label, PALETTE[index % PALETTE.length]);
    });
    return map;
  }, [labelCounts]);

  const projectionLabel = data?.projection ? data.projection.toUpperCase() : 'PCA';

  const getPosition = (point: AnalyticsVectorPoint) => {
    const x = VIEWBOX.padding + point.x * (VIEWBOX.width - VIEWBOX.padding * 2);
    const y = VIEWBOX.padding + (1 - point.y) * (VIEWBOX.height - VIEWBOX.padding * 2);
    return { x, y };
  };

  const updateTooltip = (point: AnalyticsVectorPoint, event: MouseEvent<SVGCircleElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextPosition = {
      x: event.clientX - rect.left + 12,
      y: event.clientY - rect.top + 12,
    };
    hoveredPointRef.current = point;
    tooltipPositionRef.current = nextPosition;

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      if (!hoveredPointRef.current || !tooltipPositionRef.current || isPanning) {
        setTooltip(null);
        rafRef.current = null;
        return;
      }
      setTooltip({
        point: hoveredPointRef.current,
        x: tooltipPositionRef.current.x,
        y: tooltipPositionRef.current.y,
      });
      rafRef.current = null;
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!containerRef.current || !containerRef.current.contains(event.target as Node)) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((prev) => clamp(prev + delta, 0.5, 3));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const handleCanvasMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleCanvasMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: event.clientX - panStart.x,
      y: event.clientY - panStart.y,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom((prev) => clamp(prev + 0.15, 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => clamp(prev - 0.15, 0.5, 3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Loading vector map...
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        No vector map data available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        role="img"
        aria-label="Ticket embedding vector map"
      >
        <rect
          x={0}
          y={0}
          width={VIEWBOX.width}
          height={VIEWBOX.height}
          fill="transparent"
        />
        <g transform={`translate(${pan.x / zoom} ${pan.y / zoom}) scale(${zoom})`}>
          {points.map((point) => {
            const { x, y } = getPosition(point);
            const color = labelColors.get(point.label) ?? '#64748b';
            return (
              <circle
                key={point.id}
                cx={x}
                cy={y}
                r={4.2}
                fill={color}
                fillOpacity={0.85}
                stroke="#0f172a"
                strokeOpacity={0.15}
                onMouseDown={(event) => event.stopPropagation()}
                onMouseEnter={(event) => updateTooltip(point, event)}
                onMouseMove={(event) => updateTooltip(point, event)}
                onMouseLeave={() => {
                  hoveredPointRef.current = null;
                  tooltipPositionRef.current = null;
                  setTooltip(null);
                }}
                onClick={() => onPointClick?.(point)}
                className="cursor-pointer"
              />
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold text-slate-900">{tooltip.point.number}</div>
          <div className="text-slate-500 line-clamp-2 max-w-[220px]">
            {tooltip.point.short_description || 'No description'}
          </div>
          <div className="mt-1 text-slate-500">
            {tooltip.point.label}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-500">
        <div>Projection: {projectionLabel}</div>
        <div>Sample: {data?.sample_size ?? points.length}</div>
        <div>Label by: {formatLabelBy(data?.label_by ?? 'category')}</div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm">
        <span className="px-1 text-[11px]">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={handleReset}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          aria-label="Reset zoom"
        >
          <Move className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {labelCounts.length > 0 && (
        <div className="absolute bottom-3 right-3 max-w-[220px] rounded-lg border border-slate-200 bg-white/90 p-2 text-[11px] text-slate-500">
          <div className="mb-1 font-semibold text-slate-700">Labels</div>
          <div className="space-y-1">
            {labelCounts.slice(0, 6).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: labelColors.get(label) ?? '#64748b' }}
                  />
                  {label}
                </span>
                <span>{count}</span>
              </div>
            ))}
            {labelCounts.length > 6 && (
              <div className="text-[10px] text-slate-400">
                +{labelCounts.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
