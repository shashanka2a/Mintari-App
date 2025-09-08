import React from 'react';

interface SparkleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

export const Sparkle: React.FC<SparkleProps> = ({ 
  className = '', 
  size = 'md',
  delay = 0 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg', 
    lg: 'text-xl'
  };

  return (
    <span 
      className={`absolute animate-pulse text-mintari-lav ${sizeClasses[size]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      role="img"
      aria-label="Sparkle decoration"
    >
      ✨
    </span>
  );
};

export default Sparkle;
