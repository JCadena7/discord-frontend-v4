import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  containerClassName,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('mb-4', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50',
          'dark:bg-gray-800 dark:text-white',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;