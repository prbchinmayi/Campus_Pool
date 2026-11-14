import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLORS = {
  scheduled: '#2e75b6', ongoing: '#f0a500', completed: '#27ae60', cancelled: '#e74c3c'
};

export default function RideHistoryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [rides, setRides]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/rides/history');
      setRides(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.route}>{item.source} → {item.destination}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.ride_status] }]}>
          <Text style={styles.badgeText}>{item.ride_status}</Text>
        </View>
      </View>
      <Text style={styles.detail}>📅 {item.date}  🕒 {item.departure_time}</Text>
      <Text style={styles.detail}>🚗 Driver: {item.driver_name}</Text>
      <Text style={styles.detail}>₹{item.cost_per_seat} / seat</Text>

      {item.ride_status === 'completed' && (
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={() => navigation.navigate('Rating', { ride: item })}
        >
          <Text style={styles.rateBtnText}>⭐ Rate this ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.ride_id.toString()}
      renderItem={renderRide}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No ride history yet.</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchHistory(); }} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list:     { padding: 16, backgroundColor: '#f4f6fb', flexGrow: 1 },
  card:     { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  route:    { fontSize: 16, fontWeight: '700', color: '#1f3864', flex: 1 },
  badge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText:{ color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  detail:   { fontSize: 13, color: '#555', marginBottom: 3 },
  rateBtn:  { marginTop: 10, backgroundColor: '#fff3cd', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f0a500' },
  rateBtnText: { color: '#856404', fontWeight: '600' },
  empty:    { textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 },
});
