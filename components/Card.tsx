
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '', headerAction }) => {
  return (
    <div className={`bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 theme-transition ${className}`}>
      {(title || headerAction) && (
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div>
            {title && <h3 className="text-base sm:text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-textMuted-light dark:text-textMuted-dark mt-0.5 sm:mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
