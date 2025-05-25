import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, actions }) => {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg', 
      className
    )}>
      {(title || actions) && (
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;