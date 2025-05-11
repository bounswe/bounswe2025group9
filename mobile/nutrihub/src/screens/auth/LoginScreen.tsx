// src/screens/auth/LoginScreen.tsx
/**
 * LoginScreen
 * 
 * Screen for user authentication integrated with backend API.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth, AuthErrorType } from '../../context/AuthContext';
import useForm from '../../hooks/useForm';
import { isNotEmpty, isValidUsername } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginFormData {
  username: string;
  password: string;
}

/**
 * Login screen component for user authentication
 */
const LoginScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, error: authError, clearError } = useAuth();
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Define form validation rules
  const validationRules = {
    username: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Username is required' 
      },
      { 
        validator: (value: string) => isValidUsername(value), 
        message: 'Username can only contain letters, numbers, underscores, and hyphens' 
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
  } = useForm<LoginFormData>({
    initialValues: { username: '', password: '' },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        await login(formValues);
        // Navigation will be handled automatically by AuthContext
      } catch (error) {
        // Error is handled by the auth context and displayed below
        console.log('Login failed');
      }
    },
  });
  
  // Map authentication error type to user-friendly message
  const getErrorMessage = (): string | null => {
    if (!authError) return null;
    
    switch (authError.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Invalid username or password. Please try again.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Unable to connect to server. Please check your internet connection.';
      case AuthErrorType.VALIDATION_ERROR:
        return authError.message;
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };
  
  // Get form error for a field
  const getFieldError = (field: keyof LoginFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle navigation to forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  // Handle navigation to sign up
  const handleSignUp = () => {
    navigation.navigate('Register');
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
            {/* Username Input */}
            <TextInput
              label="Username"
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              error={getFieldError('username')}
              autoCapitalize="none"
              iconName="account-outline"
              testID="username-input"
              editable={!isSubmitting}
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
              editable={!isSubmitting}
            />
            
            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              testID="forgot-password-button"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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