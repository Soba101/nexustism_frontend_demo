interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress = ({ value, className = '' }: ProgressProps) => (
  <div className={`h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ${className}`}>
    <div
      className={`h-full transition-all duration-500 ${value > 80 ? 'bg-green-500' : value > 50 ? 'bg-blue-500' : 'bg-slate-400'}`}
      style={{ width: `${value}%` }}
    />
  </div>
);
