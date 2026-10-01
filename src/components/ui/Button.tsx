import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  primary: 'bg-accent text-accent-ink enabled:hover:bg-accent-hover',
  secondary: 'border border-panel-border bg-panel hover:bg-panel-hover',
  danger: 'bg-danger-soft text-danger-soft-text hover:bg-danger-soft-hover',
  ghost: 'bg-transparent',
};
const sizes = {
  sm: 'gap-2.5 rounded-button px-3.75 py-2.75 text-[11px] font-semibold',
  xs: 'gap-2 rounded-button px-2.75 py-2 text-[12px]',
  compact: 'gap-1.25 rounded-[5px] px-1.75 py-1.25 text-[10px]',
  md: 'gap-1.75 rounded-field p-2.5 text-[11px] font-semibold',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
