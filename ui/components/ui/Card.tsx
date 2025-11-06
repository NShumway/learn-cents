import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted';
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseClasses = 'rounded-lg p-6';

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    highlighted: 'bg-blue-50 border border-blue-200 shadow-sm',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return <div className={classes}>{children}</div>;
}
