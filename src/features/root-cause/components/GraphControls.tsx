import { Move, ZoomOut, ZoomIn, Search, Hand, Pointer, Download } from 'lucide-react';
import { Button } from '@/components/ui/wrappers';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GraphControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  interactionMode: 'select' | 'pan';
  onModeChange: (mode: 'select' | 'pan') => void;
  isCtrlPressed: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: (format: 'svg' | 'png') => void;
}

export const GraphControls = ({ 
  searchQuery, 
  onSearchChange, 
  interactionMode,
  onModeChange,
  isCtrlPressed,
  zoom,
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onDownload 
}: GraphControlsProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

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

          {/* Export Menu */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => { onDownload('svg'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg"
                >
                  Save as SVG
                </button>
                <button
                  onClick={() => { onDownload('png'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 last:rounded-b-lg"
                >
                  Save as PNG
                </button>
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          
          {/* Zoom Display */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
            {Math.round(zoom * 100)}%
          </div>
          
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
      </div>
    </div>
  );
};
