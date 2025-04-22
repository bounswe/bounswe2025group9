import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Basic type for navigation prop - replace 'any' with specific types later
const LoginScreen = ({ navigation }: { navigation: any }) => {
  const handleLogin = () => {
    // TODO: Implement actual login logic
    // For now, just navigate to the main app part
    // This navigation logic will be handled by state management later
    console.log('Login Pressed (Simulated)');
    // Example: navigation.navigate('MainApp'); // We'll set this up
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Login Screen</Text>
        {/* Add TextInput components for email/password later */}
        <Button title="Log In (Simulated)" onPress={handleLogin} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
});

export default LoginScreen;