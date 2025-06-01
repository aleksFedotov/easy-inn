import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RoomSetupScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Setup</Text>
      <Text>This is the Room Setup screen.</Text>
      {/* Add room setup functionality here */}
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

export default RoomSetupScreen;