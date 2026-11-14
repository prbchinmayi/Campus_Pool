import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../services/api';

export default function RequestSeatScreen() {
  const { params: { ride } } = useRoute();
  const navigation = useNavigation();
  const [seats, setSeats]   = useState('1');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    const seatsNum = parseInt(seats);
    if (!seatsNum || seatsNum < 1) {
      return Alert.alert('Error', 'Enter a valid number of seats');
    }
    if (seatsNum > ride.available_seats) {
      return Alert.alert('Error', `Only ${ride.available_seats} seat(s) available`);
    }
    setLoading(true);
    try {
      await api.post('/bookings', { ride_id: ride.ride_id, seats_requested: seatsNum });
      Alert.alert('Request Sent!', 'Your seat request has been submitted. The driver will respond shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.rideCard}>
        <Text style={styles.route}>{ride.source} → {ride.destination}</Text>
        <Text style={styles.detail}>📅 {ride.date}  🕒 {ride.departure_time}</Text>
        <Text style={styles.detail}>🚗 Driver: {ride.driver_name}</Text>
        <Text style={styles.detail}>🚙 {ride.vehicle_type}: {ride.model}</Text>
        <Text style={styles.detail}>💺 Available: {ride.available_seats} seats</Text>
        <Text style={styles.cost}>₹{ride.cost_per_seat} / seat</Text>
      </View>

      <Text style={styles.label}>Number of Seats to Request</Text>
      <TextInput
        style={styles.input}
        value={seats}
        onChangeText={setSeats}
        keyboardType="numeric"
        maxLength={1}
      />

      <Text style={styles.total}>
        Estimated cost: ₹{(parseFloat(ride.cost_per_seat) * (parseInt(seats) || 0)).toFixed(2)}
      </Text>
      <Text style={styles.note}>* Cost sharing is settled outside the app</Text>

      <TouchableOpacity style={styles.btn} onPress={handleRequest} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Request Seat</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 20, backgroundColor: '#f4f6fb', flexGrow: 1 },
  rideCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 24, elevation: 2 },
  route:      { fontSize: 18, fontWeight: '700', color: '#1f3864', marginBottom: 10 },
  detail:     { fontSize: 14, color: '#555', marginBottom: 4 },
  cost:       { fontSize: 20, fontWeight: '800', color: '#2e75b6', marginTop: 10 },
  label:      { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  input:      { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 20, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: '#dde3f0', marginBottom: 12 },
  total:      { fontSize: 16, color: '#1f3864', fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  note:       { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 24 },
  btn:        { backgroundColor: '#1f3864', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
