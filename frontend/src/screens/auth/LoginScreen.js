import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter email and password');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      await login(res.data.token, res.data.user);
      // Navigation handled automatically by AppNavigator role check
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>🚗 CampusPool</Text>
      <Text style={styles.subtitle}>Ride smarter, together</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f6fb' },
  title:      { fontSize: 32, fontWeight: 'bold', color: '#1f3864', textAlign: 'center', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 32 },
  input:      { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#dde3f0' },
  btn:        { backgroundColor: '#1f3864', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 16 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:       { color: '#2e75b6', textAlign: 'center', fontSize: 14 },
});
