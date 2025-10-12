import { renderHook, act } from '@testing-library/react-native';
import useForm from '../src/hooks/useForm';

describe('useForm', () => {
  interface TestForm {
    email: string;
    password: string;
    confirmPassword?: string;
  }

  const initialValues: TestForm = {
    email: '',
    password: '',
  };

  const validationRules = {
    email: [
      { validator: (value: string) => value.length > 0, message: 'Email is required' },
      { validator: (value: string) => /\S+@\S+\.\S+/.test(value), message: 'Email is invalid' },
    ],
    password: [
      { validator: (value: string) => value.length > 0, message: 'Password is required' },
      { validator: (value: string) => value.length >= 6, message: 'Password must be at least 6 characters' },
    ],
    confirmPassword: [
      { 
        validator: (value: string, formValues?: Record<string, any>) => 
          !value || value === formValues?.password, 
        message: 'Passwords must match'
      },
    ],
  };

  it('should initialize with the correct initial values', () => {
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: jest.fn(),
    }));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: jest.fn(),
    }));

    act(() => {
      result.current.handleChange('email')('test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.touched.email).toBe(true);
  });

  it('should mark fields as touched when handleBlur is called', () => {
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: jest.fn(),
    }));

    act(() => {
      result.current.handleBlur('email')();
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should validate fields when validateOnBlur is true', () => {
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: jest.fn(),
      validateOnBlur: true,
    }));

    // Trigger blur on empty email field
    act(() => {
      result.current.handleBlur('email')();
    });

    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.isValid).toBe(false);
  });

  it('should validate fields when validateOnChange is true', () => {
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: jest.fn(),
      validateOnChange: true,
    }));

    // Set invalid email
    act(() => {
      result.current.handleChange('email')('invalid-email');
    });

    expect(result.current.errors.email).toBe('Email is invalid');
    expect(result.current.isValid).toBe(false);

    // Set valid email
    act(() => {
      result.current.handleChange('email')('valid@example.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should validate all fields on form submission', async () => {
    const mockSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: mockSubmit,
    }));

    // Submit with empty values
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check if validation errors are set
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBe('Password is required');
    expect(result.current.isValid).toBe(false);
    expect(result.current.touched.email).toBe(true);
    expect(result.current.touched.password).toBe(true);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with the form values when form is valid', async () => {
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: mockSubmit,
    }));

    // Set valid values
    act(() => {
      result.current.handleChange('email')('test@example.com');
      result.current.handleChange('password')('password123');
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check if onSubmit was called with the right values
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle cross-field validation correctly', async () => {
    const mockSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      initialValues: { ...initialValues, confirmPassword: '' },
      validationRules,
      onSubmit: mockSubmit,
    }));

    // Set different passwords
    act(() => {
      result.current.handleChange('email')('test@example.com');
      result.current.handleChange('password')('password123');
      result.current.handleChange('confirmPassword')('different');
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check if validation error for confirmPassword is set
    expect(result.current.errors.confirmPassword).toBe('Passwords must match');
    expect(mockSubmit).not.toHaveBeenCalled();

    // Set matching passwords
    act(() => {
      result.current.handleChange('confirmPassword')('password123');
    });

    // Submit again
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Now form should be valid and submit should be called
    expect(result.current.errors.confirmPassword).toBeUndefined();
    expect(mockSubmit).toHaveBeenCalled();
  });

  it('should handle submission errors gracefully', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useForm({
      initialValues: { email: 'test@example.com', password: 'password123' },
      validationRules,
      onSubmit: mockSubmit,
    }));

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check that isSubmitting is reset even after error
    expect(result.current.isSubmitting).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));

    consoleSpy.mockRestore();
  });
}); 