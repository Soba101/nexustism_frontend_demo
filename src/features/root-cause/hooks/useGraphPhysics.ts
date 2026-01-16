import { useRef, useCallback, Dispatch, SetStateAction } from 'react';
import type { GraphNode, GraphEdge } from '@/types';

interface UseGraphPhysicsParams {
  edges: GraphEdge[];
  draggedNodeId: string | null;
  setNodes: Dispatch<SetStateAction<GraphNode[]>>;
}

interface UseGraphPhysicsReturn {
  nodesRef: React.MutableRefObject<GraphNode[]>;
  animationRef: React.MutableRefObject<number | undefined>;
  startSimulation: () => void;
  stopSimulation: () => void;
}

export const useGraphPhysics = ({
  edges,
  draggedNodeId,
  setNodes
}: UseGraphPhysicsParams): UseGraphPhysicsReturn => {
  const nodesRef = useRef<GraphNode[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Store setNodes in a ref to avoid dependency issues
  const setNodesRef = useRef(setNodes);
  setNodesRef.current = setNodes;

  // Store current props in refs to avoid recreating tick function
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const draggedNodeIdRef = useRef(draggedNodeId);
  draggedNodeIdRef.current = draggedNodeId;

  const stopSimulation = useCallback(() => {
    if (animationRef.current !== undefined) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = undefined;
  }, []);

  const startSimulation = useCallback(() => {
    if (animationRef.current !== undefined) return; // Already running

    let frameCount = 0;
    const RENDER_EVERY_N_FRAMES = 3; // Batch updates: only re-render every 3rd frame

    const tick = () => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const currentDraggedNodeId = draggedNodeIdRef.current;

      // Apply forces
      currentNodes.forEach(node => {
        if (node.id === currentDraggedNodeId) return; // Don't move dragged node

        let fx = 0;
        let fy = 0;

        // A. Repulsion (Push away from other nodes to prevent overlap)
        currentNodes.forEach(other => {
          if (node.id === other.id) return;
          const dx = (node.x || 0) - (other.x || 0);
          const dy = (node.y || 0) - (other.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 28000 / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        });

        // B. Link Attraction (Pull connected nodes together)
        currentEdges.forEach(edge => {
          let otherId = null;
          if (edge.source === node.id) otherId = edge.target;
          if (edge.target === node.id) otherId = edge.source;

          if (otherId) {
            const other = currentNodes.find(n => n.id === otherId);
            if (other) {
              const dx = (other.x || 0) - (node.x || 0);
              const dy = (other.y || 0) - (node.y || 0);
              // Normalize confidence to 0-1 range (handle both decimal and percentage formats)
              const normalizedConf = edge.confidence > 1 ? edge.confidence / 100 : edge.confidence;
              const strength = Math.min(normalizedConf, 1) * 0.02;
              fx += dx * strength;
              fy += dy * strength;
            }
          }
        });

        // Clamp forces to prevent Infinity/NaN
        const maxForce = 50;
        fx = Math.max(-maxForce, Math.min(maxForce, fx));
        fy = Math.max(-maxForce, Math.min(maxForce, fy));

        // Apply Velocity
        node.vx = ((node.vx || 0) + fx) * 0.5; // High friction (0.5) to settle quickly
        node.vy = ((node.vy || 0) + fy) * 0.5;

        // Clamp velocity to prevent runaway values
        const maxVel = 30;
        node.vx = Math.max(-maxVel, Math.min(maxVel, node.vx || 0));
        node.vy = Math.max(-maxVel, Math.min(maxVel, node.vy || 0));

        // Update Position with bounds check
        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);

        // Guard against NaN/Infinity
        if (!isFinite(node.x)) node.x = 400;
        if (!isFinite(node.y)) node.y = 300;
      });

      // Batched re-render: only trigger React update every Nth frame
      frameCount++;
      if (frameCount % RENDER_EVERY_N_FRAMES === 0) {
        setNodesRef.current([...currentNodes]);
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []); // Empty deps - function is stable, uses refs for current values

  return {
    nodesRef,
    animationRef,
    startSimulation,
    stopSimulation
  };
};
