interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  const classes = `${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`;

  return <div className={classes} role="status" aria-label="Loading" />;
}
