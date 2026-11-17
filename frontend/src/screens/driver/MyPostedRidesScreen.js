// MyPostedRidesScreen – shows only rides posted by the logged‑in driver
// ---------------------------------------------------------------
// Styling follows the conventions of RideHistoryScreen.
// ---------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { RIDE_STATUS } from '../../utils/constants';

// Colour map for status badges – using the exported constants
const STATUS_COLORS = {
  [RIDE_STATUS.SCHEDULED]: '#2e75b6',
  [RIDE_STATUS.ONGOING]:   '#f0a500',
  [RIDE_STATUS.COMPLETED]: '#27ae60',
  [RIDE_STATUS.CANCELLED]: '#e74c3c',
};

export default function MyPostedRidesScreen() {
  const { user } = useAuth();               // driver ID lives in user.userId
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // Fetch all rides (history endpoint) and keep only the ones the driver owns
  // -----------------------------------------------------------------
  const fetchRides = useCallback(async () => {
    try {
      const res = await api.get('/rides/history');
      // The API returns every ride the user is involved in.
      // Filter to keep only rides where the logged‑in driver is the owner.
      const driverRides = res.data.filter(
        (r) => String(r.driver_id) === String(user?.userId)
      );
      setRides(driverRides);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load rides');
      setRides([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // -----------------------------------------------------------------
  // Render a single ride card
  // -----------------------------------------------------------------
  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.route}>
          {item.source} → {item.destination}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[item.ride_status] },
          ]}
        >
          <Text style={styles.badgeText}>{item.ride_status}</Text>
        </View>
      </View>

      <Text style={styles.detail}>📅 {item.date}  🕒 {item.departure_time}</Text>
      <Text style={styles.detail}>🚗 Cost: ₹{item.cost_per_seat} / seat</Text>

      {/* available_seats may be undefined if the backend omits it – guard safely */}
      {'available_seats' in item && (
        <Text style={styles.detail}>
          Seats left: {item.available_seats}
        </Text>
      )}
    </View>
  );

  // -----------------------------------------------------------------
  // UI states
  // -----------------------------------------------------------------
  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1f3864" />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRides}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.ride_id.toString()}
      renderItem={renderRide}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No posted rides yet.</Text>}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefresh(true);
            fetchRides();
          }}
        />
      }
    />
  );
}

// ---------------------------------------------------------------
// Styles – copied/adjusted from RideHistoryScreen for visual parity
// ---------------------------------------------------------------
const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: '#f4f6fb',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  route: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f3864',
    flex: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    color: '#888',
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f6fb',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#1f3864',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
