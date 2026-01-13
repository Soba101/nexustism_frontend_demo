import type { GraphCluster, GraphNode } from '@/types';

export const initializeClusters = (
  clusters: GraphCluster[],
  width: number,
  height: number
): GraphCluster[] => {
  return clusters.map((c, i) => {
    // Fit 3 clusters within width with decent margins
    const x = 150 + (i * 250);
    const y = height / 2;
    return { ...c, x, y, width: 220, height: 450 };
  });
};

export const initializeNodes = (
  nodes: GraphNode[],
  clusters: GraphCluster[]
): GraphNode[] => {
  const width = 800;
  const height = 600;

  return nodes.map((node) => {
    const parentCluster = clusters.find(c => c.id === node.parent);
    let x = width / 2;
    let y = height / 2;

    if (parentCluster && parentCluster.x && parentCluster.y) {
      // Random spread within cluster box to prevent stacking
      x = parentCluster.x + (Math.random() - 0.5) * 100;
      y = parentCluster.y + (Math.random() - 0.5) * 100;
    }
    return { ...node, x, y, vx: 0, vy: 0 };
  });
};

export const downloadSVG = (svgElement: SVGSVGElement, filename: string): void => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
