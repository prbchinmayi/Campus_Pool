import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

export default function SearchRidesScreen() {
  const navigation = useNavigation();
  const [source, setSource]       = useState('');
  const [destination, setDest]    = useState('');
  const [date, setDate]           = useState('');
  const [maxCost, setMaxCost]     = useState('');
  const [rides, setRides]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (source)  params.source      = source;
      if (destination) params.destination = destination;
      if (date)    params.date        = date;
      if (maxCost) params.maxCost     = maxCost;
      const res = await api.get('/rides', { params });
      setRides(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRide = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RequestSeat', { ride: item })}
    >
      <Text style={styles.route}>{item.source} → {item.destination}</Text>
      <Text style={styles.detail}>📅 {item.date}  🕒 {item.departure_time}</Text>
      <Text style={styles.detail}>🚗 {item.driver_name}  |  {item.vehicle_type}: {item.model}</Text>
      <View style={styles.row}>
        <Text style={styles.seats}>💺 {item.available_seats} seats left</Text>
        <Text style={styles.cost}>₹{item.cost_per_seat}/seat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput style={styles.input} placeholder="From (e.g. Panvel)" value={source} onChangeText={setSource} />
        <TextInput style={styles.input} placeholder="To (e.g. Vashi)" value={destination} onChangeText={setDest} />
        <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <TextInput style={styles.input} placeholder="Max cost per seat (₹)" value={maxCost} onChangeText={setMaxCost} keyboardType="numeric" />
        <TouchableOpacity style={styles.btn} onPress={search} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🔍 Search Rides</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.ride_id.toString()}
        renderItem={renderRide}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          searched && !loading
            ? <Text style={styles.empty}>No rides found. Try different filters.</Text>
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f4f6fb' },
  searchBox:  { backgroundColor: '#fff', padding: 16, elevation: 3 },
  input:      { backgroundColor: '#f4f6fb', borderRadius: 8, padding: 11, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#dde3f0' },
  btn:        { backgroundColor: '#1f3864', borderRadius: 10, padding: 13, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '600' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  route:      { fontSize: 16, fontWeight: '700', color: '#1f3864', marginBottom: 6 },
  detail:     { fontSize: 13, color: '#555', marginBottom: 3 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  seats:      { color: '#27ae60', fontWeight: '600' },
  cost:       { color: '#1f3864', fontWeight: '700', fontSize: 15 },
  empty:      { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 14 },
});
