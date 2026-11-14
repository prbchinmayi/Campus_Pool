import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const ROLES = ['rider', 'driver'];

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    name: '', college_id: '', email: '', phone: '', password: '', role: 'rider'
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    const { name, college_id, email, phone, password, role } = form;
    if (!name || !college_id || !email || !phone || !password) {
      return Alert.alert('Error', 'All fields are required');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, college_id, email, phone, password, role });
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        {[
          { label: 'Full Name', key: 'name', placeholder: 'e.g. Chinmayi Parab' },
          { label: 'College ID', key: 'college_id', placeholder: 'e.g. 24B-CO-013' },
          { label: 'Email', key: 'email', placeholder: 'your@college.edu', keyboard: 'email-address' },
          { label: 'Phone', key: 'phone', placeholder: '10-digit mobile number', keyboard: 'phone-pad' },
          { label: 'Password', key: 'password', placeholder: 'Min 8 characters', secure: true },
        ].map(({ label, key, placeholder, keyboard, secure }) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#999"
              value={form[key]}
              onChangeText={(v) => update(key, v)}
              keyboardType={keyboard || 'default'}
              autoCapitalize={key === 'email' ? 'none' : 'words'}
              secureTextEntry={!!secure}
            />
          </View>
        ))}

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => update('role', r)}
            >
              <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 24, backgroundColor: '#f4f6fb', flexGrow: 1 },
  title:      { fontSize: 24, fontWeight: 'bold', color: '#1f3864', marginBottom: 20, textAlign: 'center' },
  label:      { fontSize: 13, color: '#444', marginBottom: 4, fontWeight: '600' },
  input:      { backgroundColor: '#fff', borderRadius: 10, padding: 13, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#dde3f0' },
  roleRow:    { flexDirection: 'row', marginBottom: 20, gap: 12 },
  roleBtn:    { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#1f3864', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#1f3864' },
  roleText:   { color: '#1f3864', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  btn:        { backgroundColor: '#1f3864', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 16 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:       { color: '#2e75b6', textAlign: 'center', fontSize: 14 },
});
