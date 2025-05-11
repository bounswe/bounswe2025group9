/**
 * ForgotPasswordScreen
 * 
 * Screen for password recovery integrated with backend API.
 */

import React, { useState } from 'react';
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
import Card from '../../components/common/Card';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import useForm from '../../hooks/useForm';
import { isEmail, isNotEmpty } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/types';
import { authService } from '../../services/api/auth.service';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordFormData {
  email: string;
}

/**
 * Forgot password screen component for password recovery
 */
const ForgotPasswordScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Define form validation rules
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
  };
  
  // Initialize form with useForm hook
  const { 
    values, 
    errors, 
    touched,
    handleChange, 
    handleBlur, 
    handleSubmit, 
    isSubmitting,
    resetForm,
  } = useForm<ForgotPasswordFormData>({
    initialValues: { email: '' },
    validationRules,
    onSubmit: async (formValues) => {
      setApiError(null);
      try {
        await authService.forgotPassword(formValues.email);
        setSubmittedEmail(formValues.email);
        setIsEmailSent(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
        setApiError(errorMessage);
        
        // Show alert for network errors
        if (errorMessage.includes('network') || errorMessage.includes('Network')) {
          Alert.alert(
            'Network Error',
            'Unable to connect to server. Please check your internet connection.',
            [{ text: 'OK' }]
          );
        }
      }
    },
  });
  
  // Get form error for a field
  const getFieldError = (field: keyof ForgotPasswordFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle navigation to login
  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  // Handle resending email
  const handleResendEmail = () => {
    setIsEmailSent(false);
    setApiError(null);
    resetForm();
  };
  
  // Render success message
  if (isEmailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.successContainer}>
            <View style={[styles.successIconContainer, { backgroundColor: theme.success + '20' }]}>
              <Icon name="email-check" size={64} color={theme.success} />
            </View>
            
            <Text style={[styles.successTitle, textStyles.heading2]}>Check Your Email</Text>
            
            <Text style={[styles.successText, textStyles.body]}>
              We've sent password reset instructions to:
            </Text>
            
            <Text style={[styles.emailText, textStyles.subtitle]}>
              {submittedEmail}
            </Text>
            
            <Card style={styles.infoCard}>
              <Icon name="information-outline" size={20} color={theme.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, textStyles.caption]}>
                If you don't receive an email within 5 minutes, check your spam folder or try again with a different email address.
              </Text>
            </Card>
            
            <Button
              title="Back to Login"
              onPress={handleNavigateToLogin}
              variant="primary"
              fullWidth
              style={styles.button}
            />
            
            <Button
              title="Resend Email"
              onPress={handleResendEmail}
              variant="outline"
              fullWidth
              style={styles.button}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
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
          
          {/* Icon and Title */}
          <View style={styles.headerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="lock-reset" size={48} color={theme.primary} />
            </View>
            
            <Text style={[styles.titleText, textStyles.heading2]}>Reset Password</Text>
            
            <Text style={[styles.descriptionText, textStyles.body]}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>
          
          {/* API Error Message */}
          {apiError && (
            <View style={[
              styles.errorContainer, 
              { 
                backgroundColor: theme.errorContainerBg,
                borderLeftWidth: 3,
                borderLeftColor: theme.error
              }
            ]}>
              <Icon name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.errorMessageText, { color: theme.error }]}>
                {apiError}
              </Text>
            </View>
          )}
          
          {/* Reset Password Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <TextInput
              label="Email Address"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={getFieldError('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="email-outline"
              testID="email-input"
              helperText="Enter the email address associated with your account"
              editable={!isSubmitting}
            />
            
            {/* Submit Button */}
            <Button
              title="Send Reset Instructions"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              variant="primary"
              size="large"
              style={styles.submitButton}
              testID="submit-button"
            />
          </View>
          
          {/* Back to Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, textStyles.body]}>Remember your password? </Text>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  titleText: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorMessageText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  submitButton: {
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
  
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  successText: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emailText: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: SPACING.md,
  },
  infoIcon: {
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
  },
  button: {
    marginBottom: SPACING.md,
  },
});

export default ForgotPasswordScreen;