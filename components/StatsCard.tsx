
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subLabel, icon, color = 'primary' }) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 flex items-center gap-5 hover:border-textMuted-light/20 dark:hover:border-textMuted-dark/20 transition-all group theme-transition">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
        <div className="text-primary">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-textMuted-light dark:text-textMuted-dark font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mt-1">{value}</h2>
          {subLabel && <span className="text-sm text-textMuted-light dark:text-textMuted-dark">{subLabel}</span>}
        </div>
      </div>
    </div>
  );
};
