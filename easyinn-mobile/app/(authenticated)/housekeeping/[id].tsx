import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface HousekeepingTask {
  id: number;
  title: string;
  description: string;
  // ... other properties
}

const HousekeepingDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get the 'id' parameter

  // Simulate fetching task details (replace with your actual API call)
  const task: HousekeepingTask | undefined = {
    id: 1,
    title: 'Clean Room 101',
    description: 'Thoroughly clean room 101. Pay attention to the bathroom and windows.',
  };

  if (!task) {
    return <View><Text>Task not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Details</Text>
      <Text style={styles.taskId}>Task ID: {id}</Text>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text>{task.description}</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskId: {
    fontSize: 16,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default HousekeepingDetailScreen;