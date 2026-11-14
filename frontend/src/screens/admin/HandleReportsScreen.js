import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import api from '../../services/api';

export default function HandleReportsScreen() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [modal, setModal]       = useState({ visible: false, reportId: null });
  const [remarks, setRemarks]   = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.filter(r => r.resolution_status === 'open'));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async () => {
    if (!remarks.trim()) return Alert.alert('Error', 'Please enter admin remarks');
    try {
      await api.patch(`/reports/${modal.reportId}/resolve`, { admin_remarks: remarks });
      setModal({ visible: false, reportId: null });
      setRemarks('');
      fetchReports();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderReport = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.reason}>⚠️ {item.reason}</Text>
      <Text style={styles.detail}>Reporter: {item.reporter_name}</Text>
      {item.reported_user_name && (
        <Text style={styles.detail}>Reported User: {item.reported_user_name}</Text>
      )}
      {item.description && <Text style={styles.desc}>{item.description}</Text>}
      <Text style={styles.date}>{new Date(item.report_date).toLocaleDateString()}</Text>
      <TouchableOpacity
        style={styles.resolveBtn}
        onPress={() => setModal({ visible: true, reportId: item.report_id })}
      >
        <Text style={styles.resolveBtnText}>Resolve</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.report_id.toString()}
        renderItem={renderReport}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No open reports. 🎉</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchReports(); }} />}
      />

      <Modal visible={modal.visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Resolve Report</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your remarks / resolution decision..."
              placeholderTextColor="#999"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>Confirm Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal({ visible: false, reportId: null })}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list:         { padding: 16, backgroundColor: '#f4f6fb', flexGrow: 1 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  reason:       { fontSize: 15, fontWeight: '700', color: '#c0392b', marginBottom: 6 },
  detail:       { fontSize: 13, color: '#555', marginBottom: 2 },
  desc:         { fontSize: 13, color: '#777', fontStyle: 'italic', marginTop: 6 },
  date:         { fontSize: 11, color: '#aaa', marginTop: 6 },
  resolveBtn:   { marginTop: 12, backgroundColor: '#1f3864', borderRadius: 8, padding: 10, alignItems: 'center' },
  resolveBtnText:{ color: '#fff', fontWeight: '600' },
  empty:        { textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#1f3864', marginBottom: 14 },
  textArea:     { backgroundColor: '#f4f6fb', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#dde3f0', height: 100, textAlignVertical: 'top', marginBottom: 14 },
  cancelBtn:    { marginTop: 10, alignItems: 'center' },
  cancelText:   { color: '#888', fontSize: 14 },
});
