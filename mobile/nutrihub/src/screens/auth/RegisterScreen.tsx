// src/screens/auth/RegisterScreen.tsx
/**
 * RegisterScreen
 * 
 * Screen for user registration integrated with backend API.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import Card from '../../components/common/Card';
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
  const { theme, textStyles, themeType } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, error: authError, clearError } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
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
        const result = await register({
          name: formValues.name,
          surname: formValues.surname,
          username: formValues.username,
          email: formValues.email,
          password: formValues.password,
        });
        
        // Show success message
        setRegistrationSuccess(true);
        setSuccessMessage(result.message || 'Registration successful! Please login with your credentials.');
        
        // Navigate to login after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } catch (error) {
        // Error is handled by the auth context and displayed below
        console.log('Registration failed');
      }
    },
  });
  
  // Get password criteria status
  const passwordCriteria = {
    minLength: values.password.length >= 8,
    hasUppercase: /[A-Z]/.test(values.password),
    hasLowercase: /[a-z]/.test(values.password),
    hasNumber: /\d/.test(values.password),
    passwordsMatch: values.password === values.confirmPassword && values.confirmPassword !== ''
  };

  // Check if all password criteria are met
  const allCriteriaMet = Object.values(passwordCriteria).every(criteria => criteria);
  
  // Map authentication error type to user-friendly message
  const getErrorMessage = (): string | null => {
    if (!authError) return null;
    return authError.message;
  };
  
  // Get form error for a field
  const getFieldError = (field: keyof RegisterFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle navigation to login
  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Criteria icon
  const criteriaIcon = (met: boolean) => {
    return met ? (
      <Icon name="check" size={16} weight="bold" color={theme.success} />
    ) : (
      <Icon name="close" size={16} weight="bold" color={theme.error} />
    );
  };
  
  // Render success screen
  if (registrationSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeType === 'light' ? '#0d7c5f' : theme.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: theme.success + '20' }]}>
            <Icon name="check-circle" size={80} color={theme.success} />
          </View>
          
          <Text style={[styles.successTitle, textStyles.heading2]}>{t('auth.registrationSuccess')}</Text>
          
          <Text style={[styles.successMessage, textStyles.body]}>
            {successMessage || t('auth.registrationSuccessMessage')}
          </Text>
          
          <Text style={[styles.redirectingText, textStyles.caption]}>
            {t('auth.redirectingToLogin')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeType === 'light' ? '#0d7c5f' : theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTextNutri, textStyles.heading1, { color: 'white', fontFamily: 'Poppins_400Regular' }]}>
                Nutri
              </Text>
              <Text style={[styles.logoTextHub, textStyles.heading1, { color: 'white', fontFamily: 'Poppins_900Black' }]}>
                Hub
              </Text>
            </View>
          </View>
          
          <View style={[styles.cardContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Icon name="account-plus" size={28} color={themeType === 'light' ? theme.text : "white"} style={styles.cardIcon} />
              <Text style={[styles.cardTitle, textStyles.heading2]}>{t('auth.signUp')}</Text>
            </View>
            
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
                <View style={styles.nameColumn}>
                  <TextInput
                    label={t('auth.firstName')}
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    error={getFieldError('name')}
                    iconName="account-outline"
                    testID="name-input"
                    editable={!isSubmitting}
                    containerStyle={styles.nameInput}
                  />
                </View>
                
                <View style={styles.nameColumn}>
                  <TextInput
                    label={t('auth.lastName')}
                    value={values.surname}
                    onChangeText={handleChange('surname')}
                    onBlur={handleBlur('surname')}
                    error={getFieldError('surname')}
                    iconName="account-outline"
                    testID="surname-input"
                    editable={!isSubmitting}
                    containerStyle={styles.nameInput}
                  />
                </View>
              </View>
              
              <TextInput
                label={t('auth.email')}
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
              
              <TextInput
                label={t('auth.username')}
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                error={getFieldError('username')}
                autoCapitalize="none"
                iconName="account-outline"
                testID="username-input"
                editable={!isSubmitting}
              />
              
              <TextInput
                label={t('auth.password')}
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={getFieldError('password')}
                secureTextEntry={!passwordVisible}
                toggleSecureEntry
                iconName="lock-outline"
                testID="password-input"
                editable={!isSubmitting}
              />
              
              {/* Password criteria */}
              {values.password.length > 0 && (
                <View style={[styles.criteriaCont, {
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.border
                }]}>
                  <Text style={[styles.criteriaTitle, { color: theme.text }]}>{t('auth.passwordMustHave')}</Text>
                  <View style={styles.criteriaList}>
                    <View style={styles.criteriaItem}>
                      {criteriaIcon(passwordCriteria.minLength)}
                      <Text style={[styles.criteriaText, { color: theme.text }]}>
                        {t('auth.atLeast8Chars')}
                      </Text>
                    </View>
                    
                    <View style={styles.criteriaItem}>
                      {criteriaIcon(passwordCriteria.hasUppercase)}
                      <Text style={[styles.criteriaText, { color: theme.text }]}>
                        {t('auth.atLeastOneUppercase')}
                      </Text>
                    </View>
                    
                    <View style={styles.criteriaItem}>
                      {criteriaIcon(passwordCriteria.hasLowercase)}
                      <Text style={[styles.criteriaText, { color: theme.text }]}>
                        {t('auth.atLeastOneLowercase')}
                      </Text>
                    </View>
                    
                    <View style={styles.criteriaItem}>
                      {criteriaIcon(passwordCriteria.hasNumber)}
                      <Text style={[styles.criteriaText, { color: theme.text }]}>
                        {t('auth.atLeastOneNumber')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              <TextInput
                label={t('auth.confirmPassword')}
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={getFieldError('confirmPassword')}
                secureTextEntry={!confirmPasswordVisible}
                toggleSecureEntry
                iconName="lock-outline"
                testID="confirm-password-input"
                editable={!isSubmitting}
              />
              
              {values.confirmPassword.length > 0 && (
                <View style={styles.passwordMatchContainer}>
                  {criteriaIcon(passwordCriteria.passwordsMatch)}
                  <Text style={[
                    styles.passwordMatchText, 
                    { color: passwordCriteria.passwordsMatch ? theme.success : theme.error }
                  ]}>
                    {passwordCriteria.passwordsMatch ? t('auth.passwordsMatch') : t('auth.passwordsDoNotMatch')}
                  </Text>
                </View>
              )}
              
              <Button
                title={t('auth.createAccount')}
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
            
            <View style={styles.loginLinkContainer}>
              <Text style={[styles.loginLinkText, textStyles.body]}>{t('auth.hasAccount')} </Text>
              <TouchableOpacity 
                onPress={handleNavigateToLogin}
                testID="login-link-button"
                disabled={isSubmitting}
              >
                <Text style={[styles.loginLink, { color: theme.primary }]}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
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
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
    marginRight: SPACING.sm,
  },
  logoTextContainer: {
    flexDirection: 'row',
  },
  logoTextNutri: {
    fontWeight: 'normal',
  },
  logoTextHub: {
    fontWeight: '900',
  },
  cardContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardIcon: {
    marginRight: SPACING.sm,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameColumn: {
    width: '48%',
  },
  nameInput: {
    marginBottom: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  criteriaCont: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  criteriaTitle: {
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  criteriaList: {
    marginTop: SPACING.xs,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  criteriaText: {
    marginLeft: SPACING.sm,
    fontSize: 12,
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  passwordMatchText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginLinkText: {
    opacity: 0.7,
  },
  loginLink: {
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  redirectingText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default RegisterScreen;