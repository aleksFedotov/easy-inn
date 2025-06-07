import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useCleaningTasks } from '@/hooks/ready-for-check/useCleaningTasks';
import { useTaskSorting } from '@/hooks/ready-for-check/useTaskSorting';

import EmptyTasksState from '@/components/ready-for-check/EmptyTasksState';
import TasksGrid from '@/components/ready-for-check/TasksGrid';

const ReadyForCheckScreen: React.FC = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { tasks, loading, error, fetchTasks } = useCleaningTasks();
  const sortedTasks = useTaskSorting(tasks);

  useFocusEffect(
      useCallback(() => {
        fetchTasks(); 
      }, [fetchTasks])
    );
  
  if (isAuthLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Пользователь не найден.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ошибка: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchTasks} />
      }
    >
      <Text style={styles.title}>Задачи, готовые к проверке</Text>

      {sortedTasks.length > 0 && (
        <Text style={styles.subTitle}>Найдено задач: {sortedTasks.length}</Text>
      )}

      {sortedTasks.length > 0 ? (
        <TasksGrid tasks={sortedTasks} />
      ) : (
        <EmptyTasksState />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
});

export default ReadyForCheckScreen;
