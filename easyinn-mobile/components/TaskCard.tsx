import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { CleaningTask } from '../lib/types'; // адаптируй путь

interface TaskCardProps {
  task: CleaningTask;
  cardColor: string;
}

// Определение иконки по типу уборки
const getCleaningTypeIcon = (type: string) => {
  switch (type) {
    case 'stayover':
      return <MaterialCommunityIcons name="bed-empty" size={18} color="#6B7280" />;
    case 'departure_cleaning':
      return <Feather name="log-out" size={18} color="#6B7280" />;
    case 'deep_cleaning':
      return <Feather name="sun" size={18} color="#6B7280" />;
    case 'on_demand':
      return <Feather name="bell" size={18} color="#6B7280" />;
    case 'post_renovation_cleaning':
      return <Feather name="tool" size={18} color="#6B7280" />;
    case 'public_area_cleaning':
      return <Entypo name="home" size={18} color="#6B7280" />;
    default:
      return <Feather name="help-circle" size={18} color="#6B7280" />;
  }
};

// Цвет статуса
const getCleaningStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return styles.badgeBlue;
    case 'in_progress':
      return styles.badgeYellow;
    case 'done':
      return styles.badgeGreen;
    default:
      return styles.badgeGray;
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, cardColor }) => {

  // const navigation = useNavigation<any>();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { backgroundColor: cardColor }]}
      onPress={() => router.push(`/housekeeping/${task.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {task.room_number || task.zone_name}
          </Text>
          {task.is_rush && (
            <View style={styles.rushBadge}>
              <Feather name="zap" size={14} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.rushBadgeText}>Срочно</Text>
            </View>
          )}
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, getCleaningStatusColor(task.status)]}>
            <Text style={styles.badgeText}>{task.status_display}</Text>
          </View>
          {getCleaningTypeIcon(task.cleaning_type)}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rushBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  rushBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeBlue: {
    backgroundColor: '#3B82F6',
  },
  badgeYellow: {
    backgroundColor: '#F59E0B',
  },
  badgeGreen: {
    backgroundColor: '#10B981',
  },
  badgeGray: {
    backgroundColor: '#9CA3AF',
  },
});

export default TaskCard;
