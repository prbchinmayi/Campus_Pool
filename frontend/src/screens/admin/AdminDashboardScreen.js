import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../services/api';

export default function AdminDashboardScreen() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchAnalytics(); }} />}
    >
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.row}>
        <View style={[styles.card, styles.blueCard]}>
          <Text style={styles.cardNum}>{analytics?.total_rides ?? 0}</Text>
          <Text style={styles.cardLabel}>Total Rides</Text>
        </View>
        <View style={[styles.card, styles.greenCard]}>
          <Text style={styles.cardNum}>{analytics?.active_users ?? 0}</Text>
          <Text style={styles.cardLabel}>Active Users</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>🔥 Popular Routes</Text>
      {(analytics?.popular_routes ?? []).map((route, i) => (
        <View key={i} style={styles.routeCard}>
          <Text style={styles.routeText}>{route.source} → {route.destination}</Text>
          <Text style={styles.routeCount}>{route.ride_count} rides</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, backgroundColor: '#f4f6fb', flexGrow: 1 },
  heading:      { fontSize: 24, fontWeight: '700', color: '#1f3864', marginBottom: 20 },
  row:          { flexDirection: 'row', gap: 14, marginBottom: 24 },
  card:         { flex: 1, borderRadius: 14, padding: 20, alignItems: 'center', elevation: 3 },
  blueCard:     { backgroundColor: '#1f3864' },
  greenCard:    { backgroundColor: '#27ae60' },
  cardNum:      { fontSize: 36, fontWeight: '800', color: '#fff' },
  cardLabel:    { fontSize: 13, color: '#dde3f0', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12 },
  routeCard:    { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  routeText:    { fontSize: 14, color: '#333', fontWeight: '600' },
  routeCount:   { fontSize: 14, color: '#2e75b6', fontWeight: '700' },
});
