import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../services/api';

const STATUS_COLOR = { pending: '#f0a500', accepted: '#27ae60', rejected: '#e74c3c' };

export default function ManageRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/bookings/mine');
      setRequests(res.data.filter(r => r.request_status === 'pending'));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const respond = async (requestId, action) => {
    try {
      await api.patch(`/bookings/${requestId}/respond`, { action });
      Alert.alert('Done', `Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
      fetchRequests();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.riderName}>{item.rider_name}</Text>
      <Text style={styles.detail}>📞 {item.rider_phone}</Text>
      <Text style={styles.detail}>🚗 To: {item.destination}  |  📅 {item.date}</Text>
      <Text style={styles.detail}>Seats requested: {item.seats_requested}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => respond(item.request_id, 'accept')}>
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => respond(item.request_id, 'reject')}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.request_id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No pending seat requests.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} />}
    />
  );
}

const styles = StyleSheet.create({
  list:       { padding: 16, backgroundColor: '#f4f6fb', flexGrow: 1 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  riderName:  { fontSize: 17, fontWeight: '700', color: '#1f3864', marginBottom: 6 },
  detail:     { fontSize: 14, color: '#555', marginBottom: 3 },
  row:        { flexDirection: 'row', marginTop: 12, gap: 10 },
  btn:        { flex: 1, padding: 11, borderRadius: 8, alignItems: 'center' },
  acceptBtn:  { backgroundColor: '#27ae60' },
  rejectBtn:  { backgroundColor: '#e74c3c' },
  btnText:    { color: '#fff', fontWeight: '600' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 },
});
