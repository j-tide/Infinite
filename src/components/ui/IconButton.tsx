import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const sizes = {
  xs: 'flex p-0.75',
  sm: 'flex rounded-badge p-1',
  canvas: 'grid h-7.25 w-7.5 place-items-center rounded-field',
};
interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  size?: keyof typeof sizes;
}

export function IconButton({
  label,
  size = 'sm',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn('bg-transparent', sizes[size], className)}
      {...props}
    />
  );
}
