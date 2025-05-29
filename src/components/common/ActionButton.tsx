import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon; // Cambiar de React.ComponentType a LucideIcon
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'edit' | 'delete';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  children,
  variant = 'primary',
  size = 'md',
  title,
  className = '',
  disabled = false
}) => {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'px-3 py-2',
    lg: 'px-4 py-3'
  };
  
  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  };
  
  const baseClasses = `flex items-center gap-2 rounded transition-colors ${sizeClasses[size]}`;
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    edit: 'text-blue-400 hover:text-blue-300',
    delete: 'text-red-400 hover:text-red-300'
  };

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {Icon && <Icon size={iconSizes[size]} />}
      {children}
    </button>
  );
};

export default ActionButton;