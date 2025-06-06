import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useCleaningTasks } from '@/hooks/my-cleaning-tasks/useMyCleaningTasks';
import { useSortedTasks } from '@/hooks/my-cleaning-tasks/useSortedTasks';
import { useChecklistSummary } from '@/hooks/my-cleaning-tasks/useChecklistSummary';

import DatePickerModal from '@/components/DatePickerModal';
import CleaningTasksSection from '@/components/CleaningTasksSection';
import ChecklistSummaryCollapsible from '@/components/my-cleaning-tasks/ChecklistSummaryCollapsible';
import SummaryCard from '@/components/my-cleaning-tasks/SummaryCard';

const MyCleaningTasksScreen: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const { tasks: allTasks, isLoading: loading, error } = useCleaningTasks(user, selectedDate);
  const {
    sortedCheckoutTasks,
    sortedCurrentTasks,
    sortedZoneTasks,
    sortedOtherTasks,
  } = useSortedTasks(allTasks);



  const totalTasks = useMemo(() => allTasks.length, [allTasks]);
  const rushTasksCount = useMemo(
    () => allTasks.filter(task => task.is_rush).length,
    [allTasks]
  );

  const { checklistSummary, sortedChecklistSummaryKeys } = useChecklistSummary(allTasks);

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

  const handleDatePress = () => {
    setIsDatePickerVisible(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Мои задачи</Text>

          <View style={styles.datePickerContainer}>
            <TouchableOpacity style={styles.datePickerButton} onPress={handleDatePress}>
              <Text style={styles.datePickerButtonText}>
                {selectedDate ? selectedDate.toLocaleDateString('ru-RU') : 'Выберите дату'}
              </Text>
            </TouchableOpacity>
          </View>

          <SummaryCard totalTasks={totalTasks} rushTasksCount={rushTasksCount} />

          <ChecklistSummaryCollapsible
            isOpen={isSummaryOpen}
            onToggle={setIsSummaryOpen}
            checklistSummary={checklistSummary}
            sortedKeys={sortedChecklistSummaryKeys}
          />

          <CleaningTasksSection
            checkoutTasks={sortedCheckoutTasks}
            currentTasks={sortedCurrentTasks}
            zoneTasks={sortedZoneTasks}
            otherTasks={sortedOtherTasks}
          />
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        date={selectedDate || new Date()}
        onSelect={handleDateSelect}
        onCancel={() => setIsDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
  datePickerContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  datePickerButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default MyCleaningTasksScreen;
