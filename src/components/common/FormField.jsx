import React from 'react';
import { useFormContext } from 'react-hook-form';

const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helpText,
  options = [], // For select fields
  rows = 3, // For textarea
  ...props
}) => {
  const formContext = useFormContext();
  
  if (!formContext) {
    console.error('FormField must be used within a FormProvider');
    return null;
  }

  const {
    register,
    formState: { errors = {}, touchedFields = {} } = {},
    watch
  } = formContext;

  const error = errors[name];
  const isTouched = touchedFields[name];
  const hasError = error && isTouched;

  // Get field validation status
  const getFieldClassName = (baseClass) => {
    if (hasError) {
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`;
    }
    if (isTouched && !error) {
      return `${baseClass} border-green-500 focus:border-green-500 focus:ring-green-500`;
    }
    return baseClass;
  };

  const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors duration-200";
  const inputClass = getFieldClassName(`${baseInputClass} ${inputClassName}`);

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            {...register(name)}
            className={inputClass}
            disabled={disabled}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...register(name)}
            className={inputClass}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            {...props}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...register(name)}
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={disabled}
              {...props}
            />
            <label className="ml-2 text-sm text-gray-700">
              {label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  {...register(name)}
                  type="radio"
                  value={option.value}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  disabled={disabled}
                  {...props}
                />
                <label className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            {...register(name)}
            type="file"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            disabled={disabled}
            {...props}
          />
        );

      default:
        return (
          <input
            {...register(name)}
            type={type}
            className={inputClass}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox' || type === 'radio') {
    return (
      <div className={`space-y-1 ${className}`}>
        {renderInput()}
        {helpText && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}
        {hasError && (
          <p className={`text-xs text-red-600 ${errorClassName}`}>
            {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {hasError && (
        <p className={`text-xs text-red-600 ${errorClassName}`}>
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormField;
