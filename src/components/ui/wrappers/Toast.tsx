import { CheckCircle2, AlertCircle, Activity, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => (
  <div className={`flex items-center w-full max-w-xs p-4 space-x-3 text-gray-500 bg-white dark:bg-slate-800 dark:text-slate-200 divide-x divide-gray-200 dark:divide-slate-700 rounded-lg shadow-lg border-l-4 ${type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-blue-500'} animate-in slide-in-from-right duration-300`}>
    <div className="flex-shrink-0">
       {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500"/> : <Activity className="w-5 h-5 text-blue-500"/>}
    </div>
    <div className="pl-3 text-sm font-normal">{message}</div>
    <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex h-8 w-8" aria-label="Close">
      <X className="w-4 h-4" />
    </button>
  </div>
);
