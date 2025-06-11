import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useAuth,  } from '../../context/AuthContext';
import CleaningTasksSection from '@/components/CleaningTasksSection';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
const DashboardScreen = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  

  const { 
    checkoutTasks, 
    currentTasks, 
    zoneTasks, 
    otherTasks, 
    loading, 
    error, 
    refetch,
  } = useDashboardData(user!);

  if (isAuthLoading || loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        </SafeAreaView>
      );
    }
  
    if (error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Ошибка: {error}</Text>
          </View>
        </SafeAreaView>
      );
    }
  
    if (!user) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Пользователь не найден.</Text>
          </View>
        </SafeAreaView>
      );
    }
  
  

  return (
    <SafeAreaView style={styles.container}>
       <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              refreshControl={
                      <RefreshControl refreshing={loading} onRefresh={refetch} />
              }
          >
        <CleaningTasksSection
                checkoutTasks={checkoutTasks}
                currentTasks={currentTasks}
                zoneTasks={zoneTasks}
                otherTasks={otherTasks}
          />


        </ScrollView>
    </SafeAreaView>
  );
};




const styles = StyleSheet.create({
 container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
  },
});

export default DashboardScreen;

