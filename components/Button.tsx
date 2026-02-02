
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed theme-transition active:scale-[0.98]';
  
  const variants = {
    // Vibrant glass for primary
    primary: 'bg-primary/90 backdrop-blur-md text-black hover:bg-primary shadow-lg shadow-primary/20 border border-white/20 focus:ring-primary',
    // Muted glass for secondary
    secondary: 'bg-muted-light/60 dark:bg-muted-dark/60 backdrop-blur-md text-textPrimary-light dark:text-textPrimary-dark hover:bg-muted-light/80 dark:hover:bg-muted-dark/80 border border-border-light/50 dark:border-border-dark/50 focus:ring-border-light dark:focus:ring-border-dark',
    // Sheer glass for outline
    outline: 'bg-white/5 backdrop-blur-md border border-border-light dark:border-border-dark text-textPrimary-light dark:text-textPrimary-dark hover:bg-muted-light dark:hover:bg-muted-dark focus:ring-border-light dark:focus:ring-border-dark',
    // Red glass for danger
    danger: 'bg-danger/80 backdrop-blur-md text-white hover:bg-danger shadow-lg shadow-danger/20 border border-white/10 focus:ring-danger'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
