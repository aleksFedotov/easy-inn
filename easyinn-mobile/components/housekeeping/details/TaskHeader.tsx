import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { CleaningTask } from '@/lib/types';

interface TaskHeaderProps {
  task: CleaningTask;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => (
  <View style={styles.container}>
    <View style={styles.titleContainer}>
      <Text style={styles.title}>
        Задача уборки: {task.room_number || task.zone_name || "Общая"}
      </Text>
      {task.is_rush && (
        <View style={styles.badge}>
          <Flame size={16} color="white" style={styles.flameIcon} />
          <Text style={styles.badgeText}>СРОЧНО</Text>
        </View>
      )}
    </View>
    <Text style={styles.description}>
      Подробная информация о задаче.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 16,
  },
  flameIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
});