import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

const FrontDeskScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Front Desk</Text>
      <Text>This is the Front Desk screen.</Text>
      <Button title="Go to Dashboard" onPress={() => router.push('/dashboard')} />
      {/* Add other relevant navigation or content */}
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

export default FrontDeskScreen;