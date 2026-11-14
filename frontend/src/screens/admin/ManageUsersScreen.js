import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../services/api';

const ROLE_COLOR = { admin: '#8e44ad', driver: '#2e75b6', rider: '#27ae60' };
const STATUS_COLOR = { active: '#27ae60', suspended: '#e74c3c' };

export default function ManageUsersScreen() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSuspend = async (user) => {
    const action = user.account_status === 'active' ? 'suspend' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${user.user_id}/suspend`, { action });
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.college_id}  |  {item.email}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: ROLE_COLOR[item.role] }]}>
          <Text style={styles.badgeText}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.row2}>
        <Text style={[styles.status, { color: STATUS_COLOR[item.account_status] }]}>
          ● {item.account_status}
        </Text>
        {item.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.btn, item.account_status === 'active' ? styles.suspendBtn : styles.activateBtn]}
            onPress={() => toggleSuspend(item)}
          >
            <Text style={styles.btnText}>
              {item.account_status === 'active' ? 'Suspend' : 'Activate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.user_id.toString()}
      renderItem={renderUser}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchUsers(); }} />}
    />
  );
}

const styles = StyleSheet.create({
  list:       { padding: 16, backgroundColor: '#f4f6fb', flexGrow: 1 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  row2:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:       { fontSize: 16, fontWeight: '700', color: '#1f3864' },
  meta:       { fontSize: 12, color: '#666', marginTop: 2 },
  badge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:  { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  status:     { fontSize: 13, fontWeight: '600' },
  btn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  suspendBtn: { backgroundColor: '#e74c3c' },
  activateBtn:{ backgroundColor: '#27ae60' },
  btnText:    { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty:      { textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 },
});
