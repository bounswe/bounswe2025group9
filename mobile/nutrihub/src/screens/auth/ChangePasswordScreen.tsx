// src/screens/auth/ChangePasswordScreen.tsx
/**
 * ChangePasswordScreen
 * 
 * Screen for changing password when user is logged in.
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
import { isNotEmpty, minLength } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/types';
import { authService } from '../../services/api/auth.service';
import { useAuth } from '../../context/AuthContext';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Change password screen component
 */
const ChangePasswordScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const { isLoggedIn } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Define form validation rules
  const validationRules = {
    oldPassword: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Current password is required' 
      },
    ],
    newPassword: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'New password is required' 
      },
      { 
        validator: (value: string) => minLength(value, 8), 
        message: 'New password must be at least 8 characters' 
      },
    ],
    confirmNewPassword: [
      { 
        validator: (value: string) => isNotEmpty(value), 
        message: 'Please confirm your new password' 
      },
      { 
        validator: (value: string, formValues?: any) => 
          value === formValues?.newPassword, 
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
    isSubmitting,
    resetForm,
  } = useForm<ChangePasswordFormData>({
    initialValues: { 
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      setApiError(null);
      try {
        await authService.changePassword({
          old_password: formValues.oldPassword,
          new_password: formValues.newPassword,
        });
        setIsSuccess(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
        setApiError(errorMessage);
      }
    },
  });
  
  // Get form error for a field
  const getFieldError = (field: keyof ChangePasswordFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle try again after success
  const handleTryAgain = () => {
    setIsSuccess(false);
    setApiError(null);
    resetForm();
  };
  
  // Handle navigation to login if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
    }
  }, [isLoggedIn, navigation]);
  
  // Render success message
  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: theme.success + '20' }]}>
            <Icon name="check-circle" size={80} color={theme.success} />
          </View>
          
          <Text style={[styles.successTitle, textStyles.heading2]}>Password Changed!</Text>
          
          <Text style={[styles.successText, textStyles.body]}>
            Your password has been successfully changed.
          </Text>
          
          <Card style={styles.infoCard}>
            <Icon name="information-outline" size={20} color={theme.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, textStyles.caption]}>
              For security reasons, you may need to login again on other devices.
            </Text>
          </Card>
          
          <Button
            title="Done"
            onPress={() => navigation.goBack()}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          
          <Button
            title="Change Password Again"
            onPress={handleTryAgain}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
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
            
            <Text style={[styles.titleText, textStyles.heading2]}>Change Password</Text>
            
            <Text style={[styles.descriptionText, textStyles.body]}>
              Please enter your current password and choose a new password.
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
          
          {/* Change Password Form */}
          <View style={styles.formContainer}>
            {/* Current Password Input */}
            <TextInput
              label="Current Password"
              value={values.oldPassword}
              onChangeText={handleChange('oldPassword')}
              onBlur={handleBlur('oldPassword')}
              error={getFieldError('oldPassword')}
              secureTextEntry
              toggleSecureEntry
              iconName="lock-outline"
              testID="old-password-input"
              editable={!isSubmitting}
            />
            
            {/* New Password Input */}
            <TextInput
              label="New Password"
              value={values.newPassword}
              onChangeText={handleChange('newPassword')}
              onBlur={handleBlur('newPassword')}
              error={getFieldError('newPassword')}
              secureTextEntry
              toggleSecureEntry
              iconName="lock-outline"
              helperText="Must be at least 8 characters"
              testID="new-password-input"
              editable={!isSubmitting}
            />
            
            {/* Confirm New Password Input */}
            <TextInput
              label="Confirm New Password"
              value={values.confirmNewPassword}
              onChangeText={handleChange('confirmNewPassword')}
              onBlur={handleBlur('confirmNewPassword')}
              error={getFieldError('confirmNewPassword')}
              secureTextEntry
              toggleSecureEntry
              iconName="lock-check-outline"
              testID="confirm-new-password-input"
              editable={!isSubmitting}
            />
            
            {/* Submit Button */}
            <Button
              title="Change Password"
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
  
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  successIconContainer: {
    width: 160,
    height: 160,
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
    marginBottom: SPACING.xl,
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

export default ChangePasswordScreen;