import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function RatingScreen() {
  const { params: { ride } } = useRoute();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // The person being rated is the other party
  const isDriver = user.role === 'driver';
  // If I'm the driver, I rate the rider(s); for simplicity, we rate the other main user
  // In a real app you'd pass the specific reviewed_user_id
  const reviewedUserId = isDriver ? ride.rider_id : ride.driver_id;

  const handleSubmit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating');
    setLoading(true);
    try {
      await api.post('/ratings', {
        ride_id: ride.ride_id,
        reviewed_user_id: reviewedUserId,
        rating,
        comment
      });
      Alert.alert('Thank you!', 'Your rating has been submitted.', [
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
      <Text style={styles.title}>Rate this ride</Text>
      <Text style={styles.subtitle}>{ride.source} → {ride.destination}  |  {ride.date}</Text>

      <Text style={styles.label}>Your Rating</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Share your experience..."
        placeholderTextColor="#999"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Submit Rating</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 24, backgroundColor: '#f4f6fb', flexGrow: 1 },
  title:      { fontSize: 22, fontWeight: '700', color: '#1f3864', marginBottom: 6 },
  subtitle:   { fontSize: 13, color: '#666', marginBottom: 28 },
  label:      { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  stars:      { flexDirection: 'row', marginBottom: 24, gap: 8 },
  star:       { fontSize: 42, color: '#ccc' },
  starActive: { color: '#f0a500' },
  textArea:   { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#dde3f0', height: 100, textAlignVertical: 'top', marginBottom: 24 },
  btn:        { backgroundColor: '#1f3864', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
