import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    Building,
    FileText,
    User as UserIcon, 
    BookOpen,
    Clock,
    ClipboardList,
    CircleDotDashed,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CleaningTask } from '@/lib/types';
import getCleaningStatusColor from '@/lib/GetCLeaningStatusColor';

interface TaskInfoProps {
  task: CleaningTask;
}

export const TaskInfo: React.FC<TaskInfoProps> = ({ task }) => {
    const statusColors = getCleaningStatusColor(task.status);
    
    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <FileText size={20} color="#374151" style={styles.headerIcon} />
                    <Text style={styles.sectionTitle}>Детали</Text>
                </View>
                
                <View style={styles.detailsList}>
                    <View style={styles.detailItem}>
                        <Building size={16} color="#6b7280" style={styles.detailIcon} />
                        <Text style={styles.detailText}>
                            {task.room_number ? `Комната: ${task.room_number}` : `Зона: ${task.zone_name}`}
                        </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                        <BookOpen size={16} color="#6b7280" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Тип уборки: {task.cleaning_type_display}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                        <UserIcon size={16} color="#6b7280" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Назначена: {task.assigned_to_name || "Не назначена"}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                        <Clock size={16} color="#6b7280" style={styles.detailIcon} />
                        <Text style={styles.detailText}>
                            {task.due_time
                                ? `Время: ${format(new Date(task.due_time), 'HH:mm', { locale: ru })}`
                                : "Время не указано"}
                        </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                        <ClipboardList size={16} color="#6b7280" style={[styles.detailIcon, styles.alignTop]} />
                        <Text style={[styles.detailText, styles.flexText]}>
                            Описание: {task.notes || "Нет описания"}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <CircleDotDashed size={20} color="#374151" style={styles.headerIcon} />
                    <Text style={styles.sectionTitle}>Статус</Text>
                </View>
                
                <View style={[styles.badge, { backgroundColor: statusColors.backgroundColor }]}>
                    <Text style={[styles.badgeText, { color: statusColors.textColor }]}>
                        {task.status_display}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 24,
    },
    section: {
        flex: 1,
        minWidth: 250,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerIcon: {
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    detailsList: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    alignTop: {
        marginTop: 2,
    },
    detailText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    flexText: {
        flex: 1,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '500',
    },
});