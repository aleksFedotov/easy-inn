import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router'; // Import Link

interface HousekeepingTask {
  id: number;
  title: string;
  description: string;
  // ... other properties
}

const HousekeepingListScreen = () => {
  const tasks: HousekeepingTask[] = [
    { id: 1, title: 'Clean Room 101', description: 'Thoroughly clean room 101.' },
    { id: 2, title: 'Change Linens 202', description: 'Replace all linens in room 202.' },
    // ... more tasks
  ];

  const renderItem = ({ item }: { item: HousekeepingTask }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Link href={{ pathname: "/(authenticated)/housekeeping/[id]", params: { id: item.id.toString() } }}>
        <Text style={styles.taskLink}>View Details</Text>
      </Link>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Housekeeping Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskItem: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskLink: {
    color: 'blue',
    marginTop: 8,
  },
});

export default HousekeepingListScreen;