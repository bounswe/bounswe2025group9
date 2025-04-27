import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { createFontStyles } from '../constants/theme';
import PrimaryButton from '../components/common/PrimaryButton';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error } = useAuth();
  const { colors } = useTheme();
  const fonts = createFontStyles(colors);

  const handleLogin = async () => {
    await login(email, password);
  };

  const handleSignUp = () => {
    // Navigate to sign up screen (to be implemented)
    console.log('Navigate to sign up');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Icon name="heart-pulse" size={40} color={colors.accent} />
            <Text style={[styles.logoText, fonts.heading]}>{colors.text !== '#FFFFFF' ? 'NutriHub' : 'NutriHub'}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.welcomeText, fonts.heading]}>Welcome Back</Text>
            <Text style={[styles.subtitleText, fonts.body]}>
              Sign in to your account to continue
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <View style={[styles.passwordInputContainer, { backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title={isLoading ? "" : "Login"}
              onPress={handleLogin}
              fullWidth
              style={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading && <ActivityIndicator color="#FFFFFF" />}
            </PrimaryButton>

            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, fonts.caption]}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={[styles.signUpLink, { color: colors.accent }]}>Sign Up</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoText: {
    marginLeft: SPACING.xs,
  },
  formContainer: {
    width: '100%',
  },
  welcomeText: {
    marginBottom: SPACING.xs,
  },
  subtitleText: {
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: SPACING.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#FF5252',
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: 16,
  },
  eyeIcon: {
    padding: SPACING.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    marginTop: SPACING.md,
    height: 50,
    justifyContent: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;