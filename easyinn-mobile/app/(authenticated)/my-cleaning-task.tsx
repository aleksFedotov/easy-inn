import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyCleaningTaskScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cleaning Task</Text>
      <Text>This is the screen for a housekeeper cleaning task.</Text>
      {/* Add housekeeper task details here */}
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

export default MyCleaningTaskScreen;