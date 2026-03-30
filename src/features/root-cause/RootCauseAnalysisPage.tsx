"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { GraphNode, GraphEdge } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { useCausalGraph, useTicket } from '@/services';
import { initializeNodes, downloadSVG } from './utils/graphHelpers';
import { useGraphPhysics } from './hooks/useGraphPhysics';
import { GraphControls } from './components/GraphControls';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailPanel } from './components/NodeDetailPanel';

export const RootCauseAnalysisPage = () => {
  const router = useRouter();
  const { addToast, selectedTicketForAnalysis: targetTicket } = useUIStore();
  const fallbackTicketId = 'PRB000101';
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
  const minConfidence = 0;
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ source: string; target: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // API hooks for causal graph data
  const ticketId = targetTicket?.number || targetTicket?.id || fallbackTicketId;
  const { data: fallbackTicket } = useTicket(!targetTicket ? fallbackTicketId : '');
  const activeTicket = targetTicket || fallbackTicket || null;
  const isProblemTarget = activeTicket?.ticket_type === 'problem';
  const { data: graphData, isLoading: isGraphLoading } = useCausalGraph(ticketId);

  const graphNodes = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) return [];
    return graphData.nodes.map((node) => {
      const detailsText = node.details?.trim() ? node.details : node.label;
      if (activeTicket && node.type === 'root' && !isProblemTarget) {
        const rootDetails = activeTicket.short_description || detailsText;
        return {
          ...node,
          label: activeTicket.number || node.label,
          details: `Root Ticket: ${rootDetails}`,
        };
      }
      return { ...node, details: detailsText };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicket?.id, activeTicket?.number, activeTicket?.short_description, graphData, isProblemTarget]);

  const graphEdges: GraphEdge[] = useMemo(() => graphData?.edges ?? [], [graphData]);

  // Initialize physics hook with dynamic edges
  const { nodesRef, startSimulation, stopSimulation } = useGraphPhysics({
    edges: graphEdges,
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
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return true;
      if (target.isContentEditable) return true;
      const role = target.getAttribute('role');
      return role === 'slider' || role === 'textbox' || role === 'combobox';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);

      // Keyboard navigation for selected node
      if (selectedNode) {
        if (isEditableTarget(e.target)) return;
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

  // Initialize nodes (when dimensions, graph data, or target ticket changes)
  useEffect(() => {
    // Don't initialize while loading API data
    if (isGraphLoading && ticketId) return;
    if (graphNodes.length === 0) {
      nodesRef.current = [];
      setNodes([]);
      return;
    }

    const { width, height } = dimensions;
    const initialNodes = initializeNodes(graphNodes, width, height);
    nodesRef.current = initialNodes;
    setNodes(initialNodes);

    startSimulation();

    return () => stopSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, graphNodes, isGraphLoading]); // Re-initialize when dimensions or graph data changes

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

  const showEmptyGraph = !isGraphLoading && graphNodes.length === 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      {/* Target Ticket Header */}
      {activeTicket && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isProblemTarget ? 'Problem Investigation' : 'Root Cause Analysis'}: {activeTicket.number}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {activeTicket.short_description}
              </p>
              {isProblemTarget && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Linked incidents: {activeTicket.affected_ticket_ids?.length ?? 0}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                activeTicket.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                activeTicket.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                activeTicket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {activeTicket.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                activeTicket.state === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                activeTicket.state === 'In Progress' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                activeTicket.state === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
              }`}>
                {activeTicket.state}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <GraphControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
        {showEmptyGraph && !activeTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-slate-200">No Causal Graph Available</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Select a ticket from the Search page to explore its causal relationships and root cause connections.
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              The causal graph shows how incidents relate to each other, helping identify root causes and patterns.
            </p>
            <button
              onClick={() => router.push('/search')}
              className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go to Search
            </button>
          </div>
        ) : (
          <>
            <GraphCanvas
              nodes={nodes}
              edges={graphEdges}
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
          </>
        )}
      </div>
    </div>
  );
};
