'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <button
        onClick={items[0]?.onClick}
        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
          {index === items.length - 1 ? (
            <span className="text-slate-900 dark:text-white font-medium">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
};
