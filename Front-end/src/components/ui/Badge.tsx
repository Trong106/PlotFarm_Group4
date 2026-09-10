import React, { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'success',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full font-semibold tracking-wide transition-colors';

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const variants = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40 dark:border-rose-800/40',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/40 dark:border-sky-800/40',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`} />
        </span>
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
