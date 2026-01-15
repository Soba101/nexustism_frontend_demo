"use client";

import { useState, useEffect, useRef } from 'react';
import type { GraphNode, Ticket } from '@/types';
import { GRAPH_NODES as RAW_NODES, GRAPH_EDGES } from '@/data/mockTickets';
import { initializeNodes, downloadSVG } from './utils/graphHelpers';
import { useGraphPhysics } from './hooks/useGraphPhysics';
import { GraphControls } from './components/GraphControls';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailPanel } from './components/NodeDetailPanel';

interface RootCauseAnalysisPageProps {
  setActivePage: (page: string) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  targetTicket?: Ticket | null;
}

export const RootCauseAnalysisPage = ({ setActivePage, addToast, targetTicket }: RootCauseAnalysisPageProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [validation, setValidation] = useState({ rating: 0, confidence: 50, evidence: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ source: string; target: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize physics hook
  const { nodesRef, startSimulation, stopSimulation } = useGraphPhysics({
    edges: GRAPH_EDGES,
    draggedNodeId,
    setNodes
  });

  // Handle responsive viewport dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width, 400), height: Math.max(height, 300) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle Control key for pan override + keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      
      // Keyboard navigation for selected node
      if (selectedNode) {
        if (e.key === 'Escape') setSelectedNode(null);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const currentIndex = nodes.findIndex(n => n.id === selectedNode.id);
          const nextIndex = e.key === 'ArrowRight' 
            ? (currentIndex + 1) % nodes.length
            : (currentIndex - 1 + nodes.length) % nodes.length;
          setSelectedNode(nodes[nextIndex]);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNode, nodes]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Initialize nodes (only once or when dimensions change or when target ticket changes)
  useEffect(() => {
    const { width, height } = dimensions;

    // Update root node if targetTicket is provided
    let nodesToInitialize = RAW_NODES;
    if (targetTicket) {
      // Clone the nodes array and update the root node
      nodesToInitialize = RAW_NODES.map(node => {
        if (node.type === 'root') {
          return {
            ...node,
            label: targetTicket.number,
            details: `Root Ticket: ${targetTicket.short_description}`
          };
        }
        return node;
      });
    }

    const initialNodes = initializeNodes(nodesToInitialize, width, height);
    nodesRef.current = initialNodes;
    setNodes(initialNodes);

    startSimulation();

    return () => stopSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, targetTicket]); // Re-initialize when dimensions or target ticket changes

  // Canvas panning handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Allow panning if: in pan mode OR holding Control key
    const shouldPan = interactionMode === 'pan' || isCtrlPressed;
    if (!shouldPan || draggedNodeId) return;
    
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Node interaction handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();

    // In select mode or when Ctrl is NOT pressed, allow node interaction
    const canInteractWithNode = interactionMode === 'select' && !isCtrlPressed;
    
    if (canInteractWithNode) {
      setDraggedNodeId(nodeId);
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (node) setSelectedNode(node);
      startSimulation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle canvas panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Handle node dragging
    if (draggedNodeId && svgRef.current) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;

      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const adjustedX = (svgP.x - centerX) / zoom + centerX;
      const adjustedY = (svgP.y - centerY) / zoom + centerY;

      const node = nodesRef.current.find(n => n.id === draggedNodeId);
      if (node) {
        node.x = adjustedX;
        node.y = adjustedY;
        node.vx = 0;
        node.vy = 0;
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
    setTimeout(stopSimulation, 3000);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    nodesRef.current.forEach(n => {
      n.vx = (Math.random() - 0.5) * 5;
      n.vy = (Math.random() - 0.5) * 5;
    });
    startSimulation();
  };

  const handleDownloadGraph = (format: 'svg' | 'png' = 'svg') => {
    if (!svgRef.current) return;
    
    if (format === 'svg') {
      downloadSVG(svgRef.current, 'causal_graph.svg');
      addToast('SVG graph downloaded', 'success');
    } else {
      // PNG export using canvas
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'causal_graph.png';
            a.click();
            URL.revokeObjectURL(url);
            addToast('PNG graph downloaded', 'success');
          }
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  // Validation handlers
  const handleSubmitValidation = () => {
    addToast('Feedback submitted for model retraining', 'success');
    setValidation({ rating: 0, confidence: 50, evidence: '' });
  };

  const handleFlagIncorrect = () => {
    if (selectedNode) {
      addToast(`Marked ${selectedNode.label} as false positive`, 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      {/* Target Ticket Header */}
      {targetTicket && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Root Cause Analysis: {targetTicket.number}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {targetTicket.short_description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                targetTicket.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                targetTicket.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                targetTicket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {targetTicket.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                targetTicket.state === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                targetTicket.state === 'In Progress' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                targetTicket.state === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
              }`}>
                {targetTicket.state}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <GraphControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minConfidence={minConfidence}
        onMinConfidenceChange={setMinConfidence}
        interactionMode={interactionMode}
        onModeChange={setInteractionMode}
        isCtrlPressed={isCtrlPressed}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onDownload={handleDownloadGraph}
      />

      <div ref={containerRef} className="flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative border border-slate-800 flex flex-col lg:flex-row min-h-[400px]">
        <GraphCanvas
          nodes={nodes}
          zoom={zoom}
          pan={pan}
          dimensions={dimensions}
          isPanning={isPanning}
          interactionMode={interactionMode}
          isCtrlPressed={isCtrlPressed}
          searchQuery={searchQuery}
          minConfidence={minConfidence}
          selectedNodeId={selectedNode?.id || null}
          draggedNodeId={draggedNodeId}
          hoveredNodeId={hoveredNodeId}
          selectedEdge={selectedEdge}
          svgRef={svgRef}
          onCanvasMouseDown={handleCanvasMouseDown}
          onNodeMouseDown={handleMouseDown}
          onNodeMouseEnter={setHoveredNodeId}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onEdgeClick={setSelectedEdge}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        <NodeDetailPanel
          node={selectedNode}
          validation={validation}
          onValidationChange={setValidation}
          onSubmitValidation={handleSubmitValidation}
          onFlagIncorrect={handleFlagIncorrect}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
};
