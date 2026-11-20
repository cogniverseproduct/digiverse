import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'indigo' | 'cyan' | 'success' | 'amber' | 'rose' | 'emerald';
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  dot = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border transition-colors";

  const variantStyles = {
    default: "bg-white/5 text-gray-300 border-white/10",
    indigo: "bg-digiverse-indigo/10 text-indigo-300 border-digiverse-indigo/30 shadow-sm",
    cyan: "bg-digiverse-cyan/10 text-cyan-300 border-digiverse-cyan/30 shadow-sm",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30"
  };

  const dotColors = {
    default: "bg-gray-400",
    indigo: "bg-digiverse-indigo animate-pulse",
    cyan: "bg-digiverse-cyan animate-pulse",
    success: "bg-emerald-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400"
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </div>
  );
};
