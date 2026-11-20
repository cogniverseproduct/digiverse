import React from 'react';
import { cn } from '../../../lib/utils';

/** Light badge for the main product. Same API as ui/Badge (kept for engines). */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'indigo' | 'cyan' | 'success' | 'amber' | 'rose' | 'emerald';
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', dot = false, className, children, ...props }) => {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors';
  const variants = {
    default: 'bg-slate-50 text-slate-600 border-slate-200',
    indigo: 'bg-dv-iris-50 text-dv-iris-700 border-dv-iris-200',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const dots = {
    default: 'bg-slate-400',
    indigo: 'bg-dv-iris-500 animate-pulse',
    cyan: 'bg-sky-500 animate-pulse',
    success: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[variant])} />}
      {children}
    </div>
  );
};

export default Badge;
