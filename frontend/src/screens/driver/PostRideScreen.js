import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import api from '../../services/api';

export default function PostRideScreen() {
  const [form, setForm] = useState({
    source: '', destination: '', date: '', departure_time: '',
    total_seats: '', cost_per_seat: '', vehicle_id: ''
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePost = async () => {
    const { source, destination, date, departure_time, total_seats, cost_per_seat, vehicle_id } = form;
    if (!source || !destination || !date || !departure_time || !total_seats || !cost_per_seat || !vehicle_id) {
      return Alert.alert('Error', 'All fields are required');
    }
    setLoading(true);
    try {
      await api.post('/rides', {
        source, destination, date, departure_time,
        total_seats: parseInt(total_seats),
        cost_per_seat: parseFloat(cost_per_seat),
        vehicle_id: parseInt(vehicle_id)
      });
      Alert.alert('Success', 'Ride posted successfully!');
      setForm({ source: '', destination: '', date: '', departure_time: '', total_seats: '', cost_per_seat: '', vehicle_id: '' });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'From (Source)', key: 'source', placeholder: 'e.g. Panvel' },
    { label: 'To (Destination)', key: 'destination', placeholder: 'e.g. Vashi' },
    { label: 'Date (YYYY-MM-DD)', key: 'date', placeholder: '2024-12-01' },
    { label: 'Departure Time (HH:MM)', key: 'departure_time', placeholder: '08:00' },
    { label: 'Total Seats', key: 'total_seats', placeholder: '3', keyboard: 'numeric' },
    { label: 'Cost per Seat (₹)', key: 'cost_per_seat', placeholder: '50', keyboard: 'numeric' },
    { label: 'Vehicle ID', key: 'vehicle_id', placeholder: 'Your vehicle ID from profile', keyboard: 'numeric' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Post a New Ride</Text>

      {fields.map(({ label, key, placeholder, keyboard }) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={form[key]}
            onChangeText={(v) => update(key, v)}
            keyboardType={keyboard || 'default'}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Post Ride</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f4f6fb', flexGrow: 1 },
  heading:   { fontSize: 22, fontWeight: 'bold', color: '#1f3864', marginBottom: 20 },
  label:     { fontSize: 13, color: '#444', marginBottom: 4, fontWeight: '600' },
  input:     { backgroundColor: '#fff', borderRadius: 10, padding: 13, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#dde3f0' },
  btn:       { backgroundColor: '#1f3864', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});
