"use client";

import { useState, useEffect, useRef } from 'react';
import type { GraphNode, GraphCluster } from '@/types';
import { GRAPH_CLUSTERS, GRAPH_NODES as RAW_NODES, GRAPH_EDGES } from '@/data/mockTickets';
import { initializeClusters, initializeNodes, downloadSVG } from './utils/graphHelpers';
import { useGraphPhysics } from './hooks/useGraphPhysics';
import { GraphControls } from './components/GraphControls';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailPanel } from './components/NodeDetailPanel';

interface RootCauseAnalysisPageProps {
  setActivePage: (page: string) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const RootCauseAnalysisPage = ({ setActivePage, addToast }: RootCauseAnalysisPageProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [clusters, setClusters] = useState<GraphCluster[]>([]);
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

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize physics hook
  const { nodesRef, startSimulation, stopSimulation } = useGraphPhysics({
    clusters,
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

  // Initialize clusters & nodes (only once)
  useEffect(() => {
    const { width, height } = dimensions;

    const computedClusters = initializeClusters(GRAPH_CLUSTERS, width, height);
    setClusters(computedClusters);

    const initialNodes = initializeNodes(RAW_NODES, computedClusters);
    nodesRef.current = initialNodes;
    setNodes(initialNodes);

    startSimulation();

    return () => stopSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]); // Re-initialize when dimensions change

  // Canvas panning handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggedNodeId) return; // Don't pan while dragging a node
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Node interaction handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedNodeId(nodeId);

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) setSelectedNode(node);

    startSimulation();
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

  const handleDownloadGraph = () => {
    if (!svgRef.current) return;
    downloadSVG(svgRef.current, 'causal_graph.svg');
    addToast('Graph image downloaded', 'success');
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
      <GraphControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minConfidence={minConfidence}
        onMinConfidenceChange={setMinConfidence}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onDownload={handleDownloadGraph}
      />

      <div ref={containerRef} className="flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative border border-slate-800 flex flex-col lg:flex-row min-h-[400px]">
        <GraphCanvas
          nodes={nodes}
          clusters={clusters}
          zoom={zoom}
          pan={pan}
          dimensions={dimensions}
          isPanning={isPanning}
          searchQuery={searchQuery}
          minConfidence={minConfidence}
          selectedNodeId={selectedNode?.id || null}
          draggedNodeId={draggedNodeId}
          svgRef={svgRef}
          onCanvasMouseDown={handleCanvasMouseDown}
          onNodeMouseDown={handleMouseDown}
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
