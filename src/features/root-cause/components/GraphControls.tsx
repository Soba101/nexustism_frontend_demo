import { MousePointer2, ImageIcon, Move, ZoomOut, ZoomIn, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/wrappers';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GraphControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
}

export const GraphControls = ({ 
  searchQuery, 
  onSearchChange, 
  minConfidence, 
  onMinConfidenceChange,
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onDownload 
}: GraphControlsProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Causal Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Root cause detection and relationship mapping.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700">
            <MousePointer2 className="w-4 h-4"/> Drag to pan or move nodes
          </div>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <ImageIcon className="w-4 h-4" />
            Export
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={onReset} aria-label="Reset zoom">
              <Move className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onZoomOut} aria-label="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onZoomIn} aria-label="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by ticket number or label..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
        <Button 
          variant={showFilters ? "primary" : "outline"} 
          size="sm" 
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto w-full"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 animate-in fade-in duration-200">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Minimum Confidence: {minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => onMinConfidenceChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
