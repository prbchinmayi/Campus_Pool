import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Driver screens
import PostRideScreen       from '../screens/driver/PostRideScreen';
import ManageRequestsScreen from '../screens/driver/ManageRequestsScreen';

// Rider screens
import SearchRidesScreen  from '../screens/rider/SearchRidesScreen';
import RequestSeatScreen  from '../screens/rider/RequestSeatScreen';

// Shared screens
import RideHistoryScreen    from '../screens/shared/RideHistoryScreen';
import RatingScreen         from '../screens/shared/RatingScreen';
import NotificationsScreen  from '../screens/shared/NotificationsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageUsersScreen    from '../screens/admin/ManageUsersScreen';
import HandleReportsScreen  from '../screens/admin/HandleReportsScreen';

const Stack  = createStackNavigator();
const Tab    = createBottomTabNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#1f3864' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

// ── Auth Stack ──────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="Login"    component={LoginScreen}    options={{ title: 'CampusPool — Login' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

// ── Driver Tabs ─────────────────────────────────────────────
const DriverStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="PostRide"       component={PostRideScreen}       options={{ title: 'Post a Ride' }} />
    <Stack.Screen name="ManageRequests" component={ManageRequestsScreen} options={{ title: 'Seat Requests' }} />
    <Stack.Screen name="RideHistory"    component={RideHistoryScreen}    options={{ title: 'My Rides' }} />
    <Stack.Screen name="Notifications"  component={NotificationsScreen}  options={{ title: 'Notifications' }} />
    <Stack.Screen name="Rating"         component={RatingScreen}         options={{ title: 'Rate Rider' }} />
  </Stack.Navigator>
);

const DriverTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1f3864' }}>
    <Tab.Screen name="PostRideTab"    component={DriverStack}    options={{ title: 'Post Ride' }} />
    <Tab.Screen name="RequestsTab"    component={ManageRequestsScreen} options={{ title: 'Requests' }} />
    <Tab.Screen name="HistoryTab"     component={RideHistoryScreen}    options={{ title: 'History' }} />
    <Tab.Screen name="NotifTab"       component={NotificationsScreen}  options={{ title: 'Notifications' }} />
  </Tab.Navigator>
);

// ── Rider Tabs ──────────────────────────────────────────────
const RiderStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="SearchRides"  component={SearchRidesScreen}  options={{ title: 'Find a Ride' }} />
    <Stack.Screen name="RequestSeat"  component={RequestSeatScreen}  options={{ title: 'Request Seat' }} />
    <Stack.Screen name="RideHistory"  component={RideHistoryScreen}  options={{ title: 'My Rides' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="Rating"       component={RatingScreen}       options={{ title: 'Rate Driver' }} />
  </Stack.Navigator>
);

const RiderTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1f3864' }}>
    <Tab.Screen name="SearchTab"  component={RiderStack}         options={{ title: 'Search' }} />
    <Tab.Screen name="HistoryTab" component={RideHistoryScreen}  options={{ title: 'History' }} />
    <Tab.Screen name="NotifTab"   component={NotificationsScreen} options={{ title: 'Notifications' }} />
  </Tab.Navigator>
);

// ── Admin Tabs ──────────────────────────────────────────────
const AdminTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1f3864' }}>
    <Tab.Screen name="Dashboard"  component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="Users"      component={ManageUsersScreen}    options={{ title: 'Users' }} />
    <Tab.Screen name="Reports"    component={HandleReportsScreen}  options={{ title: 'Reports' }} />
  </Tab.Navigator>
);

// ── Root Navigator ──────────────────────────────────────────
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1f3864" />
      </View>
    );
  }

  const getNavigator = () => {
    if (!user) return <AuthStack />;
    if (user.role === 'admin')  return <AdminTabs />;
    if (user.role === 'driver') return <DriverTabs />;
    return <RiderTabs />;
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;
