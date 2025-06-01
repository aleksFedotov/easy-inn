import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CleaningSetupScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cleaning Setup</Text>
      <Text>This is the Cleaning Setup screen.</Text>
      {/* Add cleaning setup functionality here */}
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

export default CleaningSetupScreen;