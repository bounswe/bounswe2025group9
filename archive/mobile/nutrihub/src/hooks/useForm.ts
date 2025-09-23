/**
 * Form Hook
 * 
 * A custom hook for managing form state, validation, and submission.
 * 
 * Usage:
 * ```tsx
 * // Define validation rules
 * const validationRules = {
 *   email: [
 *     { validator: (value) => value.length > 0, message: 'Email is required' },
 *     { validator: (value) => /\S+@\S+\.\S+/.test(value), message: 'Email is invalid' }
 *   ],
 *   password: [
 *     { validator: (value) => value.length > 0, message: 'Password is required' },
 *     { validator: (value) => value.length >= 8, message: 'Password must be at least 8 characters' }
 *   ]
 * };
 * 
 * // Initialize form
 * const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, isSubmitting } = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationRules,
 *   onSubmit: async (values) => {
 *     // Submit form
 *     console.log('Form submitted with values:', values);
 *   }
 * });
 * 
 * // Using in a component
 * return (
 *   <View>
 *     <TextInput
 *       value={values.email}
 *       onChangeText={handleChange('email')}
 *       onBlur={handleBlur('email')}
 *       error={touched.email && errors.email}
 *     />
 *     <TextInput
 *       value={values.password}
 *       onChangeText={handleChange('password')}
 *       onBlur={handleBlur('password')}
 *       error={touched.password && errors.password}
 *     />
 *     <Button 
 *       title="Submit" 
 *       onPress={handleSubmit}
 *       disabled={!isValid || isSubmitting}
 *       loading={isSubmitting}
 *     />
 *   </View>
 * );
 * ```
 */

import { useState, useCallback, useEffect } from 'react';

// Type for a validation rule
export interface ValidationRule<T = string> {
  validator: (value: T, formValues?: Record<string, any>) => boolean;
  message: string;
}

// Type for validation rules object
export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule[];
};

// Type for form errors
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// Type for tracking touched fields
export type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

// Props for the useForm hook
interface UseFormProps<T extends Record<string, any>> {
  /**
   * Initial values for the form
   */
  initialValues: T;
  
  /**
   * Validation rules for form fields
   */
  validationRules?: ValidationRules<T>;
  
  /**
   * Function to call when form is submitted and passes validation
   */
  onSubmit: (values: T) => Promise<void> | void;
  
  /**
   * Whether to validate fields on change
   * @default false
   */
  validateOnChange?: boolean;
  
  /**
   * Whether to validate fields on blur
   * @default true
   */
  validateOnBlur?: boolean;
}

/**
 * Custom hook for form management
 */
function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormProps<T>) {
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);
  
  /**
   * Validate a single field
   */
  const validateField = useCallback((name: keyof T, value: any): string | undefined => {
    const fieldRules = validationRules[name];
    
    if (!fieldRules) return undefined;
    
    for (const rule of fieldRules) {
      if (!rule.validator(value, values)) {
        return rule.message;
      }
    }
    
    return undefined;
  }, [validationRules, values]);
  
  /**
   * Validate all fields and update errors state
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let formIsValid = true;
    
    // Validate each field
    Object.keys(initialValues).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });
    
    setErrors(newErrors);
    return formIsValid;
  }, [initialValues, validateField, values]);
  
  /**
   * Update form validity status whenever errors change
   */
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    setIsValid(!hasErrors);
  }, [errors]);
  
  /**
   * Handle change for a field
   */
  const handleChange = useCallback((name: keyof T) => (value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // Mark field as touched
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
    
    // Validate field on change if enabled
    if (validateOnChange) {
      const error = validateField(name, value);
      
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));
    }
  }, [validateOnChange, validateField]);
  
  /**
   * Handle blur for a field
   */
  const handleBlur = useCallback((name: keyof T) => () => {
    // Mark field as touched
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
    
    // Validate field on blur if enabled
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));
    }
  }, [validateOnBlur, validateField, values]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    const allTouched: FormTouched<T> = {};
    Object.keys(initialValues).forEach((key) => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
    
    // Validate form before submission
    const formIsValid = validateForm();
    
    if (formIsValid) {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [initialValues, validateForm, onSubmit, values]);
  
  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  /**
   * Set a specific field value
   */
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // Validate field if it's already been touched
    if (touched[name] && validateOnChange) {
      const error = validateField(name, value);
      
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));
    }
  }, [touched, validateOnChange, validateField]);
  
  /**
   * Set multiple field values at once
   */
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    
    // Validate touched fields
    if (validateOnChange) {
      const newErrors: FormErrors<T> = { ...errors };
      let hasChanges = false;
      
      Object.keys(newValues).forEach((key) => {
        const fieldName = key as keyof T;
        
        if (touched[fieldName]) {
          const error = validateField(fieldName, newValues[fieldName]);
          newErrors[fieldName] = error;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setErrors(newErrors);
      }
    }
  }, [errors, touched, validateOnChange, validateField]);
  
  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldValues,
    validateForm,
  };
}

export default useForm;