import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-digiverse-indigo/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-digiverse-indigo to-digiverse-violet hover:from-indigo-500 hover:to-violet-500 text-white shadow-glow-indigo shadow-md hover:shadow-lg border border-indigo-400/20",
    secondary: "bg-digiverse-surface hover:bg-digiverse-surface-light text-white border border-digiverse-border hover:border-digiverse-border-highlight shadow-sm",
    outline: "bg-transparent text-gray-200 border border-gray-700 hover:border-gray-500 hover:bg-white/5",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/5"
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3.5 gap-2.5 font-semibold"
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
