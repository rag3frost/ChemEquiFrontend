
import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  return (
    <div className={`relative h-3 w-full overflow-hidden rounded-full bg-muted-light dark:bg-muted-dark theme-transition ${className}`}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(230,247,106,0.4)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
};
