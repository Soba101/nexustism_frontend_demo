import { MousePointer2, ImageIcon, Move, ZoomOut, ZoomIn, Search, SlidersHorizontal, Hand, Pointer } from 'lucide-react';
import { Button } from '@/components/ui/wrappers';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GraphControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
  interactionMode: 'select' | 'pan';
  onModeChange: (mode: 'select' | 'pan') => void;
  isCtrlPressed: boolean;
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
  interactionMode,
  onModeChange,
  isCtrlPressed,
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onDownload 
}: GraphControlsProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const effectiveMode = isCtrlPressed ? 'pan' : interactionMode;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Causal Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Root cause detection and relationship mapping.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1">
            <Button 
              variant={interactionMode === 'select' ? 'primary' : 'ghost'} 
              size="sm" 
              onClick={() => onModeChange('select')}
              className="px-3 py-1 h-8"
            >
              <Pointer className="w-4 h-4 mr-1" />
              Select
            </Button>
            <Button 
              variant={interactionMode === 'pan' ? 'primary' : 'ghost'} 
              size="sm" 
              onClick={() => onModeChange('pan')}
              className="px-3 py-1 h-8"
            >
              <Hand className="w-4 h-4 mr-1" />
              Pan
            </Button>
          </div>
          
          {/* Ctrl indicator */}
          {isCtrlPressed && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
              <Hand className="w-3 h-3" />
              Pan Mode (Ctrl)
            </div>
          )}

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
