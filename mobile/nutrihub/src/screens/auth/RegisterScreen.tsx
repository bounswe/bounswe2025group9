/**
 * RegisterScreen
 * 
 * Screen for user registration integrated with backend API.
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
import { isEmail, isNotEmpty, minLength, isValidUsername } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterFormData {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Register screen component for user registration
 */
const RegisterScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, error: authError, clearError } = useAuth();
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Define form validation rules
  const validationRules = {
    name: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Name is required' 
      },
      { 
        validator: (value: string) => minLength(value, 2), 
        message: 'Name must be at least 2 characters' 
      },
    ],
    surname: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Surname is required' 
      },
      { 
        validator: (value: string) => minLength(value, 2), 
        message: 'Surname must be at least 2 characters' 
      },
    ],
    username: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Username is required' 
      },
      { 
        validator: (value: string) => minLength(value, 3), 
        message: 'Username must be at least 3 characters' 
      },
      { 
        validator: (value: string) => isValidUsername(value), 
        message: 'Username can only contain letters, numbers, underscores, and hyphens' 
      },
    ],
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
      { 
        validator: (value: string) => minLength(value, 8), 
        message: 'Password must be at least 8 characters' 
      },
    ],
    confirmPassword: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Please confirm your password' 
      },
      { 
        validator: (value: string, formValues?: any) => 
          value === formValues?.password, 
        message: 'Passwords do not match' 
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
  } = useForm<RegisterFormData>({
    initialValues: { 
      name: '',
      surname: '',
      username: '',
      email: '', 
      password: '',
      confirmPassword: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        await register({
          name: formValues.name,
          surname: formValues.surname,
          username: formValues.username,
          email: formValues.email,
          password: formValues.password,
        });
        // Navigation will be handled automatically by AuthContext
      } catch (error) {
        // Error is handled by the auth context and displayed below
        console.log('Registration failed');
      }
    },
  });
  
  // Map authentication error type to user-friendly message
  const getErrorMessage = (): string | null => {
    if (!authError) return null;
    
    switch (authError.type) {
      case AuthErrorType.USER_EXISTS:
        return 'This email or username is already taken. Please choose another.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Unable to connect to server. Please check your internet connection.';
      case AuthErrorType.VALIDATION_ERROR:
        return authError.message;
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };
  
  // Get form error for a field
  const getFieldError = (field: keyof RegisterFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle navigation to login
  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <Icon name="heart-pulse" size={40} color={theme.primary} />
            <Text style={[styles.logoText, textStyles.heading1]}>NutriHub</Text>
          </View>
          
          <Text style={[styles.welcomeText, textStyles.heading2]}>Create Account</Text>
          <Text style={[styles.subtitleText, textStyles.body]}>
            Join our community of healthy eating enthusiasts
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
          
          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Name and Surname Row */}
            <View style={styles.nameRow}>
              {/* Name Input */}
              <View style={styles.nameField}>
                <TextInput
                  label="Name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={getFieldError('name')}
                  iconName="account-outline"
                  testID="name-input"
                  editable={!isSubmitting}
                />
              </View>
              
              {/* Surname Input */}
              <View style={styles.nameField}>
                <TextInput
                  label="Surname"
                  value={values.surname}
                  onChangeText={handleChange('surname')}
                  onBlur={handleBlur('surname')}
                  error={getFieldError('surname')}
                  iconName="account-outline"
                  testID="surname-input"
                  editable={!isSubmitting}
                />
              </View>
            </View>
            
            {/* Username Input */}
            <TextInput
              label="Username"
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              error={getFieldError('username')}
              autoCapitalize="none"
              iconName="at"
              testID="username-input"
              editable={!isSubmitting}
            />
            
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
              helperText="Must be at least 8 characters"
              editable={!isSubmitting}
            />
            
            {/* Confirm Password Input */}
            <TextInput
              label="Confirm Password"
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={getFieldError('confirmPassword')}
              secureTextEntry
              toggleSecureEntry
              iconName="lock-check-outline"
              testID="confirm-password-input"
              editable={!isSubmitting}
            />
            
            {/* Register Button */}
            <Button
              title="Create Account"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              variant="primary"
              size="large"
              style={styles.registerButton}
              testID="register-button"
            />
          </View>
          
          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, textStyles.body]}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={handleNavigateToLogin}
              testID="signin-button"
              disabled={isSubmitting}
            >
              <Text style={[styles.signInLink, { color: theme.primary }]}>Sign In</Text>
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
    paddingVertical: SPACING.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
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
  registerButton: {
    marginTop: SPACING.md,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signInText: {},
  signInLink: {
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  nameField: {
    flex: 1,
  },
});

export default RegisterScreen;