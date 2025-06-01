import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BookingDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Detail</Text>
      <Text>Booking ID: {id}</Text>
      <Button title="Go Back" onPress={() => router.back()} />
      {/* Add booking details here */}
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

export default BookingDetailScreen;