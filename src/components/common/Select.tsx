import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
  onChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className,
  containerClassName,
  id,
  onChange,
  value,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };

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
      <select
        id={inputId}
        className={clsx(
          'w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50',
          'dark:bg-gray-800 dark:text-white',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
          className
        )}
        onChange={handleChange}
        value={value}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;