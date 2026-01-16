import { Activity, AlertCircle, GitCommit, AlertTriangle, Network, Shield } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/types';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
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
  hoveredNodeId: string | null;
  selectedEdge: { source: string; target: string } | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeMouseEnter: (nodeId: string) => void;
  onNodeMouseLeave: () => void;
  onEdgeClick: (edge: { source: string; target: string } | null) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export const GraphCanvas = ({
  nodes,
  edges,
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
  hoveredNodeId,
  selectedEdge,
  svgRef,
  onCanvasMouseDown,
  onNodeMouseDown,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onEdgeClick,
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
  const filteredEdges = edges.filter(edge => edge.confidence >= minConfidence / 100);

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
          // Check for valid positions (not undefined, null, or NaN)
          const hasValidPositions = sourceNode && targetNode &&
            typeof sourceNode.x === 'number' && !isNaN(sourceNode.x) &&
            typeof sourceNode.y === 'number' && !isNaN(sourceNode.y) &&
            typeof targetNode.x === 'number' && !isNaN(targetNode.x) &&
            typeof targetNode.y === 'number' && !isNaN(targetNode.y);
          if (!hasValidPositions) return null;

          const isSelected = selectedEdge?.source === edge.source && selectedEdge?.target === edge.target;
          const isHighlighted = hoveredNodeId === edge.source || hoveredNodeId === edge.target;

          return (
            <g 
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onEdgeClick(isSelected ? null : { source: edge.source, target: edge.target });
              }}
              className="cursor-pointer"
              style={{ opacity: isHighlighted || isSelected ? 1 : 0.8 }}
            >
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isSelected ? '#3b82f6' : edge.confidence > 0.8 ? '#ef4444' : edge.confidence > 0.5 ? '#f97316' : '#64748b'}
                strokeWidth={isSelected || isHighlighted ? 3 : 2}
                strokeDasharray={edge.confidence < 0.8 ? '5,5' : '0'}
                markerEnd={edge.confidence > 0.8 ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
              />
              {/* Edge Label Background for readability */}
              <rect
                x={(sourceNode.x! + targetNode.x!) / 2 - 25}
                y={(sourceNode.y! + targetNode.y!) / 2 - 10}
                width="50" height="20" rx="4" 
                fill={isSelected ? '#1e40af' : '#0f172a'} 
                opacity={isSelected ? 0.95 : 0.8}
              />
              <text
                x={(sourceNode.x! + targetNode.x!) / 2}
                y={(sourceNode.y! + targetNode.y!) / 2 + 4}
                fill={isSelected ? '#fff' : '#94a3b8'}
                fontSize="11"
                textAnchor="middle"
                className="select-none font-medium"
              >
                {Math.round(edge.confidence * 100)}%
              </text>
              {isSelected && (
                <text
                  x={(sourceNode.x! + targetNode.x!) / 2}
                  y={(sourceNode.y! + targetNode.y!) / 2 - 18}
                  fill="#3b82f6"
                  fontSize="9"
                  textAnchor="middle"
                  className="select-none font-semibold"
                >
                  {edge.label || 'Related'}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          // Skip nodes with invalid positions
          const nodeX = typeof node.x === 'number' && !isNaN(node.x) ? node.x : null;
          const nodeY = typeof node.y === 'number' && !isNaN(node.y) ? node.y : null;
          if (nodeX === null || nodeY === null) return null;

          const isHighlighted = matchesSearch(node);
          const isHovered = hoveredNodeId === node.id;
          const isSelected = selectedNodeId === node.id;
          const opacity = searchQuery && !isHighlighted ? 0.2 : 1;

          // Node details from mock data
          const nodeDetails = node.details || node.label;

          return (
          <g
            key={node.id}
            transform={`translate(${nodeX},${nodeY})`}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            onMouseEnter={() => onNodeMouseEnter(node.id)}
            onMouseLeave={onNodeMouseLeave}
            className="cursor-pointer transition-all"
            style={{ transition: draggedNodeId === node.id ? 'none' : 'transform 0.1s linear', opacity }}
          >
            {/* Search highlight glow */}
            {searchQuery && isHighlighted && (
              <circle r={42} fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.7" className="animate-pulse" />
            )}
            {/* Outer glow for selected/hovered */}
            {(isSelected || isHovered) && (
              <circle r={36} fill="none" stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="2" strokeOpacity="0.6" className="animate-pulse" />
            )}
            
            {/* Circle Node */}
            <circle
              r={node.type === 'root' ? 30 : 24}
              fill={node.type === 'root' ? '#2563eb' : node.type === 'cause' ? '#dc2626' : node.type === 'change' ? '#f59e0b' : node.type === 'problem' ? '#ef4444' : '#1e293b'}
              stroke={isSelected ? '#fff' : isHovered ? '#94a3b8' : '#475569'}
              strokeWidth={isSelected ? 3 : 2}
              className="drop-shadow-lg"
            />

            {/* Node Icon */}
            <g transform="translate(-8, -8)">
              {node.type === 'root' && <Activity width="16" height="16" color="white" />}
              {node.type === 'cause' && <AlertCircle width="16" height="16" color="#fca5a5" />}
              {node.type === 'change' && <GitCommit width="16" height="16" color="#fef3c7" />}
              {node.type === 'problem' && <AlertTriangle width="16" height="16" color="#fca5a5" />}
              {node.type === 'related' && <Network width="16" height="16" color="#cbd5e1" />}
            </g>

            {/* Ticket Number Label */}
            <text
              y={node.type === 'root' ? 48 : 42}
              fill="#e2e8f0"
              fontSize="11"
              textAnchor="middle"
              fontWeight="600"
              className="select-none pointer-events-none"
              style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.9)' }}
            >
              {node.label}
            </text>

            {/* Hover Tooltip */}
            {isHovered && (
              <g transform="translate(0, -65)">
                <rect
                  x="-90"
                  y="-28"
                  width="180"
                  height="50"
                  rx="6"
                  fill="#0f172a"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  opacity="0.98"
                  className="drop-shadow-2xl"
                />
                <text
                  y="-14"
                  fill="#3b82f6"
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="700"
                  className="select-none"
                >
                  {node.label}
                </text>
                <text
                  y="0"
                  fill="#cbd5e1"
                  fontSize="9"
                  textAnchor="middle"
                  className="select-none"
                >
                  {nodeDetails.length > 32 ? nodeDetails.substring(0, 32) + '...' : nodeDetails}
                </text>
                <text
                  y="14"
                  fill="#94a3b8"
                  fontSize="8"
                  textAnchor="middle"
                  className="select-none"
                >
                  Type: {node.type.charAt(0).toUpperCase() + node.type.slice(1)} • Click for details
                </text>
              </g>
            )}
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
