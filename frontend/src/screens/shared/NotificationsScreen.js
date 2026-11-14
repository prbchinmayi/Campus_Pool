import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/notifications/mine');
      setNotifications(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === id ? { ...n, read_status: true } : n)
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read_status && styles.unread]}
      onPress={() => !item.read_status && markRead(item.notification_id)}
    >
      {!item.read_status && <View style={styles.dot} />}
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.time}>{new Date(item.created_time).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''} — tap to mark read</Text>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notification_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchNotifs(); }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f4f6fb' },
  banner:     { backgroundColor: '#2e75b6', padding: 10, alignItems: 'center' },
  bannerText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list:       { padding: 16, flexGrow: 1 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, flexDirection: 'row', flexWrap: 'wrap' },
  unread:     { borderLeftWidth: 4, borderLeftColor: '#2e75b6', backgroundColor: '#eaf3ff' },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2e75b6', marginRight: 8, marginTop: 6 },
  message:    { fontSize: 14, color: '#333', flex: 1 },
  time:       { fontSize: 11, color: '#888', marginTop: 6, width: '100%' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 },
});
