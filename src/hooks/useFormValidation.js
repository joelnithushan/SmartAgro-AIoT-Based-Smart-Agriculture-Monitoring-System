import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as validationUtils from '../utils/validationUtils';

// Custom hook for form validation
export const useFormValidation = (schema, options = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const form = useForm({
    resolver: yupResolver(schema),
    mode: options.mode || 'onChange', // 'onChange', 'onBlur', 'onSubmit', 'onTouched', 'all'
    reValidateMode: options.reValidateMode || 'onChange',
    defaultValues: options.defaultValues || {},
    ...options
  });

  const { handleSubmit, formState: { errors, isValid, isDirty, touchedFields }, reset, setValue, watch, getValues } = form;

  // Enhanced submit handler with loading state
  const onSubmit = useCallback(async (data, submitFn) => {
    if (!submitFn) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Sanitize data before submission
      const sanitizedData = validationUtils.sanitizeFormData(data);
      await submitFn(sanitizedData);
    } catch (error) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Field validation helpers
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName]?.message || '';
  }, [errors]);

  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  const isFieldTouched = useCallback((fieldName) => {
    return !!touchedFields[fieldName];
  }, [touchedFields]);

  const getFieldValidationStatus = useCallback((fieldName) => {
    if (!isFieldTouched(fieldName)) return 'default';
    if (hasFieldError(fieldName)) return 'error';
    return 'success';
  }, [isFieldTouched, hasFieldError]);

  const getFieldClassName = useCallback((fieldName, baseClass = '') => {
    const status = getFieldValidationStatus(fieldName);
    const statusClasses = {
      default: '',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
    };
    return `${baseClass} ${statusClasses[status]}`.trim();
  }, [getFieldValidationStatus]);

  // Form state helpers
  const canSubmit = isValid && isDirty && !isSubmitting;
  const hasErrors = Object.keys(errors).length > 0;
  const isFormDirty = isDirty;

  // Reset form with optional new values
  const resetForm = useCallback((newValues = {}) => {
    reset(newValues);
    setSubmitError('');
  }, [reset]);

  // Set field value with validation
  const setFieldValue = useCallback((fieldName, value, options = {}) => {
    setValue(fieldName, value, options);
  }, [setValue]);

  // Watch multiple fields
  const watchFields = useCallback((fieldNames) => {
    if (Array.isArray(fieldNames)) {
      return watch(fieldNames);
    }
    return watch(fieldNames);
  }, [watch]);

  // Get all form values
  const getFormValues = useCallback(() => {
    return getValues();
  }, [getValues]);

  // Validate specific field
  const validateField = useCallback(async (fieldName) => {
    try {
      await form.trigger(fieldName);
      return !hasFieldError(fieldName);
    } catch (error) {
      return false;
    }
  }, [form, hasFieldError]);

  // Validate entire form
  const validateForm = useCallback(async () => {
    try {
      await form.trigger();
      return isValid;
    } catch (error) {
      return false;
    }
  }, [form, isValid]);

  return {
    // Original form object for FormProvider
    ...form,
    
    // Enhanced form methods
    reset: resetForm,
    setValue: setFieldValue,
    watch: watchFields,
    getValues: getFormValues,
    
    // Enhanced form state
    isSubmitting,
    submitError,
    canSubmit,
    hasErrors,
    
    // Field helpers
    getFieldError,
    hasFieldError,
    isFieldTouched,
    getFieldValidationStatus,
    getFieldClassName,
    
    // Validation helpers
    validateField,
    validateForm,
    
    // Enhanced submit
    onSubmit,
  };
};

// Hook for real-time validation
export const useRealTimeValidation = (rules) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value) => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return;

    const fieldErrors = validationUtils.validateField(value, fieldRules);
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors.length > 0 ? fieldErrors[0] : null
    }));
  }, [rules]);

  const handleFieldChange = useCallback((fieldName, value) => {
    validateField(fieldName, value);
  }, [validateField]);

  const handleFieldBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName] || '';
  }, [errors]);

  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  const isFieldTouched = useCallback((fieldName) => {
    return !!touched[fieldName];
  }, [touched]);

  const getFieldValidationStatus = useCallback((fieldName) => {
    if (!isFieldTouched(fieldName)) return 'default';
    if (hasFieldError(fieldName)) return 'error';
    return 'success';
  }, [isFieldTouched, hasFieldError]);

  const getFieldClassName = useCallback((fieldName, baseClass = '') => {
    const status = getFieldValidationStatus(fieldName);
    const statusClasses = {
      default: '',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
    };
    return `${baseClass} ${statusClasses[status]}`.trim();
  }, [getFieldValidationStatus]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    getFieldValidationStatus,
    getFieldClassName,
    resetValidation,
  };
};

// Hook for server-side validation
export const useServerValidation = () => {
  const [serverErrors, setServerErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  const validateOnServer = useCallback(async (data, validationEndpoint) => {
    setIsValidating(true);
    setServerErrors({});

    try {
      const response = await fetch(validationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerErrors(result.errors || {});
        return false;
      }

      return true;
    } catch (error) {
      setServerErrors({ general: 'Server validation failed' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const getServerError = useCallback((fieldName) => {
    return serverErrors[fieldName] || '';
  }, [serverErrors]);

  const hasServerError = useCallback((fieldName) => {
    return !!serverErrors[fieldName];
  }, [serverErrors]);

  const clearServerErrors = useCallback(() => {
    setServerErrors({});
  }, []);

  return {
    serverErrors,
    isValidating,
    validateOnServer,
    getServerError,
    hasServerError,
    clearServerErrors,
  };
};
