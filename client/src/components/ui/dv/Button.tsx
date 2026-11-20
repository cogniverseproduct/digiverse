import React from 'react';
import { cn } from '../../../lib/utils';

/**
 * Light "Prism Paper" button for the DigiVerse main product.
 * Same API as ui/Button (which stays untouched for the website-generation engines).
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, children, ...props }) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dv-iris-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary:
      'dv-sheen text-white bg-gradient-to-r from-dv-iris-600 via-[#7346EA] to-[#9A4FF0] shadow-dv-glow hover:-translate-y-px hover:shadow-[0_16px_36px_-12px_rgba(103,80,242,0.7)]',
    secondary:
      'bg-white text-dv-ink border border-dv-line shadow-[0_1px_2px_rgba(18,18,42,0.05)] hover:border-dv-iris-200 hover:bg-dv-iris-50/60',
    outline: 'bg-transparent text-dv-ink-2 border border-dv-line hover:border-dv-iris-300 hover:text-dv-ink hover:bg-white',
    ghost: 'bg-transparent text-dv-ink-2 hover:text-dv-ink hover:bg-dv-ink/[0.05]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

export default Button;
