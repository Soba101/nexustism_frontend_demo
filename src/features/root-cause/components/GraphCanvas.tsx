import { Activity, AlertCircle, GitCommit, AlertTriangle, Network, Shield } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/types';
import { GRAPH_EDGES } from '@/data/mockTickets';

interface GraphCanvasProps {
  nodes: GraphNode[];
  zoom: number;
  pan: { x: number; y: number };
  dimensions: { width: number; height: number };
  isPanning: boolean;
  interactionMode: 'select' | 'pan';
  isCtrlPressed: boolean;
  searchQuery: string;
  minConfidence: number;
  selectedNodeId: string | null;
  draggedNodeId: string | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export const GraphCanvas = ({
  nodes,
  zoom,
  pan,
  dimensions,
  isPanning,
  interactionMode,
  isCtrlPressed,
  searchQuery,
  minConfidence,
  selectedNodeId,
  draggedNodeId,
  svgRef,
  onCanvasMouseDown,
  onNodeMouseDown,
  onMouseMove,
  onMouseUp
}: GraphCanvasProps) => {
  // Helper function to check if node matches search query
  const matchesSearch = (node: GraphNode) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      node.id.toLowerCase().includes(query) ||
      node.label.toLowerCase().includes(query)
    );
  };

  // Filter edges by confidence threshold
  const filteredEdges = GRAPH_EDGES.filter(edge => edge.confidence >= minConfidence / 100);

  // Determine cursor based on mode and state
  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (draggedNodeId) return 'cursor-grabbing';
    
    const effectiveMode = isCtrlPressed ? 'pan' : interactionMode;
    if (effectiveMode === 'pan') return 'cursor-grab';
    return 'cursor-default';
  };

  return (
  <div
    className={`relative flex-1 overflow-hidden h-full ${getCursorClass()}`}
    onMouseDown={onCanvasMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onMouseLeave={onMouseUp}
  >
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '30px 30px' }}
    />

    <svg
      ref={svgRef}
      className="w-full h-full min-h-[300px]"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
        <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>

      <g transform={`translate(${pan.x / zoom}, ${pan.y / zoom}) scale(${zoom})`} style={{ transformOrigin: `${dimensions.width/2}px ${dimensions.height/2}px`, transition: draggedNodeId || isPanning ? 'none' : 'transform 0.1s linear' }}>

        {/* Edges */}
        {nodes.length > 0 && filteredEdges.map((edge, i) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode || sourceNode.x === undefined || targetNode.x === undefined) return null;

          return (
            <g key={i}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={edge.confidence > 0.8 ? '#ef4444' : '#64748b'}
                strokeWidth={2}
                strokeDasharray={edge.confidence < 0.8 ? '5,5' : '0'}
                markerEnd={edge.confidence > 0.8 ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                opacity="0.8"
              />
              {/* Edge Label Background for readability */}
              <rect
                x={(sourceNode.x! + targetNode.x!) / 2 - 20}
                y={(sourceNode.y! + targetNode.y!) / 2 - 8}
                width="40" height="16" rx="4" fill="#0f172a" opacity="0.8"
              />
              <text
                x={(sourceNode.x! + targetNode.x!) / 2}
                y={(sourceNode.y! + targetNode.y!) / 2 + 4}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
                className="select-none"
              >
                {Math.round(edge.confidence * 100)}%
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHighlighted = matchesSearch(node);
          const opacity = searchQuery && !isHighlighted ? 0.2 : 1;

          return (
          <g
            key={node.id}
            transform={`translate(${node.x || 0},${node.y || 0})`}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            className="cursor-pointer hover:opacity-90"
            style={{ transition: draggedNodeId === node.id ? 'none' : 'transform 0.1s linear', opacity }}
          >
            {/* Search highlight glow */}
            {searchQuery && isHighlighted && (
              <circle r={36} fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.7" className="animate-pulse" />
            )}
            {/* Outer glow for selected */}
            {selectedNodeId === node.id && (
              <circle r={32} fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.5" className="animate-pulse" />
            )}
            <circle
              r={node.type === 'root' ? 28 : 22}
              fill={node.type === 'root' ? '#2563eb' : '#1e293b'}
              stroke={selectedNodeId === node.id ? '#fff' : '#475569'}
              strokeWidth="2"
            />

            {/* Text Label - Offset to avoid covering node */}
            <text
              y={node.type === 'root' ? 45 : 40}
              fill="#cbd5e1"
              fontSize="11"
              textAnchor="middle"
              fontWeight="500"
              className="select-none pointer-events-none"
              style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}
            >
              {node.label}
            </text>

            {/* Icons inside nodes */}
            {node.type === 'root' && <Activity x="-12" y="-12" color="white" />}
            {node.type === 'cause' && <AlertCircle x="-10" y="-10" width="20" height="20" color="#fca5a5" />}
            {node.type === 'change' && <GitCommit x="-10" y="-10" width="20" height="20" color="#fbbf24" />}
            {node.type === 'problem' && <AlertTriangle x="-10" y="-10" width="20" height="20" color="#f87171" />}
            {node.type === 'related' && <Network x="-10" y="-10" width="20" height="20" color="#94a3b8" />}
          </g>
        );})}
      </g>
    </svg>

    {/* Info overlay when no node selected */}
    {!selectedNodeId && (
      <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-lg w-64 text-left pointer-events-none hidden sm:block">
        <h3 className="text-white font-medium text-sm mb-2 flex items-center"><Shield className="w-4 h-4 mr-2 text-green-400"/> Analysis Mode</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Click nodes to view details. Toggle mode or hold <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Ctrl</kbd> to pan canvas.
        </p>
      </div>
    )}
  </div>
  );
};
