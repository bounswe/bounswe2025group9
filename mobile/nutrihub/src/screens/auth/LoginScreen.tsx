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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
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
  const { theme, textStyles, themeType } = useTheme();
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
    return authError.message;
  };
  
  // Get form error for a field
  const getFieldError = (field: keyof LoginFormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  // Handle navigation to sign up
  const handleSignUp = () => {
    navigation.navigate('Register');
  };
  
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
              <Icon name="login" size={28} color={themeType === 'light' ? theme.text : "white"} style={styles.cardIcon} />
              <Text style={[styles.cardTitle, textStyles.heading2]}>Login</Text>
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
              
              {/* Login Button */}
              <Button
                title={isSubmitting ? "Signing in..." : "Sign In"}
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  loginButton: {
    marginTop: SPACING.md,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signUpText: {
    opacity: 0.7,
  },
  signUpLink: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;