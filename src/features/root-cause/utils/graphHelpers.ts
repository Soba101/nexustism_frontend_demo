import type { GraphNode } from '@/types';

export const initializeNodes = (
  nodes: GraphNode[],
  width: number,
  height: number
): GraphNode[] => {
  return nodes.map((node) => {
    // Spawn at center with random spread to prevent stacking
    const x = width / 2 + (Math.random() - 0.5) * 200;
    const y = height / 2 + (Math.random() - 0.5) * 200;
    // Add random initial velocity for faster dispersion
    const vx = (Math.random() - 0.5) * 5;
    const vy = (Math.random() - 0.5) * 5;
    return { ...node, x, y, vx, vy };
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
