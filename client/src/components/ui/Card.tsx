import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  glow = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-digiverse-border bg-digiverse-surface/80 backdrop-blur-md p-6 text-digiverse-text shadow-glow-card transition-all duration-300 hover:border-digiverse-border-highlight/50",
        glow && "hover:shadow-glow-indigo",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn("text-lg font-semibold tracking-tight text-white", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-digiverse-muted leading-relaxed", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("pt-0", className)} {...props}>
    {children}
  </div>
);
