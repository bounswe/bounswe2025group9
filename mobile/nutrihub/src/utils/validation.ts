/**
 * Validation Utilities
 * 
 * A collection of common validation functions for form inputs.
 */

/**
 * Check if a value is empty (undefined, null, or empty string)
 * 
 * @param value - The value to check
 * @returns True if the value is empty, false otherwise
 */
export const isEmpty = (value: any): boolean => {
  return value === undefined || value === null || value === '';
};

/**
 * Check if a value is not empty (not undefined, null, or empty string)
 * 
 * @param value - The value to check
 * @returns True if the value is not empty, false otherwise
 */
export const isNotEmpty = (value: any): boolean => {
  return !isEmpty(value);
};

/**
 * Check if a string is a valid email address
 * 
 * @param value - The string to check
 * @returns True if the string is a valid email address, false otherwise
 */
export const isEmail = (value: string): boolean => {
  if (isEmpty(value)) return false;
  
  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Check if a string has a minimum length
 * 
 * @param value - The string to check
 * @param minLength - The minimum length required
 * @returns True if the string meets the minimum length, false otherwise
 */
export const minLength = (value: string, minLength: number): boolean => {
  if (isEmpty(value)) return false;
  return value.length >= minLength;
};

/**
 * Check if a string has a maximum length
 * 
 * @param value - The string to check
 * @param maxLength - The maximum length allowed
 * @returns True if the string meets the maximum length, false otherwise
 */
export const maxLength = (value: string, maxLength: number): boolean => {
  if (isEmpty(value)) return true; // Empty values pass max length validation
  return value.length <= maxLength;
};

/**
 * Check if a string contains at least one uppercase letter
 * 
 * @param value - The string to check
 * @returns True if the string contains at least one uppercase letter, false otherwise
 */
export const hasUppercase = (value: string): boolean => {
  if (isEmpty(value)) return false;
  return /[A-Z]/.test(value);
};

/**
 * Check if a string contains at least one lowercase letter
 * 
 * @param value - The string to check
 * @returns True if the string contains at least one lowercase letter, false otherwise
 */
export const hasLowercase = (value: string): boolean => {
  if (isEmpty(value)) return false;
  return /[a-z]/.test(value);
};

/**
 * Check if a string contains at least one number
 * 
 * @param value - The string to check
 * @returns True if the string contains at least one number, false otherwise
 */
export const hasNumber = (value: string): boolean => {
  if (isEmpty(value)) return false;
  return /[0-9]/.test(value);
};

/**
 * Check if a string contains at least one special character
 * 
 * @param value - The string to check
 * @returns True if the string contains at least one special character, false otherwise
 */
export const hasSpecialChar = (value: string): boolean => {
  if (isEmpty(value)) return false;
  return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);
};

/**
 * Check if a password is strong enough
 * 
 * @param value - The password to check
 * @param options - Password strength options
 * @returns True if the password is strong enough, false otherwise
 */
export const isStrongPassword = (
  value: string, 
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  } = {}
): boolean => {
  if (isEmpty(value)) return false;
  
  const {
    minLength: passwordMinLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = true,
  } = options;
  
  if (!minLength(value, passwordMinLength)) return false;
  if (requireUppercase && !hasUppercase(value)) return false;
  if (requireLowercase && !hasLowercase(value)) return false;
  if (requireNumber && !hasNumber(value)) return false;
  if (requireSpecialChar && !hasSpecialChar(value)) return false;
  
  return true;
};

/**
 * Check if a string is a valid username (alphanumeric characters, underscores, and hyphens only)
 * 
 * @param value - The string to check
 * @returns True if the string is a valid username, false otherwise
 */
export const isValidUsername = (value: string): boolean => {
  if (isEmpty(value)) return false;
  return /^[a-zA-Z0-9_-]+$/.test(value);
};

/**
 * Check if a number is within a range
 * 
 * @param value - The number to check
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if the number is within the range, false otherwise
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Check if a string matches another string (useful for password confirmation)
 * 
 * @param value - The string to check
 * @param matchValue - The string to match against
 * @returns True if the strings match, false otherwise
 */
export const matches = (value: string, matchValue: string): boolean => {
  return value === matchValue;
};

/**
 * Check if a value is a valid URL
 * 
 * @param value - The string to check
 * @returns True if the string is a valid URL, false otherwise
 */
export const isUrl = (value: string): boolean => {
  if (isEmpty(value)) return false;
  
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a value is a valid phone number (simple)
 * 
 * @param value - The string to check
 * @returns True if the string is a valid phone number, false otherwise
 */
export const isPhoneNumber = (value: string): boolean => {
  if (isEmpty(value)) return false;
  
  // Simple phone validation (at least 7 digits)
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 7;
};