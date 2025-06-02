import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth,  } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const DashboardScreen = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome, {user?.username}!</Text>
      <Button title="Logout" onPress={logout} />
      <Button title="Go to Front Desk" onPress={() => router.push('/front-desk')} />
      <Button title="Go to Users" onPress={() => router.push('/users')} />
      {/* Add other navigation buttons as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default DashboardScreen;