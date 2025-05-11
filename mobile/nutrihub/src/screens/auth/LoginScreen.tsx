/**
 * LoginScreen
 * 
 * Screen for user authentication.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth, AuthErrorType, LoginCredentials } from '../../context/AuthContext';
import useForm from '../../hooks/useForm';
import { isEmail, isNotEmpty } from '../../utils/validation';

/**
 * Login screen component for user authentication
 */
const LoginScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const { login, error: authError, clearError } = useAuth();
  
  // Define form validation rules with proper typing
  const validationRules = {
    email: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Email is required' 
      },
      { 
        validator: (value: string) => isEmail(value), 
        message: 'Please enter a valid email address' 
      },
    ],
    password: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Password is required' 
      },
    ],
  };
  
  // Initialize form with useForm hook
  const { 
    values, 
    errors, 
    touched,
    handleChange, 
    handleBlur, 
    handleSubmit, 
    isSubmitting 
  } = useForm<LoginCredentials>({
    initialValues: { email: '', password: '' },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        await login(formValues);
      } catch (error) {
        // Error is handled by the auth context
        console.log('Login error handled by context');
      }
    },
  });
  
  // Map authentication error type to user-friendly message
  const getErrorMessage = (): string | null => {
    if (!authError) return null;
    
    switch (authError.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Unable to connect to server. Please check your internet connection.';
      case AuthErrorType.VALIDATION_ERROR:
        return authError.message;
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };
  
  // Get form error for a field
  const getFieldError = (field: keyof LoginCredentials): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle forgotten password
  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'This feature will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };
  
  // Handle sign up navigation
  const handleSignUp = () => {
    // Navigation would be handled here in a real app
    Alert.alert(
      'Sign Up',
      'The sign up screen will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <Icon name="heart-pulse" size={40} color={theme.primary} />
            <Text style={[styles.logoText, textStyles.heading1]}>NutriHub</Text>
          </View>
          
          <Text style={[styles.welcomeText, textStyles.heading2]}>Welcome Back</Text>
          <Text style={[styles.subtitleText, textStyles.body]}>
            Sign in to your account to continue
          </Text>
          
          {/* Authentication Error Message */}
          {authError && (
            <View style={[
              styles.errorContainer, 
              { 
                backgroundColor: theme.errorContainerBg,
                borderLeftWidth: 3,
                borderLeftColor: theme.error
              }
            ]}>
              <Icon name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {getErrorMessage()}
              </Text>
            </View>
          )}
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={getFieldError('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="email-outline"
              testID="email-input"
            />
            
            {/* Password Input */}
            <TextInput
              label="Password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={getFieldError('password')}
              secureTextEntry
              toggleSecureEntry
              iconName="lock-outline"
              testID="password-input"
            />
            
            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              testID="forgot-password-button"
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            {/* Login Button */}
            <Button
              title="Login"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              variant="primary"
              size="large"
              style={styles.loginButton}
              testID="login-button"
            />
          </View>
          
          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, textStyles.body]}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              testID="signup-button"
            >
              <Text style={[styles.signUpLink, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  logoText: {
    marginLeft: SPACING.sm,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontWeight: '500',
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {},
  signUpLink: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;