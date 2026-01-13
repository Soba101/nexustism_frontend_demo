import { X, Star } from 'lucide-react';
import type { GraphNode } from '@/types';
import { Badge, Button } from '@/components/ui/wrappers';

interface ValidationState {
  rating: number;
  confidence: number;
  evidence: string;
}

interface NodeDetailPanelProps {
  node: GraphNode | null;
  validation: ValidationState;
  onValidationChange: (validation: ValidationState) => void;
  onSubmitValidation: () => void;
  onFlagIncorrect: () => void;
  onClose: () => void;
}

export const NodeDetailPanel = ({
  node,
  validation,
  onValidationChange,
  onSubmitValidation,
  onFlagIncorrect,
  onClose
}: NodeDetailPanelProps) => {
  if (!node) return null;

  return (
    <div className="w-full lg:w-80 bg-slate-800 border-t lg:border-t-0 lg:border-l border-slate-700 p-6 flex flex-col animate-in slide-in-from-right duration-300 z-10 h-auto lg:h-full overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-white text-lg">{node.label}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close details">
          <X className="w-5 h-5"/>
        </button>
      </div>
      <Badge variant={node.type === 'root' ? 'critical' : node.type === 'cause' ? 'high' : 'default'} className="self-start mb-4">
        {node.type.toUpperCase()}
      </Badge>
      <p className="text-slate-300 text-sm mb-6">{node.details}</p>

      <div className="border-t border-slate-700 pt-4 mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Validation Feedback</h4>

        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Accuracy Rating</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => onValidationChange({ ...validation, rating: star })}
              >
                <Star className={`w-5 h-5 ${validation.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Confidence</span>
            <span>{validation.confidence}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={validation.confidence}
            onChange={(e) => onValidationChange({ ...validation, confidence: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <textarea
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
          rows={3}
          placeholder="Evidence for validation..."
          value={validation.evidence}
          onChange={(e) => onValidationChange({ ...validation, evidence: e.target.value })}
        />
      </div>

      <div className="mt-auto space-y-2">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0"
          onClick={onSubmitValidation}
        >
          Submit Validation
        </Button>
        <Button
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={onFlagIncorrect}
        >
          Flag as Incorrect
        </Button>
      </div>
    </div>
  );
};
