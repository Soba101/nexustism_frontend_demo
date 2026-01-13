import { Menu, Activity } from 'lucide-react';

interface PageWrapperProps {
  children: React.ReactNode;
  setIsMobileOpen: (open: boolean) => void;
}

export const PageWrapper = ({ children, setIsMobileOpen }: PageWrapperProps) => (
  <div className="md:pl-64 transition-all duration-300">
    <div className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 sticky top-0 z-20">
      <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 -ml-2" aria-label="Open menu">
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center font-bold text-slate-900 dark:text-white"><Activity className="w-5 h-5 mr-2 text-blue-600"/> Nexus</div>
    </div>
    {children}
  </div>
);
