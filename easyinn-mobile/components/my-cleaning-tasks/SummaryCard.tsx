import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SummaryCardProps {
  totalTasks: number;
  rushTasksCount: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalTasks, rushTasksCount }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.totalText}>
        Всего задач: <Text style={styles.bold}>{totalTasks}</Text>
      </Text>

      {rushTasksCount > 0 && (
        <View style={styles.rushContainer}>
          <Feather name="zap" size={20} color="#DC2626" style={styles.icon} />
          <Text style={styles.rushText}>
            Срочных: <Text style={styles.bold}>{rushTasksCount}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  totalText: {
    fontSize: 16,
    color: '#1F2937',
  },
  rushContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rushText: {
    fontSize: 16,
    color: '#DC2626',
  },
  bold: {
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 4,
  },
});

export default SummaryCard;
